# app/api/v1/user_name_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel

from core.database import get_db
from core.security import get_current_user
from repositories import auth_repo

router = APIRouter(prefix="/users", tags=["users"])


class NameRequest(BaseModel):
    name: str


@router.patch("/me/name")
async def update_name(
    body: NameRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="이름을 입력해주세요.")

    session = await auth_repo.check_is_member(db, user["sub"])
    if not session or not session.get("user_id"):
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없어요.")

    await db.execute(
        text("UPDATE users SET name = :name WHERE user_id = :user_id"),
        {"name": body.name.strip(), "user_id": session["user_id"]}
    )
    return {"message": "이름이 변경됐어요."}