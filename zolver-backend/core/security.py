import hashlib # 결정론적 sha256
from passlib.context import CryptContext # 비결정론적 bcrypt (refresh token 저장용)
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from repositories import auth_repo
from core.config.settings import settings

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

 # 성적표 업로드 한 유저 get (status = member)
async def get_active_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="access token이 아닙니다.")
        if payload.get("status") != "member":
            raise HTTPException(status_code=403, detail="user_id(성적표 업로드)가 필요합니다.")
        return int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")


# 성적표 업로드 여부 상관없이 현재 접속 중인 user get  (status = guest or member)
async def get_current_user( 
    auth_info: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = auth_info.credentials # 전체 인증 정보 객체'에서 '실제 JWT 문자열'만 추출
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="access token이 아닙니다.")
        return {
            "sub": payload.get("sub"),
            "status": payload.get("status")
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")


# [인증 및 세션 검증] 토큰의 유효성을 검사하고, DB 조회를 통해 세션정보를 확인하여 사용자의 정보 (Guesrt/Member)와 권한을 반환
async def get_authenticated_user(
    auth_info: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db) 
) -> dict:
    
    token_data = await get_all_user(auth_info) 
    sub_hash = token_data.get("sub")
    session = await auth_repo.find_session_for_auth(db, sub_hash)
    
    if not session:
        raise HTTPException(status_code=401, detail="세션 정보가 없습니다.")
    return session 


# status = guest (성적표 업로드 전) or member (성적표 업로드 후)
def create_access_token(sub: str, status: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(sub),
        "exp": expire,
        "type": "access",
        "status": status
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(sub: str, status: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(sub),
        "exp": expire,
        "type": "refresh",
        "status": status 
    }            
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def hash_token(token: str) -> str:
    return pwd_context.hash(token)


# DB 해시 내의 솔트와 설정을 추출하여 사용자 토큰을 동일 조건으로 재해싱 후 대조 (Bcrypt 검증)
def verify_token(token: str, hashed: str) -> bool:
    return pwd_context.verify(token, hashed)

# provider_id_hash 생성 
def generate_provider_id_hash(provider_id: str) -> str:
    salt = settings.SALT 
    return hashlib.sha256((provider_id + salt).encode()).hexdigest()

# unique hash (lec_evidence에 붙는 고유값)
def generate_unique_hash(pihash, uhashraw):
    salt = settings.SALT
    raw_text = f"{str(pihash)}:{str(uhashraw)}:{salt}"
    return hashlib.sha256(raw_text.encode()).hexdigest()
