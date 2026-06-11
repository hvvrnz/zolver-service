from sqlalchemy.ext.asyncio import AsyncSession
from repositories import simulation_repo, tag_repo, lecture_repo


async def get_simulation(user_id: int, db: AsyncSession):
    plans = await simulation_repo.get_plans_by_user(db, user_id)
    result = []
    for plan in plans:
        courses = await simulation_repo.get_courses_by_plan(db, plan["plan_id"], user_id)
        result.append({**plan, "courses": courses})
    return result


async def create_plan(
    user_id: int, year: int, semester: str,
    grade: int, max_credits: int, db: AsyncSession
):
    plan_id = await simulation_repo.create_plan(
        db, user_id, year, semester, grade, max_credits
    )
    return {"plan_id": plan_id, "message": "플랜이 생성됐어요."}


async def update_plan(
    user_id: int, plan_id: int,
    year: int, semester: str, grade: int,
    max_credits: int, is_active: bool, db: AsyncSession
):
    await simulation_repo.update_plan(
        db, plan_id, user_id, year, semester, grade, max_credits, is_active
    )
    return {"message": "플랜이 수정됐어요."}


async def delete_plan(user_id: int, plan_id: int, db: AsyncSession):
    await simulation_repo.delete_plan(db, plan_id, user_id)
    return {"message": "플랜이 삭제됐어요."}


async def create_course(
    user_id: int, plan_id: int,
    system_category: str, tag_id: int | None,
    lecture_credit: int, memo: str | None,
    db: AsyncSession
):
    sim_course_id = await simulation_repo.create_course(
        db, plan_id, user_id, system_category, tag_id, lecture_credit, memo
    )
    return {"sim_course_id": sim_course_id, "message": "과목이 추가됐어요."}


async def update_course(
    user_id: int, sim_course_id: int,
    system_category: str, tag_id: int | None,
    lecture_credit: int, memo: str | None,
    is_active: bool,
    db: AsyncSession
):
    await simulation_repo.update_course(
        db, sim_course_id, user_id, system_category,
        tag_id, lecture_credit, memo, is_active
    )
    return {"message": "과목이 수정됐어요."}


async def delete_course(user_id: int, sim_course_id: int, db: AsyncSession):
    await simulation_repo.delete_course(db, sim_course_id, user_id)
    return {"message": "과목이 삭제됐어요."}