from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from core.security import get_current_user
from repositories import user_majors_repo
from repositories import auth_repo

router = APIRouter(prefix="/majors", tags=["majors"])


class MajorCreateRequest(BaseModel):
    major:      str
    major_type: str          # 예: '주전공', '복수전공', '부전공', '연계전공'
    college:    Optional[str] = None


class MajorUpdateRequest(BaseModel):
    major:      str
    major_type: str
    college:    Optional[str] = None


async def _get_user_id(db, pihash):
    session = await auth_repo.check_is_member(db, pihash)
    if not session or not session.get("user_id"):
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없어요.")
    return session["user_id"]


@router.get("")
async def get_my_majors(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = await _get_user_id(db, user["sub"])
    majors = await user_majors_repo.get_majors_by_user(db, user_id)
    return {"majors": majors}


@router.post("")
async def create_major(
    body: MajorCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = await _get_user_id(db, user["sub"])
    user_major_id = await user_majors_repo.create_major(
        db, user_id, body.major, body.major_type, body.college
    )
    return {"user_major_id": user_major_id, "message": "전공이 추가됐어요."}


@router.put("/{user_major_id}")
async def update_major(
    user_major_id: int,
    body: MajorUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = await _get_user_id(db, user["sub"])
    await user_majors_repo.update_major(
        db, user_major_id, user_id, body.major, body.major_type, body.college
    )
    return {"message": "전공이 수정됐어요."}


@router.delete("/{user_major_id}")
async def delete_major(
    user_major_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = await _get_user_id(db, user["sub"])
    await user_majors_repo.delete_major(db, user_major_id, user_id)
    return {"message": "전공이 삭제됐어요."}