from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from core.security import get_current_user
from handlers.simulation.simulation import (
    get_simulation, create_plan, update_plan, delete_plan,
    create_course, update_course, delete_course
)
from handlers.lecture.courses import get_user_info

router = APIRouter(prefix="/simulation", tags=["simulation"])


class PlanCreateRequest(BaseModel):
    year:        int
    semester:    str
    grade:       int
    max_credits: int = 18


class PlanUpdateRequest(BaseModel):
    year:        int
    semester:    str
    grade:       int
    max_credits: int
    is_active:   bool


class CourseCreateRequest(BaseModel):
    plan_id:         int
    system_category: str
    tag_id:          Optional[int] = None
    lecture_credit:  int = 3
    memo:            Optional[str] = None


class CourseUpdateRequest(BaseModel):
    system_category: str
    tag_id:          Optional[int] = None
    lecture_credit:  int = 3
    memo:            Optional[str] = None
    is_active:       bool = True

@router.get("")
async def get_simulation_route(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await get_simulation(user_info["user_id"], db)


@router.post("/plans")
async def create_plan_route(
    body: PlanCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await create_plan(
        user_info["user_id"], body.year, body.semester,
        body.grade, body.max_credits, db
    )


@router.put("/plans/{plan_id}")
async def update_plan_route(
    plan_id: int,
    body: PlanUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await update_plan(
        user_info["user_id"], plan_id, body.year, body.semester,
        body.grade, body.max_credits, body.is_active, db
    )


@router.delete("/plans/{plan_id}")
async def delete_plan_route(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await delete_plan(user_info["user_id"], plan_id, db)


@router.post("/courses")
async def create_course_route(
    body: CourseCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await create_course(
        user_info["user_id"], body.plan_id, body.system_category,
        body.tag_id, body.lecture_credit, body.memo, db
    )


@router.put("/courses/{sim_course_id}")
async def update_course_route(
    sim_course_id: int,
    body: CourseUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await update_course(
        user_info["user_id"], sim_course_id, body.system_category,
        body.tag_id, body.lecture_credit, body.memo,
        body.is_active, db
    )


@router.delete("/courses/{sim_course_id}")
async def delete_course_route(
    sim_course_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await delete_course(user_info["user_id"], sim_course_id, db)