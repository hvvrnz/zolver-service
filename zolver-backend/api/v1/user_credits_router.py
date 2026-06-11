from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel

from core.database import get_db
from core.security import get_current_user
from repositories import auth_repo

router = APIRouter(prefix="/users", tags=["users"])


class CreditsRequest(BaseModel):
    total_credits:   int
    major_credits:   int
    general_credits: int


@router.patch("/me/credits")
async def update_credits(
    body: CreditsRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    session = await auth_repo.check_is_member(db, user["sub"])
    if not session or not session.get("user_id"):
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없어요.")

    user_id = session["user_id"]
    await db.execute(
        text("""
            UPDATE users
            SET total_credits   = :total_credits,
                major_credits   = :major_credits,
                general_credits = :general_credits
            WHERE user_id = :user_id
        """),
        {
            "user_id":         user_id,
            "total_credits":   body.total_credits,
            "major_credits":   body.major_credits,
            "general_credits": body.general_credits,
        }
    )
    return {"message": "학점 설정 완료"}