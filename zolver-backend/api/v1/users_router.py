from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from core.database import get_db
from core.security import get_current_user
from repositories import auth_repo
from handlers.users import delete as delete_handler

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_me(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(get_current_user)
):
    provider_id_hash = user_info['sub']
    status = user_info['status']

    if status == "guest":
        return {
            "status": "guest",
            "user": {"provider_id_hash": provider_id_hash}
        }

    session_info = await auth_repo.check_is_member(db, provider_id_hash)
    if not session_info or not session_info.get("user_id"):
        raise HTTPException(status_code=404, detail="User not found")

    user_id = session_info["user_id"]

    # college 컬럼 명시적 포함 (users_repo.get_user 가 college 를 누락하므로 직접 조회)
    result = await db.execute(
        text("""
            SELECT
                user_id,
                college,
                name,
                admission_year,
                enroll_status,
                student_type,
                grade,
                is_teaching,
                transcript_upload_count,
                created_at,
                last_login_at,
                total_credits,
                major_credits,
                general_credits,
                target_gpa,
                target_gpa_major
            FROM users
            WHERE user_id   = :user_id
              AND deleted_at IS NULL
        """),
        {"user_id": user_id}
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "status": "member",
        "user": dict(row)
    }


@router.delete("/me")
async def delete_me(
    db: AsyncSession = Depends(get_db),
    user_info: dict = Depends(get_current_user)
):
    provider_id_hash = user_info['sub']

    session_info = await auth_repo.check_is_member(db, provider_id_hash)
    if not session_info or not session_info.get("user_id"):
        raise HTTPException(status_code=404, detail="User not found")
    
    deleted_count = await delete_handler.delete_user(
        user_id=session_info["user_id"], 
        provider_id_hash=provider_id_hash, 
        db=db
    )
    
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="이미 탈퇴 처리되었거나 존재하지 않는 사용자입니다.")

    return {"message": "탈퇴 완료"}