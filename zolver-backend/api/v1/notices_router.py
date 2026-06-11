from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from core.database import get_db
from core.security import get_current_user

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get("")
async def get_notices(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        text("SELECT notice_id, content, created_at, updated_at FROM notices ORDER BY created_at DESC")
    )
    rows = result.mappings().all()
    
    # 여기서 필터링해서 리스트로 넘김
    notices = [
        dict(r) for r in rows 
        if r["content"].get("is_deleted") is False
    ]
    
    return {"notices": notices}