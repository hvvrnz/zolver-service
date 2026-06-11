import pandas as pd
import numpy as np

class DfTransformer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def to_none(self) -> 'DfTransformer':
        self.df = self.df.replace({np.nan: None})
        self.df = self.df.where(pd.notnull(self.df), None)
        return self

    def clear(self, keywords: list) -> 'DfTransformer':
        self.df = self.df.replace(keywords, None)
        return self

    def slice(self, col: str, length: int) -> 'DfTransformer':
        if col in self.df.columns:
            self.df[col] = (
                self.df[col].astype(str)
                .str.split('.').str[0]
                .str[:length]
            )
        return self

    def split(self, col: str, new_cols: list, split_limit: int, sep: str = " ") -> 'DfTransformer':
        if col in self.df.columns:
            # expand=True를 쓰면 쪼개진 결과가 바로 여러 컬럼이 됨
            # astype(str)로 안전하게 변환 후, 전달받은 n을 사용하여 분할
            split_df = self.df[col].astype(str).str.split(sep, n=split_limit, expand=True)
            # 쪼개진 결과 개수가 new_cols 개수와 맞는지 확인 후 대입
            for i, new_col in enumerate(new_cols):
                if i < len(split_df.columns):
                    self.df[new_col] = split_df[i]
        return self

    def get(self) -> pd.DataFrame:
        return self.df