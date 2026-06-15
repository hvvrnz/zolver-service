from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from core.database import get_db
from core.security import get_current_user
from repositories.auth_repo import find_login_session
from repositories.ai_repo import get_ai_cache_status
from handlers.ai.recommend import handle_recommend, CACHE_MINUTES

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/recommend")
async def recommend_courses(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return await handle_recommend(db, provider_id_hash=user["sub"])


@router.get("/status")
async def get_ai_status(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    session = await find_login_session(db, provider_id_hash=user["sub"])
    user_id = session["user_id"]

    cached_at = await get_ai_cache_status(db, user_id)

    if not cached_at:
        return {"has_cache": False, "cooldown_minutes": 0, "minutes_ago": None}

    if isinstance(cached_at, str):
        cached_at = datetime.fromisoformat(cached_at)
    if cached_at.tzinfo is None:
        cached_at = cached_at.replace(tzinfo=timezone.utc)

    diff = datetime.now(timezone.utc) - cached_at
    minutes_ago = int(diff.total_seconds() / 60)
    cooldown_left = max(0, CACHE_MINUTES - minutes_ago)

    return {
        "has_cache": True,
        "cooldown_minutes": cooldown_left,
        "minutes_ago": minutes_ago
    }
