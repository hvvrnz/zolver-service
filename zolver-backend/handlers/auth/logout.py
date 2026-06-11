from sqlalchemy.ext.asyncio import AsyncSession
from repositories import auth_repo
from repositories import log_repo

async def logout(provider_id_hash: str, db: AsyncSession) -> dict:
    await auth_repo.revoke_login_record(db, provider_id_hash=provider_id_hash)
    await log_repo.write_log(
        db,
        provider_id_hash=provider_id_hash,
        table_name="login_sessions",
        action_type="UPDATE",
        payload={"action": "logout"}
    )
    return {"message": "logout success"}