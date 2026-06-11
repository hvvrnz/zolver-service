# handlers/users/delete.py
from repositories import users_repo, auth_repo, log_repo

async def delete_user(user_id: int, provider_id_hash: str, db): 
    await users_repo.delete_user(db, user_id)
    await auth_repo.revoke_login_record(db, provider_id_hash)
    await log_repo.write_log(
        db=db,
        table_name="users",
        action_type="DELETE",
        provider_id_hash=provider_id_hash,
        payload={"action": "user_withdrawal"}
    )