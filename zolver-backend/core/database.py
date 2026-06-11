from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from core.config import db_settings

DATABASE_URL = (
    f"postgresql+asyncpg://{db_settings.DB_USER}:{db_settings.DB_PASSWORD}"
    f"@{db_settings.DB_HOST}:{db_settings.DB_PORT}/{db_settings.DB_NAME}"
)

engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session # for depends
            await session.commit()
        except Exception:
            await session.rollback()
            raise