# app/api/v1/register_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List

from core.database import get_db
from core.security import get_current_user, create_access_token, create_refresh_token, hash_token
from repositories import auth_repo

router = APIRouter(prefix="/users", tags=["users"])


class MajorInput(BaseModel):
    major:      str
    major_type: str = 'green'   # color key
    college:    Optional[str] = None


class RegisterRequest(BaseModel):
    name:           str
    college:        str = '건국대학교글로컬'
    admission_year: int
    enroll_status:  str = '재학'
    student_type:   str = '일반'
    grade:          int = 1
    majors:         List[MajorInput] = []


@router.post("/register")
async def register_user(
    body: RegisterRequest,
    db:   AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    GUEST 사용자가 기본 정보를 입력하고 users 테이블에 등록.
    등록 후 status=member 로 새 토큰 발급.
    """
    provider_id_hash = user["sub"]

    # 이미 member면 중복 등록 방지
    session_info = await auth_repo.check_is_member(db, provider_id_hash)
    if session_info and session_info.get("user_id"):
        raise HTTPException(status_code=400, detail="이미 등록된 사용자예요.")

    # 1. users INSERT
    result = await db.execute(
        text("""
            INSERT INTO users (
                college, name, admission_year,
                enroll_status, student_type, grade,
                created_at, last_login_at
            ) VALUES (
                :college, :name, :admission_year,
                :enroll_status, :student_type, :grade,
                NOW(), NOW()
            )
            RETURNING user_id
        """),
        {
            "college":        body.college,
            "name":           body.name,
            "admission_year": body.admission_year,
            "enroll_status":  body.enroll_status,
            "student_type":   body.student_type,
            "grade":          body.grade,
        }
    )
    user_id = result.scalar()

    # 2. user_majors INSERT
    for m in body.majors:
        await db.execute(
            text("""
                INSERT INTO user_majors (user_id, major, major_type, college)
                VALUES (:user_id, :major, :major_type, :college)
            """),
            {
                "user_id":    user_id,
                "major":      m.major,
                "major_type": m.major_type,
                "college":    m.college,
            }
        )

    # 3. login_sessions.user_id 업데이트 (GUEST → MEMBER 연결)
    await db.execute(
        text("""
            UPDATE login_sessions
            SET user_id = :user_id
            WHERE provider_id_hash = :pihash
              AND is_revoked = false
        """),
        {"user_id": user_id, "pihash": provider_id_hash}
    )

    await db.commit()

    # 4. 새 토큰 발급 (status: member)
    new_access  = create_access_token(sub=provider_id_hash, status="member")
    new_refresh = create_refresh_token(sub=provider_id_hash, status="member")

    # 5. refresh_token_hash 업데이트 (bcrypt hash_token 사용)
    refresh_hash = hash_token(new_refresh)
    await db.execute(
        text("""
            UPDATE login_sessions
            SET refresh_token_hash = :rh
            WHERE user_id = :user_id AND is_revoked = false
        """),
        {"rh": refresh_hash, "user_id": user_id}
    )
    await db.commit()

    return {
        "message":       "등록 완료",
        "user_id":       user_id,
        "access_token":  new_access,
        "refresh_token": new_refresh,
    }