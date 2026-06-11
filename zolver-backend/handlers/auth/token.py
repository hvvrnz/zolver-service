from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from core.config import settings
from core.security import create_access_token, verify_token
from repositories import auth_repo
from repositories import log_repo

# Refresh Token 검증, 세션 만료 시간을 연장 후 새로운 Access Token을 발급
async def rotate_session_token(refresh_token: str, db: AsyncSession) -> dict:
    try:
        payload = jwt.decode(
            refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        raise ValueError("EXPIRED_OR_INVALID_TOKEN")

    if payload.get("type") != "refresh":
        raise ValueError("유효하지 않은 토큰 (payload['type'] is not refresh)")
    sub = payload.get("sub")      # 사용자 식별자 (provider_id_hash)
    status = payload.get("status")  # 권한 상태 (Guest/Member)

    session = await auth_repo.find_login_session(db, str(sub))
    if not session:
        raise ValueError("세션을 찾을 수 없습니다.")
    elif not verify_token(refresh_token, session['refresh_token_hash']):
        raise ValueError("refreshroken 검증에 실패했습니다.")
    
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await auth_repo.extend_login_record(db, session['session_id'], new_expires_at)
    await log_repo.write_log(db, table_name="login_sessions", action_type="UPDATE", provider_id_hash=sub, payload={"action": "token_rotation"})

    return {
        "access_token": create_access_token(sub, status),
        "token_type": "bearer"
    }