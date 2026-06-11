from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from handlers.upload.transcript import upload_transcript

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("")
async def upload_route(
    file: UploadFile = File(...), # File(...) = 필수값
    user: dict = Depends(get_current_user), # return sub, status
    db: AsyncSession = Depends(get_db)
):
    try:
        return await upload_transcript(
            file=file,
            pihash=user["sub"],
            status=user["status"],
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))