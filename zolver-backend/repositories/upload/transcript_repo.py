from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from core.security import generate_unique_hash
from repositories.tag_repo import auto_create_tag_group
import pandas as pd

from constants.db.mapping.lecture_evidence_map import (
    SYSTEM_CATEGORY_MAP,
    LECTURE_DEFAULTS
)
from constants.transcript.table_mapping import (
    LECTURE_EVIDENCE_TABLE_MAPPING,
    USERS_TABLE_MAPPING,
    USER_MAJORS_TABLE_MAPPING,
    SEMESTER_MAPPING
)

async def insert_user(
    db: AsyncSession,
    user_info: pd.DataFrame,
    nickname: str,
) -> int:
    user_row = user_info.rename(columns=USERS_TABLE_MAPPING).iloc[0]

    result = await db.execute(
        text("""
            INSERT INTO users (
                name, admission_year, enroll_status, student_type,
                grade, is_teaching
            ) VALUES (
                :name, :admission_year, :enroll_status, :student_type,
                :grade, :is_teaching
            )
            RETURNING user_id
        """),
        {
            "name":                    nickname,
            "admission_year":          int(user_row.get("admission_year")),
            "enroll_status":           user_row.get("enroll_status"),
            "student_type":            user_row.get("student_type"),
            "grade":                   int(user_row.get("grade")),
            "is_teaching":             user_row.get("is_teaching"),
        }
    )
    return result.scalar()

async def get_member_info(
    db: AsyncSession,
    user_id: int,
):
    result = await db.execute(
        text("""
            SELECT college, name, admission_year, enroll_status, student_type,
                grade, is_teaching, transcript_upload_count, total_credits, 
                major_credits, general_credits
            FROM users
            WHERE user_id = :user_id 
        """),
        {"user_id": user_id}
    )
    return result.mappings().first()

async def insert_user_majors(
    db: AsyncSession,
    user_major_info: pd.DataFrame,
    user_id: int
):
    renamed = user_major_info.rename(columns=USER_MAJORS_TABLE_MAPPING)
    for _, row in renamed.iterrows():
        await db.execute(
            text("""
                INSERT INTO user_majors (user_id, college, major, major_type)
                VALUES (:user_id, :college, :major, :major_type)
            """),
            {
                "user_id":    user_id,
                "college":    row.get("college"),
                "major":      row.get("major"),
                "major_type": "main",
            }
        )
        sub_major = row.get("sub_major")
        if pd.notna(sub_major):
            await db.execute(
                text("""
                    INSERT INTO user_majors (user_id, college, major, major_type)
                    VALUES (:user_id, :college, :major, :major_type)
                """),
                {
                    "user_id":    user_id,
                    "college":    None,
                    "major":      row.get("sub_major"),
                    "major_type": "sub",
                }
            )


async def insert_lecture_evidence(
    db: AsyncSession,
    lecture_df: pd.DataFrame,
    user_id: int,
    provider_id_hash: str,
):
    if lecture_df.empty:
        return 
    # 영문 매핑 테이블 적용 (unique_hash_base 컬럼은 그대로 유지)
    renamed = lecture_df.rename(columns=LECTURE_EVIDENCE_TABLE_MAPPING)
    user_info = await get_member_info(db,user_id)
    admission_year = user_info['admission_year']

    for _, row in renamed.iterrows():
        lecture_category = row.get("lecture_category")  # 전필/전선/기초/소양 등
        system_category  = SYSTEM_CATEGORY_MAP.get(
            lecture_category,
            LECTURE_DEFAULTS["system_category"]
        )
        unique_hash_base = row.get("unique_hash_base", "")
        unique_hash_raw = f"{provider_id_hash}:{unique_hash_base}"
        lec_unique_hash = generate_unique_hash(provider_id_hash, unique_hash_raw)

        await db.execute(
            text("""
                INSERT INTO lecture_evidence (
                    unique_hash, user_id, source_type,
                    taken_grade, taken_semester,
                    system_category, completion_year, completion_semester,
                    lecture_category, lecture_code, lecture_name,
                    lecture_credit, course_grade,
                    recognition_type, delete_type,
                    manual_status, status
                ) VALUES (
                    :unique_hash, :user_id, :source_type,
                    :taken_grade, :taken_semester,
                    :system_category, :completion_year, :completion_semester,
                    :lecture_category, :lecture_code, :lecture_name,
                    :lecture_credit, :course_grade,
                    :recognition_type, :delete_type,
                    :manual_status, :status
                )
                ON CONFLICT (unique_hash) DO NOTHING
            """),
            {   
                "unique_hash":         lec_unique_hash,
                "user_id":             user_id,
                "source_type":         LECTURE_DEFAULTS["source_type"],
                "manual_status":       LECTURE_DEFAULTS["manual_status"],
                "taken_grade":         _calculate_grade(row.get("completion_year"), admission_year),
                "taken_semester":      _normalize_semester(row.get("completion_semester")),
                "system_category":     system_category,
                "completion_year":     int(row.get("completion_year")),
                "completion_semester": row.get("completion_semester"),
                "lecture_category":    lecture_category,
                "lecture_code":        row.get("lecture_code"),
                "lecture_name":        row.get("lecture_name"),
                "lecture_credit":      int(row.get("lecture_credit")),
                "course_grade":        row.get("course_grade"),
                "recognition_type":    row.get("recognition_type") if pd.notna(row.get("recognition_type")) else None,
                "delete_type":         row.get("delete_type")       if pd.notna(row.get("delete_type"))       else None,
                "status":              LECTURE_DEFAULTS["status"],
            }
        )
        # ── lecture_category → course_tags.tag_group 자동 생성
        if lecture_category and system_category:
            await auto_create_tag_group(db, user_id, system_category, lecture_category)

async def update_upload_count(
    db: AsyncSession,
    user_id: int
):
    await db.execute(
        text("""
            UPDATE users
            SET transcript_upload_count = transcript_upload_count + 1
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    )

async def get_lec_evidence(
    db: AsyncSession,
    user_id: int
):
    result = await db.execute(
    text("""
            SELECT *
            FROM lecture_evidence
            WHERE user_id = :user_id 
        """),
        {"user_id": user_id}
    )
    return result.mappings().first()

# 이수학년 자동 계산 (사용자 수정가능)
def _calculate_grade(year, admission_year: int) -> int:
    try:
        return (int(str(year).split('.')[0]) - int(admission_year)) + 1
    except:
        return 1

# ex) 1학기 -> 1, 하계계절학기 -> summer
def _normalize_semester(semester_str: str) -> str:
    return SEMESTER_MAPPING.get(str(semester_str).strip(), "1")

