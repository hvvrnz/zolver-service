from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


# ── 플랜 ──────────────────────────────────────────
async def get_plans_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("""
            SELECT p.plan_id, p.year, p.semester, p.grade, p.max_credits, p.is_active,
                   COALESCE(SUM(c.lecture_credit), 0) AS total_credits
            FROM simulation_plans p
            LEFT JOIN simulation_courses c ON p.plan_id = c.plan_id
            WHERE p.user_id = :user_id
            GROUP BY p.plan_id
            ORDER BY p.year DESC, p.semester
        """),
        {"user_id": user_id}
    )
    return [dict(row) for row in result.mappings().all()]


async def create_plan(
    db: AsyncSession, user_id: int,
    year: int, semester: str, grade: int, max_credits: int
):
    result = await db.execute(
        text("""
            INSERT INTO simulation_plans (user_id, year, semester, grade, max_credits)
            VALUES (:user_id, :year, :semester, :grade, :max_credits)
            RETURNING plan_id
        """),
        {"user_id": user_id, "year": year, "semester": semester,
         "grade": grade, "max_credits": max_credits}
    )
    return result.fetchone().plan_id


async def update_plan(
    db: AsyncSession, plan_id: int, user_id: int,
    year: int, semester: str, grade: int, max_credits: int, is_active: bool
):
    await db.execute(
        text("""
            UPDATE simulation_plans
            SET year = :year, semester = :semester, grade = :grade,
                max_credits = :max_credits, is_active = :is_active,
                updated_at = NOW()
            WHERE plan_id = :plan_id AND user_id = :user_id
        """),
        {"plan_id": plan_id, "user_id": user_id, "year": year,
         "semester": semester, "grade": grade,
         "max_credits": max_credits, "is_active": is_active}
    )


async def delete_plan(db: AsyncSession, plan_id: int, user_id: int):
    await db.execute(
        text("DELETE FROM simulation_plans WHERE plan_id = :plan_id AND user_id = :user_id"),
        {"plan_id": plan_id, "user_id": user_id}
    )


# ── 과목 ──────────────────────────────────────────
async def get_courses_by_plan(db: AsyncSession, plan_id: int, user_id: int):
    result = await db.execute(
        text("""
            SELECT c.sim_course_id, c.plan_id, c.system_category,
                   c.tag_id, t.tag_name, t.tag_group,
                   c.lecture_credit, c.memo, c.is_active
            FROM simulation_courses c
            LEFT JOIN course_tags t ON c.tag_id = t.tag_id
            WHERE c.plan_id = :plan_id AND c.user_id = :user_id
            ORDER BY c.created_at
        """),
        {"plan_id": plan_id, "user_id": user_id}
    )
    return [dict(row) for row in result.mappings().all()]


async def create_course(
    db: AsyncSession, plan_id: int, user_id: int,
    system_category: str, tag_id: int | None,
    lecture_credit: int, memo: str | None
):
    result = await db.execute(
        text("""
            INSERT INTO simulation_courses
                (plan_id, user_id, system_category, tag_id, lecture_credit, memo)
            VALUES (:plan_id, :user_id, :system_category, :tag_id, :lecture_credit, :memo)
            RETURNING sim_course_id
        """),
        {"plan_id": plan_id, "user_id": user_id,
         "system_category": system_category, "tag_id": tag_id,
         "lecture_credit": lecture_credit, "memo": memo}
    )
    return result.fetchone().sim_course_id


async def update_course(
    db: AsyncSession, sim_course_id: int, user_id: int,
    system_category: str, tag_id: int | None,
    lecture_credit: int, memo: str | None,
    is_active: bool = True
):
    await db.execute(
        text("""
            UPDATE simulation_courses
            SET system_category = :system_category, tag_id = :tag_id,
                lecture_credit = :lecture_credit, memo = :memo,
                is_active = :is_active
            WHERE sim_course_id = :sim_course_id AND user_id = :user_id
        """),
        {"sim_course_id": sim_course_id, "user_id": user_id,
         "system_category": system_category, "tag_id": tag_id,
         "lecture_credit": lecture_credit, "memo": memo,
         "is_active": is_active}
    )


async def delete_course(db: AsyncSession, sim_course_id: int, user_id: int):
    await db.execute(
        text("""
            DELETE FROM simulation_courses
            WHERE sim_course_id = :sim_course_id AND user_id = :user_id
        """),
        {"sim_course_id": sim_course_id, "user_id": user_id}
    )