from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from core.database import get_db
from core.security import get_current_user
from handlers.lecture.courses import (
    get_my_courses,
    search_verified_courses,
    add_manual_course,
    edit_course,
    remove_course
)
router = APIRouter(prefix="/courses", tags=["courses"])

# 1. 내 과목 전체 조회
@router.get("/me")
async def get_my_courses_route(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return await get_my_courses(db, provider_id_hash=user["sub"])

# 2. 검증된 과목 검색
@router.get("/verified")
async def get_verified_courses_route(
    keyword: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    return await search_verified_courses(db, keyword)

# 3. 과목 수동 추가 DTO
class CourseAddRequest(BaseModel):
    lecture_name:        str
    lecture_credit:      int
    system_category:     str
    lecture_category:    Optional[str] = ""
    lecture_code:        Optional[str] = "MANUAL"
    completion_year:     int
    completion_semester: str
    taken_grade:         Optional[int] = 1
    taken_semester:      Optional[str] = "1"
    course_grade:        Optional[str] = None
    delete_type:         Optional[str] = None

# 3. 과목 수동 추가 (member만 가능)
@router.post("/me")
async def add_course_route(
    body: CourseAddRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # guest 차단: 성적표 업로드한 유저만 수기 입력 가능
    if user.get("status") != "member":
        raise HTTPException(status_code=403, detail="성적표 업로드가 필요합니다.")
    try:
        return await add_manual_course(
            db=db,
            provider_id_hash=user["sub"],
            data=body.dict()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# 4. 과목 수정 DTO
class CourseUpdateRequest(BaseModel):
    lecture_name:        Optional[str] = None
    lecture_credit:      Optional[int] = None
    system_category:     Optional[str] = None
    lecture_category:    Optional[str] = None
    course_grade:        Optional[str] = None
    completion_year:     Optional[int] = None
    completion_semester: Optional[str] = None
    area:                Optional[str] = None
    delete_type:         Optional[str] = None

# 4. 과목 수정 (member만 가능)
@router.put("/me/{lecture_id}")
async def update_course_route(
    lecture_id: int,
    body: CourseUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # guest 차단
    if user.get("status") != "member":
        raise HTTPException(status_code=403, detail="성적표 업로드가 필요합니다.")
    try:
        return await edit_course(
            db=db,
            lecture_id=lecture_id,
            provider_id_hash=user["sub"],
            data=body.dict()
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# 5. 과목 삭제 (member만 가능)
@router.delete("/me/{lecture_id}")
async def delete_course_route(
    lecture_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # guest 차단
    if user.get("status") != "member":
        raise HTTPException(status_code=403, detail="성적표 업로드가 필요합니다.")
    try:
        return await remove_course(
            db=db,
            lecture_id=lecture_id,
            provider_id_hash=user["sub"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
