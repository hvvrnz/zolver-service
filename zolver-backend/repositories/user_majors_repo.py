from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_majors_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        text("""
            SELECT user_major_id, user_id, major, major_type, college, is_anonymous
            FROM user_majors
            WHERE user_id = :user_id
            ORDER BY user_major_id
        """),
        {"user_id": user_id}
    )
    return [dict(row) for row in result.mappings().all()]


async def create_major(
    db: AsyncSession,
    user_id: int,
    major: str,
    major_type: str,
    college: str = None,
):
    result = await db.execute(
        text("""
            INSERT INTO user_majors (user_id, major, major_type, college)
            VALUES (:user_id, :major, :major_type, :college)
            RETURNING user_major_id
        """),
        {
            "user_id":    user_id,
            "major":      major,
            "major_type": major_type,
            "college":    college,
        }
    )
    return result.scalar()


async def update_major(
    db: AsyncSession,
    user_major_id: int,
    user_id: int,
    major: str,
    major_type: str,
    college: str = None,
):
    await db.execute(
        text("""
            UPDATE user_majors
            SET major      = :major,
                major_type = :major_type,
                college    = :college
            WHERE user_major_id = :user_major_id
            AND   user_id       = :user_id
        """),
        {
            "user_major_id": user_major_id,
            "user_id":       user_id,
            "major":         major,
            "major_type":    major_type,
            "college":       college,
        }
    )


async def delete_major(db: AsyncSession, user_major_id: int, user_id: int):
    await db.execute(
        text("""
            DELETE FROM user_majors
            WHERE user_major_id = :user_major_id
            AND   user_id       = :user_id
        """),
        {"user_major_id": user_major_id, "user_id": user_id}
    )