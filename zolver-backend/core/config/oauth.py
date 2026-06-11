from pydantic_settings import BaseSettings
# library: pydantic-settings

class OAuthSettings(BaseSettings):
    KAKAO_CLIENT_ID: str
    KAKAO_CLIENT_SECRET: str
    KAKAO_REDIRECT_URI: str
    FRONTEND_URL: str
    

oauth_settings = OAuthSettings()