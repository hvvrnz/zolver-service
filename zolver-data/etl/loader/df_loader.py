import pandas as pd
from sqlalchemy.engine import Engine

class DfLoader:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def load_to_db(self, table_name: str, engine: Engine) -> bool:
        try:
            # if_exists='append': 이미 테이블이 있으므로 데이터를 이어 붙임.
            # index=False: 판다스의 인덱스(0, 1, 2...)는 DB에 inser x
            # method='multi': 여러 행을 한 번에 넣는 Bulk Insert 방식으로 성능을 향상
            self.df.to_sql(
                name=table_name,
                con=engine,
                if_exists='append',
                index=False,
                method='multi' 
            )
            return True
        except Exception as e:
            raise e