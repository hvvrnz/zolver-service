from pydantic_settings import BaseSettings
# library : pydantic-settings
# BaseSettings -> .env 읽고 타입 검증

class DBSettings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int = 5432
db_settings = DBSettings()