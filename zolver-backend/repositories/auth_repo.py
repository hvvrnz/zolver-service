from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# Member/Guest 확인 (provider_id_hash로 세션 정보 조회) 
#세션 테이블에서 user_id의 존재 여부를 확인하여 유저의 권한 컨텍스트(Member/Guest)를 확인
async def check_is_member(db: AsyncSession, provider_id_hash: str):
    result = await db.execute(
        text("""
            SELECT 
                user_id, 
                provider_id_hash
            FROM login_sessions
            WHERE provider_id_hash = :phash
        """),
        {"phash": provider_id_hash}
    )
    # user_id가 있으면 Member, NULL이면 Guest
    return result.mappings().first()

async def find_login_record_by_provider(
    db: AsyncSession,
    provider_id_hash: str,
    provider: str
):
    result = await db.execute(
        text("""
            SELECT session_id, refresh_token_hash, user_id, provider_id_hash, nickname, is_revoked
            FROM login_sessions
            WHERE provider_id_hash = :pidh
            AND provider = :pv
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"pidh": provider_id_hash, "pv": provider}
    )
    return result.mappings().first()

async def find_login_session(
    db: AsyncSession,
    provider_id_hash: str,
):
    result = await db.execute(
        text("""
            SELECT session_id, refresh_token_hash, user_id, provider_id_hash, nickname
            FROM login_sessions
            WHERE provider_id_hash = :provider_id_hash
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"provider_id_hash": provider_id_hash}
    )
    return result.mappings().first()


async def create_login_record(
    db: AsyncSession,
    provider_id_hash: str,
    provider: str,
    nickname: str,
    refresh_token_hash: str,
    expires_at: datetime,
):
    await db.execute(
        text("""
            INSERT INTO login_sessions
            (provider_id_hash, provider, nickname, refresh_token_hash, expires_at)
            VALUES (:phash, :pv, :nickname, :rhash, :exp)
            ON CONFLICT (provider_id_hash, provider)
            DO UPDATE SET
                refresh_token_hash = :rhash,
                expires_at = :exp,
                is_revoked = false
        """),
        {
            "phash": provider_id_hash,
            "pv": provider,
            "nickname": nickname,
            "rhash": refresh_token_hash,
            "exp": expires_at,
        }
    )


async def update_login_record(
    db: AsyncSession,
    refresh_token_hash: str,
    provider_id_hash: str,
    expires_at: datetime,
    is_revoked: bool
):
    # 토큰 재발급 시 갱신
    await db.execute(
        text("""
            UPDATE login_sessions
            SET refresh_token_hash = :rhash,
                expires_at = :exp,
                is_revoked = :is_revoked
            WHERE provider_id_hash = :phash
        """),
        {"rhash": refresh_token_hash, "exp": expires_at, "is_revoked": is_revoked, "phash": provider_id_hash}
    )


async def link_user (
    db: AsyncSession,
    provider_id_hash: str,
    user_id: int
):
    # 성적표 업로드 완료 후 세션에 user_id 추가 update
    await db.execute(
        text("""
            UPDATE login_sessions
            SET user_id = :uid
            WHERE provider_id_hash = :pihash
        """),
        {"uid": user_id, "pihash": provider_id_hash}
    )


async def update_last_login(
    db: AsyncSession,
    user_id: int
):
    await db.execute(
        text("UPDATE users SET last_login_at = :now WHERE user_id = :uid"),
        {"now": datetime.now(timezone.utc), "uid": user_id}
    )


async def revoke_login_record(
    db: AsyncSession,
    provider_id_hash: str
):
    # 로그아웃 시 세션 무효화
    await db.execute(
        text("""
            UPDATE login_sessions
            SET is_revoked = true
            WHERE provider_id_hash = :phash
            AND is_revoked = false
        """),
        {"phash": provider_id_hash}
    )


async def extend_login_record(
    db: AsyncSession,
    session_id: int,
    expires_at: datetime
):
    await db.execute(
        text("UPDATE login_sessions SET expires_at = :exp WHERE session_id = :sid"),
        {"exp": expires_at, "sid": session_id}
    )

async def find_user_by_provider(
    db: AsyncSession,
    provider_id_hash: str,
    provider: str
):
    result = await db.execute(
        text("""
            SELECT user_id
            FROM login_sessions
            WHERE provider_id_hash = :pidh
            AND provider = :pv
            AND user_id IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"pidh": provider_id_hash, "pv": provider}
    )
    return result.mappings().first()

async def get_session_id(
    db: AsyncSession,
    provider: str,
    provider_id_hash: str
):
    result = await db.execute(
        text("""
            SELECT session_id
            FROM login_sessions
            WHERE provider_id_hash = :pidh
            AND provider = :provider
            LIMIT 1
        """),
        {"pidh": provider_id_hash, "provider": provider}
    )
    return result.scalar()


async def reactivate_login_record(
    db: AsyncSession,
    session_id: int
):
    await db.execute(
        text("""
            UPDATE login_sessions 
            SET is_revoked = false 
            WHERE session_id = :sid
        """),
        {"sid": session_id}
    )

