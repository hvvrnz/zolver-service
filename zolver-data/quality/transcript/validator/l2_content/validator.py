from pathlib import Path
from utils.excel_util import ExcelUtil
from utils.hash_util import HashUtil
from constants.transcript.error_codes import RuleCode
from constants.transcript.excel_coords import CONFIG
from services.file_service import FileService
from services.transcript_pipeline import TranscriptPipeline
from quality.transcript.validator.base_validator import BaseValidator
from constants.transcript.file_rules import HASH_LEN, F_ROW_LIMIT, F_COL_LIMIT
from constants.transcript.keywords import WHITELIST, SAFE_KEYWORDS


class L2TranscriptValidator(BaseValidator):
    def __init__(self, log_helper):
        super().__init__(log_helper)
        self.pipeline = TranscriptPipeline(log_helper)
        self.steps = [
            (RuleCode.CONTENT_SCAN, lambda: ExcelUtil.check_word_in_excel(self.file_path, WHITELIST)),
            (RuleCode.SCHEMA_EXTRACT, self.prepare_schema_check),
            (RuleCode.SCHEMA_COORDS, self.verify_schema_coords),
            (RuleCode.DATA_EXTRACT, lambda: self.pipeline.extract(self.transcript_df)),
            (RuleCode.DATA_TRANSFORM, lambda: self.pipeline.transform()),
            (RuleCode.DATA_LOAD, lambda: self.pipeline.load())
        ]
        
    def prepare_schema_check(self):
        try:
            if not hasattr(self, 'transcript_df'):
                self.transcript_df = ExcelUtil.read_excel_to_df(self.file_path)
                return True
        except Exception as e:
            raise e
            return False

    def _failed_schema_load(self):
        try:
            sample_data = FileService.get_masked_sample(self.file_path, SAFE_KEYWORDS, F_ROW_LIMIT, F_COL_LIMIT)
            form_hash= HashUtil.gen_form_hash(sample_data, HASH_LEN)
            report = {
                "sample_10x10": sample_data,
                "form_hash": form_hash
            }
            self.log_helper.schema_mismatch_masked(report)
            return True
        except Exception as e:
            raise e
            return False
        

    def verify_schema_coords(self):
        try:
            self.our_transcript = False
            errors = {}
            max_row, max_col = self.transcript_df.shape
            for title_key, (r, c) in CONFIG['TITLE_MAP'].items():

                if r >= max_row or c >= max_col:
                    errors[title_key] = {"type": "SIZE_MISMATCH", "actual_size": (max_row, max_col)}
                    continue

                expected = CONFIG['EXPECTED_TITLES'][title_key]
                actual = str(self.transcript_df.iloc[r, c]).strip()

                if actual.replace(" ", "") != expected.replace(" ", ""):
                    errors[title_key] = {
                        "expected": expected,
                        "actual": actual,
                        "location": (r, c)
                    }

            header_row = CONFIG['HEADER_ROW_IDX']
            header_indices = CONFIG['HEADER_COL_INDICES']
            expected_headers = CONFIG['EXPECTED_HEADER_LIST']

            if header_row >= max_row:
                errors["header"] = {
                    "type": "HEADER_ROW_OUT_OF_BOUNDS",
                    "actual_size": (max_row, max_col),
                    "expected_row": header_row
                }
            else:
                actual_headers = []
                for col in header_indices:
                    if col < max_col:
                        actual_headers.append(str(self.transcript_df.iloc[header_row, col]).strip())
                    else:
                        actual_headers.append("OUT_OF_BOUNDS")

                if actual_headers != expected_headers:
                    errors["header"] = {
                        "type": "HEADER_MISMATCH",
                        "expected": expected_headers,
                        "actual": actual_headers,
                        "row_index": header_row
                    }
            if errors:
                self.log_helper.log_failed_schema(
                RuleCode.SCHEMA_COORDS.code, 
                False, 
                errors, 
                self.__class__.__name__
            )
                self._failed_schema_load()
                return False
            self.our_transcript = True   
            return True
        except Exception as e:
            raise e
            return False