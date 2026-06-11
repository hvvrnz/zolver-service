from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_tags_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("""
            SELECT tag_id, system_category, tag_name, min_credits, tag_group
            FROM course_tags
            WHERE user_id = :user_id
            ORDER BY system_category, tag_name
        """),
        {"user_id": user_id}
    )
    return [dict(row) for row in result.mappings().all()]


async def get_tag_by_id(db: AsyncSession, tag_id: int, user_id: int):
    result = await db.execute(
        text("""
            SELECT *
            FROM course_tags
            WHERE user_id = :user_id
            AND tag_id = :tag_id
        """),
        {"user_id": user_id, "tag_id": tag_id}
    )
    return result.mappings().first()


async def get_tag_by_group(
    db: AsyncSession,
    user_id: int,
    system_category: str,
    tag_group: str
):
    result = await db.execute(
        text("""
            SELECT tag_id, system_category, tag_name, min_credits, tag_group
            FROM course_tags
            WHERE user_id = :user_id
              AND system_category = :system_category
              AND tag_group = :tag_group
            LIMIT 1
        """),
        {"user_id": user_id, "system_category": system_category, "tag_group": tag_group}
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def create_tag(
    db: AsyncSession,
    user_id: int,
    system_category: str,
    tag_name: str,
    tag_group: str,
    min_credits: int = 0,
):
    result = await db.execute(
        text("""
            INSERT INTO course_tags (user_id, system_category, tag_name, tag_group, min_credits)
            VALUES (:user_id, :system_category, :tag_name, :tag_group, :min_credits)
            RETURNING tag_id
        """),
        {
            "user_id": user_id,
            "system_category": system_category,
            "tag_name": tag_name,
            "min_credits": min_credits,
            "tag_group": tag_group
        }
    )
    return result.scalar()


async def update_tag(
    db: AsyncSession,
    tag_id: int,
    user_id: int,
    tag_name: str,
    min_credits: int,
    tag_group: str = None
):
    # ✅ 수정: updated_at 컬럼이 course_tags 테이블에 없으므로 제거
    await db.execute(
        text("""
            UPDATE course_tags
            SET tag_name    = :tag_name,
                min_credits = :min_credits,
                tag_group   = :tag_group
            WHERE tag_id  = :tag_id
            AND   user_id = :user_id
        """),
        {
            "tag_id":      tag_id,
            "user_id":     user_id,
            "tag_name":    tag_name,
            "min_credits": min_credits,
            "tag_group":   tag_group
        }
    )


async def delete_tag(db: AsyncSession, tag_id: int, user_id: int):
    await db.execute(
        text("""
            DELETE FROM course_tags
            WHERE tag_id  = :tag_id
            AND   user_id = :user_id
        """),
        {"tag_id": tag_id, "user_id": user_id}
    )


async def auto_create_tag_group(
    db: AsyncSession, user_id: int,
    system_category: str, tag_group: str
):
    """lecture_category → tag_group 자동 생성"""
    if not tag_group or not system_category:
        return
    await db.execute(
        text("""
            INSERT INTO course_tags (user_id, system_category, tag_group, tag_name)
            VALUES (:user_id, :system_category, :tag_group, '')
            ON CONFLICT (user_id, system_category, tag_group, tag_name) DO NOTHING
        """),
        {
            "user_id":         user_id,
            "system_category": system_category,
            "tag_group":       tag_group,
        }
    )
