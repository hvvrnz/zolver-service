import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.auth_router import router as auth_router
from api.v1.upload_router import router as upload_router
from api.v1.users_router import router as users_router
from api.v1.user_credits_router import router as user_credits_router  
from api.v1.lecture_router import router as lecture_router
from api.v1.tag_router import router as tag_router
from api.v1.simulation_router import router as simulation_router
from api.v1.user_majors_router import router as user_majors_router    
from api.v1.curriculum_router import router as curriculum_router      
from api.v1.notices_router import router as notices_router           
from middleware.auth_middleware import auth_middleware
from api.v1.user_name_router import router as user_name_router
from api.v1.user_credits_router import router as user_credits_router
from api.v1.register_router import router as register_router
from api.v1.user_gpa_router import router as user_gpa_router
from api.v1.ai_router import router as ai_router

# 환경변수 ENV가 'prod'면 docs를 숨김
env = os.getenv("ENV", "dev")

app = FastAPI(
    title="Zolver API",
    docs_url=None if env == "prod" else "/docs",
    redoc_url=None if env == "prod" else "/redoc"
)
app.middleware("http")(auth_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://zolver.co.kr", "https://www.zolver.co.kr", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,         prefix="/api/v1")
app.include_router(upload_router,       prefix="/api/v1")
app.include_router(users_router,        prefix="/api/v1")
app.include_router(user_credits_router, prefix="/api/v1")  
app.include_router(lecture_router,      prefix="/api/v1")
app.include_router(tag_router,          prefix="/api/v1")
app.include_router(simulation_router,   prefix="/api/v1")
app.include_router(user_majors_router,  prefix="/api/v1")  
app.include_router(curriculum_router,   prefix="/api/v1")  
app.include_router(notices_router,      prefix="/api/v1")  
app.include_router(user_name_router,    prefix="/api/v1")
app.include_router(user_credits_router, prefix="/api/v1")
app.include_router(register_router, prefix="/api/v1")
app.include_router(user_gpa_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "zolver api"}