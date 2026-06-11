from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.database import get_db
from core.config import oauth_settings
from core.security import get_current_user
from handlers.auth.login import kakao_login
from handlers.auth.token import rotate_session_token
from handlers.auth.logout import logout


router = APIRouter(prefix="/auth", tags=["auth"])
class TokenRequest(BaseModel):
    refresh_token: str

@router.get("/kakao/login")
async def kakao_login_url():
    url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={oauth_settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={oauth_settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    return {"url": url}


@router.get("/kakao/callback")
async def kakao_callback(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    result = await kakao_login(code=code, db=db)
    
    # 프론트엔드로 토큰 담아서 리다이렉트
    frontend_url = f"{oauth_settings.FRONTEND_URL}/auth/callback"
    redirect_url = (
        f"{frontend_url}"
        f"?access_token={result['access_token']}"
        f"&refresh_token={result['refresh_token']}"
        f"&status={result['status']}"
    )
    return RedirectResponse(url=redirect_url)


@router.post("/refresh")
async def refresh_token(
    body: TokenRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await rotate_session_token(
            refresh_token=body.refresh_token,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/logout")
async def logout_route(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(get_current_user)
):
    return await logout(provider_id_hash=user_info['sub'], db=db)