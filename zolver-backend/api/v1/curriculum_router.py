from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from core.database import get_db
from core.security import get_current_user
from repositories import auth_repo

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


async def _get_user_id(db, pihash):
    session = await auth_repo.check_is_member(db, pihash)
    if not session or not session.get("user_id"):
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없어요.")
    return session["user_id"]


class CurriculumRequest(BaseModel):
    content: dict   # JSONB — { "items": [{ "title": str, "body": str }] } 형태


@router.get("")
async def get_curriculum(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = await _get_user_id(db, user["sub"])
    result = await db.execute(
        text("""
            SELECT manual_curr_id, content, updated_at
            FROM user_manual_curriculum
            WHERE user_id = :user_id
            AND deleted_at IS NULL
            ORDER BY updated_at DESC
            LIMIT 1
        """),
        {"user_id": user_id}
    )
    row = result.mappings().first()
    if not row:
        return {"manual_curr_id": None, "content": {"items": []}, "updated_at": None}
    return dict(row)


@router.post("")
async def save_curriculum(
    body: CurriculumRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    user_id = await _get_user_id(db, user["sub"])
    import json

    # 기존 레코드 확인
    result = await db.execute(
        text("SELECT manual_curr_id FROM user_manual_curriculum WHERE user_id = :user_id AND deleted_at IS NULL"),
        {"user_id": user_id}
    )
    existing = result.scalar()

    if existing:
        await db.execute(
            text("""
                UPDATE user_manual_curriculum
                SET content = :content, updated_at = NOW()
                WHERE manual_curr_id = :id
            """),
            {"content": json.dumps(body.content, ensure_ascii=False), "id": existing}
        )
        return {"manual_curr_id": existing, "message": "저장됐어요."}
    else:
        result = await db.execute(
            text("""
                INSERT INTO user_manual_curriculum (user_id, content, updated_at)
                VALUES (:user_id, :content, NOW())
                RETURNING manual_curr_id
            """),
            {"user_id": user_id, "content": json.dumps(body.content, ensure_ascii=False)}
        )
        return {"manual_curr_id": result.scalar(), "message": "저장됐어요."}