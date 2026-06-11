# docker exec -it zolver-api /bin/bash -c "python /app/zolver-backend/data/notices/sync_notices.py"
import asyncio
import json
import os
import sys

ROOT = "/app/zolver-backend"
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from core.config.db import db_settings
from notices_data import NOTICES

def get_db_url() -> str:
    s = db_settings
    return f"postgresql+asyncpg://{s.DB_USER}:{s.DB_PASSWORD}@{s.DB_HOST}:{s.DB_PORT}/{s.DB_NAME}"

async def sync():
    engine = create_async_engine(get_db_url(), echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as session:
        async with session.begin():
            rows = (await session.execute(text("SELECT notice_id, content FROM notices"))).mappings().all()
            existing = {r["content"]["title"]: {"notice_id": r["notice_id"], "content": r["content"]} 
                        for r in rows if isinstance(r["content"], dict) and "title" in r["content"]}

            for item in NOTICES:
                title = item["title"]
                payload = json.dumps(item, ensure_ascii=False)
                
                if title not in existing:
                    await session.execute(
                        text("INSERT INTO notices (content, updated_at) VALUES (CAST(:c AS jsonb), NOW())"),
                        {"c": payload}
                    )
                    print(f"  ✅ INSERT     │ {title}")
                elif existing[title]["content"] != item:
                    await session.execute(
                        text("UPDATE notices SET content = CAST(:c AS jsonb), updated_at = NOW() WHERE notice_id = :id"),
                        {"c": payload, "id": existing[title]["notice_id"]}
                    )
                    print(f"  🔄 UPDATE     │ {title}")
                else:
                    print(f"  ─  SKIP       │ {title}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(sync())