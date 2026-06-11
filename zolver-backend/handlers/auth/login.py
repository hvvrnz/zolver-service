from datetime import datetime, timezone, timedelta
from sqlalchemy import RowMapping
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from core.config.settings import settings
from core.security import create_access_token, create_refresh_token, hash_token, generate_provider_id_hash
from handlers.oauth import kakao
from repositories import auth_repo
from repositories import log_repo

async def kakao_login(code: str, db: AsyncSession) -> dict:
    token_data = await kakao.get_token(code)
    if not token_data:
        raise ValueError("카카오 인증 실패")
    kakao_access_token = token_data["access_token"]

    user_info = await kakao.get_userinfo(kakao_access_token)
    if not user_info:
        raise ValueError("카카오 사용자 정보 조회 실패")
    
    provider_id = str(user_info["id"])
    provider_id_hash = generate_provider_id_hash(provider_id)
    name = user_info.get("properties", {}).get("nickname")

    login_session_row = await auth_repo.find_login_record_by_provider(db, provider_id_hash, "kakao")
    
    try:
        # new user
        if not login_session_row:
            return await create_new_user_session(
                db, 
                provider_id_hash=provider_id_hash, 
                provider="kakao", 
                nickname=name, 
                status="guest"
            )
        # guest
        elif await get_guest_user_session(db, login_session_row):
            return await is_refresh_token_valid(db, login_session_row, "guest")
        # member
        elif await get_member_user_session(db, login_session_row):
            return await is_refresh_token_valid(db, login_session_row, "member")
        else:
            raise ValueError(f"세션 상태가 올바르지 않습니다: {login_session_row}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise ValueError(f"세션 처리 중 오류: {str(e)}")

async def get_guest_user_session(db: AsyncSession, login_session_row: Optional[RowMapping]) -> bool:
    if login_session_row['provider_id_hash'] and login_session_row['user_id'] is None: 
        sub = login_session_row['provider_id_hash']
        payload = {"status": "guest", "provider": "kakao", "action": 'login'}
        await log_repo.write_log(db, 'user_actions_log', "INSERT", sub, payload)
        return True
    return False
    
async def get_member_user_session(db: AsyncSession, login_session_row: Optional[RowMapping]) -> bool:
    if login_session_row['provider_id_hash'] and login_session_row['user_id']: 
        sub = login_session_row['provider_id_hash']
        payload = {"status": "member", "provider": "kakao", "action": 'login'}
        await log_repo.write_log(db, 'users', "UPDATE", sub, payload)
        await auth_repo.update_last_login(db, login_session_row['user_id'])
        return True
    return False

async def is_refresh_token_valid(db: AsyncSession, login_session_row: Optional[RowMapping], status: str) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    sub = str(login_session_row['provider_id_hash'])
    new_access_token = create_access_token(sub, status)
    new_refresh_token = create_refresh_token(sub, status)
    
    if login_session_row['is_revoked']:
        await auth_repo.update_login_record(
            db,
            provider_id_hash=login_session_row['provider_id_hash'],
            refresh_token_hash=hash_token(new_refresh_token),
            expires_at=expires_at,
            is_revoked=False
        )
        log_payload = {"status": status, "provider": "kakao", "changes": "is_revoked, refresh_token_hash"}
        await log_repo.write_log(db, 'login_sessions', "UPDATE", sub, log_payload)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "status": status
    }

async def create_new_user_session(db: AsyncSession, provider_id_hash: str, provider: str, nickname: str, status: str) -> dict: 
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)  
    access_token = create_access_token(sub=provider_id_hash, status=status)
    refresh_token = create_refresh_token(sub=provider_id_hash, status=status)

    await auth_repo.create_login_record(db, provider_id_hash, provider, nickname, hash_token(refresh_token), expires_at)
    log_payload = {"status": status, "provider": provider, "action": 'login'}
    await log_repo.write_log(db, 'login_sessions', "INSERT", provider_id_hash, log_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "status": status
    }