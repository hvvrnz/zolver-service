import pandas as pd
from constants.transcript.excel_coords import *
from constants.db.mapping import *
from etl.extractor.excel_extractor import ExcelExtractor
from etl.transformer.df_transformer import DfTransformer

class TranscriptPipeline:
    def __init__(self, log_helper):
        self.log_helper = log_helper
        self.transcript = None
        self.user_info = pd.DataFrame()
        self.user_major_info = pd.DataFrame() 
        self.lecture = pd.DataFrame()

    def extract(self, transcript_df: pd.DataFrame):
        self.transcript = transcript_df
        try: 
            self.user_info = ExcelExtractor.get_scalar_data(
                self.transcript, USER_INFO_ROW, USER_INFO_MAP
            )
            
            major_list = []
            for r in range(USER_MAJOR_INFO_ROW, MAJOR_END_ROW):
                row_data = ExcelExtractor.get_scalar_data(self.transcript, r, USER_MAJOR_INFO_MAP)
                if not row_data.empty:
                    major_list.append(row_data)
            self.user_major_info = pd.concat(major_list, ignore_index=True) if major_list else pd.DataFrame()
            
            self.lecture = ExcelExtractor.get_table_data(
                self.transcript, LECTURE_START_ROW, LECTURE_COLS, LECTURE_REQUIRED_POSITIONS
            )
            
            if self.user_info.empty or self.lecture.empty:
                return False
            return True
        except Exception as e:
            raise e

    def transform(self):
        try: 
            student_id_col = list(USER_INFO_MAP.keys())[0]
            self.user_info = (
                DfTransformer(self.user_info)
                .slice(student_id_col, STUDENT_ID_YEAR_LENGTH)
                .to_none()
                .get()
            )
            major_keys = list(USER_MAJOR_INFO_MAP.keys())
            main_major_col = major_keys[0] # "소속"
            
            self.user_major_info = (
                DfTransformer(self.user_major_info)
                .to_none()
                .clear(NA_KEYWORDS)
                .split(main_major_col, MAJOR_COLUMN_NAMES, MAJOR_SPLIT_LIMIT, sep=" ")
                .get()
                .dropna(how='all')
                .reset_index(drop=True)
            )
            if main_major_col in self.user_major_info.columns:
                self.user_major_info = self.user_major_info.drop(columns=main_major_col)  # 원본 "소속" 컬럼은 분리가 완료됐으니 삭제

            self.lecture.columns = self.lecture.iloc[0]  # 첫 행을 헤더로
            self.lecture = self.lecture.iloc[1:].reset_index(drop=True)  # 첫 행 제거

            self.lecture = (
                DfTransformer(self.lecture)
                .to_none()
                .get()
            )
            self.lecture['unique_hash_base'] = self.lecture.apply(
                lambda row: f"{str(row.get('학수번호', ''))}:{str(row.get('년도', ''))}:{str(row.get('학기', ''))}:{str(row.get('이수구분', ''))}",
                axis=1
            )
            return True

        except Exception as e:
            raise e

    def load(self):
        try:
            pass     
            return True
        
        except Exception as e:
            raise e