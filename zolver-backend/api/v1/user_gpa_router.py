from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from core.security import get_current_user
from repositories import auth_repo

router = APIRouter(prefix="/users", tags=["users"])


class GpaTargetRequest(BaseModel):
    target_gpa:       Optional[float] = None
    target_gpa_major: Optional[float] = None


@router.patch("/me/gpa-targets")
async def update_gpa_targets(
    body: GpaTargetRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    session = await auth_repo.check_is_member(db, user["sub"])
    if not session or not session.get("user_id"):
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없어요.")

    user_id = session["user_id"]

    # 보낸 필드만 업데이트 (None이면 해당 컬럼 건드리지 않음)
    updates = {}
    if body.target_gpa is not None or "target_gpa" in body.model_fields_set:
        updates["target_gpa"] = body.target_gpa
    if body.target_gpa_major is not None or "target_gpa_major" in body.model_fields_set:
        updates["target_gpa_major"] = body.target_gpa_major

    if not updates:
        return {"message": "변경 사항 없음"}

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["user_id"] = user_id

    await db.execute(
        text(f"UPDATE users SET {set_clause} WHERE user_id = :user_id"),
        updates
    )
    await db.commit()
    return {"message": "GPA 목표 설정 완료"}