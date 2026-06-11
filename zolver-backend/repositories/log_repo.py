import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def write_log(
    db: AsyncSession,
    table_name: str,
    action_type: str,
    provider_id_hash: str,
    payload: dict = None
):

    await db.execute(
        text("""
            INSERT INTO user_actions_log
            (provider_id_hash, table_name, action_type, payload, created_at)
            VALUES (:phash, :table, :action, :payload, :now)
        """),
        {
            "phash": provider_id_hash,
            "table": table_name,
            "action": action_type,
            "payload": json.dumps(payload, ensure_ascii=False) if payload else None,
            # ensure_ascii=False = 한글 그대로
            "now": datetime.now(timezone.utc)
        }
    )