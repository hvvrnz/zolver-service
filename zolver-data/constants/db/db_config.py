import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

load_dotenv()

db_url = URL.create(
    drivername="postgresql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT", 5432),
    database=os.getenv("DB_NAME")
)

engine = create_engine(db_url, pool_pre_ping=True) # 연결 확인 옵션 추가
SessionLocal = sessionmaker(bind=engine)