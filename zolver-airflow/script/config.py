import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Docker 환경변수에서 DB 연결 정보 읽어옴
DB_HOST = os.environ.get("ZOLVER_DB_HOST", "host.docker.internal")
DB_PORT = os.environ.get("ZOLVER_DB_PORT", "5432")
DB_NAME = os.environ.get("ZOLVER_DB_NAME", "zolver_db_local")
DB_USER = os.environ.get("ZOLVER_DB_USER", "zolver")
DB_PASSWORD = os.environ.get("ZOLVER_DB_PASSWORD", "")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_engine():
    return create_engine(DATABASE_URL)

def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()