from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from core.security import generate_unique_hash
from core.chosung import is_chosung, get_chosung


# 내 과목 전체 조회
async def get_my_lectures(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("""
            SELECT 
                evidence_lec_id, unique_hash, user_id, source_type,
                taken_grade, taken_semester,
                system_category, area, completion_year, completion_semester,
                lecture_category, lecture_code, lecture_name,
                lecture_credit, course_grade,
                recognition_type, delete_type,
                manual_status, status, is_anonymous
            FROM lecture_evidence
            WHERE user_id = :user_id
            ORDER BY completion_year, taken_semester
        """),
        {"user_id": user_id}
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


# 과목 수동 추가
async def insert_manual_lecture(db: AsyncSession, user_id: int, provider_id_hash: str, data: dict):
    lecture_code        = data.get("lecture_code", "MANUAL")
    completion_year     = data.get("completion_year", 2026)
    completion_semester = data.get("completion_semester", "1학기")
    lecture_category    = data.get("lecture_category", "")
    lecture_name        = data.get("lecture_name", "")

    # ✅ unique_hash 버그 수정: 기존 코드가 lecture_category를 두 번 써서
    # 같은 카테고리/년도/학기에 과목 두 개 추가하면 hash 충돌 발생했음
    # lecture_name을 포함해서 과목별로 고유한 hash가 되도록 수정
    uhashraw = f"{lecture_name}:{lecture_code}:{completion_year}:{completion_semester}"
    unique_hash = generate_unique_hash(pihash=provider_id_hash, uhashraw=uhashraw)

    try:
        result = await db.execute(
            text("""
                INSERT INTO lecture_evidence (
                    user_id, unique_hash, source_type,
                    taken_grade, taken_semester,
                    system_category, completion_year, completion_semester,
                    lecture_category, lecture_code, lecture_name,
                    lecture_credit, course_grade, manual_status, status
                ) VALUES (
                    :user_id, :unique_hash, 'manual',
                    :taken_grade, :taken_semester,
                    :system_category, :completion_year, :completion_semester,
                    :lecture_category, :lecture_code, :lecture_name,
                    :lecture_credit, :course_grade, 'fixed', 'active'
                )
                RETURNING evidence_lec_id
            """),
            {
                "user_id":             user_id,
                "unique_hash":         unique_hash,
                "taken_grade":         data.get("taken_grade", 1),
                "taken_semester":      data.get("taken_semester", "1"),
                "system_category":     data.get("system_category", "etc"),
                "completion_year":     completion_year,
                "completion_semester": completion_semester,
                "lecture_category":    lecture_category,
                "lecture_code":        lecture_code,
                "lecture_name":        lecture_name,
                "lecture_credit":      data.get("lecture_credit", 3),
                "course_grade":        data.get("course_grade") or None,
            }
        )
        return result.scalar()
    except IntegrityError:
        # unique_hash 중복 → 같은 학기에 동일 과목이 이미 등록되어 있음
        raise ValueError(f"'{lecture_name}' 과목이 이미 해당 학기에 등록되어 있어요.")


# 과목 수정
async def update_lecture(db: AsyncSession, lecture_id: int, user_id: int, data: dict):
    result = await db.execute(
        text("""
            UPDATE lecture_evidence
            SET
                lecture_name        = COALESCE(:lecture_name, lecture_name),
                lecture_credit      = COALESCE(:lecture_credit, lecture_credit),
                system_category     = COALESCE(:system_category, system_category),
                lecture_category    = COALESCE(:lecture_category, lecture_category),
                course_grade        = COALESCE(:course_grade, course_grade),
                completion_year     = COALESCE(:completion_year, completion_year),
                completion_semester = COALESCE(:completion_semester, completion_semester),
                area                = COALESCE(:area, area),
                delete_type         = :delete_type,
                manual_status       = 'fixed'
            WHERE evidence_lec_id = :lecture_id
            AND   user_id         = :user_id
            RETURNING evidence_lec_id
        """),
        {
            "lecture_id":          lecture_id,
            "user_id":             user_id,
            "lecture_name":        data.get("lecture_name"),
            "lecture_credit":      data.get("lecture_credit"),
            "system_category":     data.get("system_category"),
            "lecture_category":    data.get("lecture_category"),
            "course_grade":        data.get("course_grade") or None,
            "completion_year":     data.get("completion_year"),
            "completion_semester": data.get("completion_semester"),
            "area":                data.get("area"),
            "delete_type":         data.get("delete_type"),
        }
    )
    return result.mappings().fetchone()


# 과목 삭제
async def delete_lecture(db: AsyncSession, lecture_id: int, user_id: int):
    result = await db.execute(
        text("""
            DELETE FROM lecture_evidence
            WHERE evidence_lec_id = :lecture_id
            AND   user_id         = :user_id
            RETURNING evidence_lec_id
        """),
        {"lecture_id": lecture_id, "user_id": user_id}
    )
    return result.scalar()


# 마스터 과목 검색
async def get_verified_lectures(db: AsyncSession, keyword: str = ""):
    result = await db.execute(
        text("""
            SELECT
                std_lecture_id, lecture_code, lecture_name,
                category_type AS lecture_category,
                credits AS lecture_credit,
                system_category, standard_type, validation_id,
                area, curriculum_ver, last_completed_year,
                last_completed_semester, metadata, admission_stats, updated_at
            FROM lecture_master
            ORDER BY system_category, lecture_category, lecture_name
        """)
    )
    rows = [dict(row) for row in result.mappings().all()]

    if not keyword:
        return rows
    elif is_chosung(keyword):
        return [r for r in rows if keyword in get_chosung(r['lecture_name'])]
    else:
        return [r for r in rows if keyword.lower() in r['lecture_name'].lower()]