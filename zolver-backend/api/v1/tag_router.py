from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from core.security import get_current_user
from handlers.tag.tags import get_tags, create_tag, update_tag, delete_tag
from handlers.lecture.courses import get_user_info

router = APIRouter(prefix="/tags", tags=["tags"])


class TagCreateRequest(BaseModel):
    system_category: str
    tag_name: str
    min_credits: int = 0
    tag_group: Optional[str] = None


class TagUpdateRequest(BaseModel):
    tag_name:    Optional[str] = None
    min_credits: int = 0
    tag_group:   Optional[str] = None


@router.get("")
async def get_tags_route(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await get_tags(user_info["user_id"], db)

@router.post("")
async def create_tag_route(
    body: TagCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        user_info = await get_user_info(db, pihash=user["sub"])
        return await create_tag(
            db=db,
            user_id=user_info["user_id"],
            system_category=body.system_category,
            tag_name=body.tag_name,
            tag_group=body.tag_group,     
            min_credits=body.min_credits,                         
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{tag_id}")
async def update_tag_route(
    tag_id: int,
    body: TagUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        user_info = await get_user_info(db, pihash=user["sub"])
        return await update_tag(
            user_info["user_id"], tag_id, body.tag_name,
            body.min_credits, db, body.tag_group
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{tag_id}")
async def delete_tag_route(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    user_info = await get_user_info(db, pihash=user["sub"])
    return await delete_tag(user_info["user_id"], tag_id, db)