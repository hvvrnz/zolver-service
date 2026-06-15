from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, timezone, timedelta


async def get_user_ai_info(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("""
            SELECT total_credits, major_credits, general_credits,
                   target_gpa, target_gpa_major, ai_recommend, ai_recommend_at,
                   admission_year
            FROM users WHERE user_id = :uid
        """),
        {"uid": user_id}
    )
    return dict(result.mappings().fetchone())


async def get_major_info(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("SELECT major FROM user_majors WHERE user_id = :uid"),
        {"uid": user_id}
    )
    return result.mappings().all()


async def get_curriculum_memo(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("SELECT content FROM user_manual_curriculum WHERE user_id = :uid ORDER BY updated_at DESC LIMIT 1"),
        {"uid": user_id}
    )
    return result.mappings().fetchone()


async def save_ai_recommend(db: AsyncSession, user_id: int, text_content: str):
    await db.execute(
        text("UPDATE users SET ai_recommend = :txt, ai_recommend_at = NOW() WHERE user_id = :uid"),
        {"txt": text_content, "uid": user_id}
    )
    await db.commit()


async def get_ai_cache_status(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("SELECT ai_recommend_at FROM users WHERE user_id = :uid"),
        {"uid": user_id}
    )
    row = result.mappings().fetchone()
    return row["ai_recommend_at"] if row else None