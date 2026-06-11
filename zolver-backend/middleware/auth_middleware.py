# middleware/auth_middleware.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from core.config import settings 


# 모든 요청에 대해 인증 검증
# front - 401 받으면 → 로그인 페이지로 리다이렉트
async def auth_middleware(request: Request, call_next):
    EXEMPT_PATHS = settings.EXEMPT_PATHS
    
    path = request.url.path # 제외 경로 확인 
    
    if path in EXEMPT_PATHS:
        response = await call_next(request)
        return response
    
    if request.method == "OPTIONS":
        response = await call_next(request)
        return response
    
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "인증 토큰이 없습니다. 로그인이 필요합니다."}
        )
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")
    except ValueError:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "잘못된 인증 형식입니다"}
        )
    
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        provider_id_hash = payload.get("sub")
        if not provider_id_hash:
            raise JWTError("Invalid token payload")
        
        # 검증 성공 → request.state에 사용자 정보 저장
        request.state.user_phash = provider_id_hash
        request.state.user_info = payload
        
    except JWTError as e:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": f"토큰이 유효하지 않습니다: {str(e)}"}
        )
    
    response = await call_next(request)
    return response