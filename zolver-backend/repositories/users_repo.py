from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("""
             SELECT user_id, name, admission_year, college
                    enroll_status, student_type, grade, is_teaching, 
                    transcript_upload_count, 
                    created_at, last_login_at,
                    total_credits, major_credits, general_credits
             FROM users 
             WHERE user_id = :uid
             AND deleted_at IS NULL
             """),
             {"uid": user_id}
    )
    return result.mappings().fetchone()


    # 탈퇴
async def delete_user(db: AsyncSession, user_id: int):
    # 1. unique_hash 충돌을 방지하기 위해 lecture_evidence는 예외 없이 싹 날립니다.
    # (이때 자식인 lecture_validation은 지워지지 않고 연동 컬럼만 자동으로 NULL이 되어 보존됩니다.)

     # 1. user_majors user_id null 처리
    await db.execute(
        text("UPDATE user_majors SET user_id = NULL WHERE user_id = :uid"),
        {"uid": user_id}
    )
    
    await db.execute(
        text("""
             DELETE FROM lecture_evidence 
             WHERE user_id = :uid
             """),
        {"uid": user_id}
    )
    
    # 2. 부모 테이블인 users에서 해당 유저 진짜 삭제
    result = await db.execute(
        text("""
             DELETE FROM users 
             WHERE user_id = :uid
             """),
        {"uid": user_id}
    )
    return result.rowcount