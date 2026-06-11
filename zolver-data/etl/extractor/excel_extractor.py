import pandas as pd

class ExcelExtractor:
    @staticmethod
    def get_scalar_data(df: pd.DataFrame, row_idx: int, mapping: dict):
        try:
            target_row = df.iloc[row_idx]
            extracted_data = {
                field_name: target_row[col_idx] for field_name, col_idx in mapping.items()
            }
            return pd.DataFrame([extracted_data])
        except Exception as e:
            raise e
    
    @staticmethod
    def get_table_data(df: pd.DataFrame, start_row_idx: int, col_indices: list, required_cols: list):
    # 범위, 인덱스 리스트만 받아서 테이블 형태의 데이터 추출
        try:
            raw_table = df.iloc[start_row_idx:, col_indices].copy()
            required_cols = [raw_table.columns[i] for i in required_cols]
            cleaned_table = raw_table.dropna(subset=required_cols)
            return cleaned_table
        except Exception as e:
            raise e