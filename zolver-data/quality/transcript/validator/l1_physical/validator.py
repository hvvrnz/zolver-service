from constants.transcript.error_codes import RuleCode
from utils.file_util import FileUtil
from utils.excel_util import ExcelUtil
from quality.transcript.validator.base_validator import BaseValidator
from constants.transcript.file_rules import MAX_FILE_SIZE, FILE_EXTENSION, LAST_MODIFIED_BY

class L1FileValidator(BaseValidator):
    def __init__(self, log_helper):
        super().__init__(log_helper)
        self.steps = [    
            (RuleCode.FILE_EXISTS, lambda: self.file_path.is_file()),             
            (RuleCode.HIDDEN_FILE, lambda: FileUtil.is_not_hidden(self.file_path)),           
            (RuleCode.FILE_SIZE, lambda: FileUtil.is_within_size_limit(self.file_path, MAX_FILE_SIZE)),              
            (RuleCode.FILE_EXTENSION, lambda: FileUtil.is_valid_extension(self.file_path, FILE_EXTENSION)),               
            (RuleCode.FILE_MODIFIER, self.verify_no_modification),       
            (RuleCode.FILE_TIMESTAMP, self.verify_creation_time_integrity) 
        ]
        self.delete_on_fail = True  # 실패하면 바로 삭제
        

    def _get_properties(self):
        if not hasattr(self, 'properties'):
            self.properties = ExcelUtil.load_properties(self.file_path)
        return self.properties
    
    def verify_no_modification(self) -> bool:
        props = self._get_properties()
        if props.last_modified_by == LAST_MODIFIED_BY:
            return True
        return False
    
    def verify_creation_time_integrity(self) -> bool:
        props = self._get_properties()
        if props.created == props.modified:
            return True
        return False