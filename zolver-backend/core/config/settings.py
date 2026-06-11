from pydantic_settings import BaseSettings
# library: pydantic-settings

class Settings(BaseSettings):
    SECRET_KEY: str 
    ALGORITHM: str = "HS256"   
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    SALT: str

    EXEMPT_PATHS: list[str] = [
        "/",                                # health check
        "/api/v1/auth/kakao/login",        # 카카오 로그인
        "/api/v1/auth/kakao/callback",     # 카카오 콜백
        "/api/v1/auth/refresh",            # 토큰 갱신
        "/docs",                           # FastAPI 문서
        "/openapi.json",                   # OpenAPI 스키마
        "/redoc",                          # ReDoc 문서
    ]

settings = Settings()