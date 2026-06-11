from sqlalchemy.ext.asyncio import AsyncSession
from repositories.lecture_repo import (
    get_my_lectures,
    get_verified_lectures,
    insert_manual_lecture,
    update_lecture,
    delete_lecture,
)
from repositories.tag_repo import get_tag_by_group, create_tag
from repositories import log_repo
from repositories.auth_repo import find_login_session

# 공통 유저 정보 확보 헬퍼 함수
async def get_user_info(db: AsyncSession, pihash: str) -> dict:
    user_info = await find_login_session(db, provider_id_hash=pihash)
    if not user_info or 'user_id' not in user_info:
        raise ValueError("유효하지 않은 세션이거나 사용자 정보가 존재하지 않습니다.")
    return user_info


# 1. 이수 과목 전체 조회
async def get_my_courses(db: AsyncSession, provider_id_hash: str):
    # 에러 수정: db 객체를 get_user_info에 정상 전달합니다.
    user_info = await get_user_info(db, provider_id_hash)
    user_id = user_info['user_id']

    lectures = await get_my_lectures(db, user_id)
    if not lectures:
        return {"courses": [], "total": 0}
    return {"courses": lectures, "total": len(lectures)}


# 2. 검증 마스터 과목 검색
async def search_verified_courses(db: AsyncSession, keyword: str = ""):
    lectures = await get_verified_lectures(db, keyword)
    if not lectures:
        return {"courses": [], "total": 0}
    return {"courses": lectures, "total": len(lectures)}


# 3. 자동 태그 그룹 매핑 로직
async def auto_create_tag_group(
    db: AsyncSession,
    user_info: dict,
    provider_id_hash: str,
    system_category: str,
    lecture_category: str
):
    user_id = user_info['user_id']
    user_credits = {
        'total_credits': user_info.get('total_credits', 132),
        'major_credits': user_info.get('major_credits', 40),
        'general_credits': user_info.get('general_credits', 30),
        'etc_credits': user_info.get('total_credits', 132) - user_info.get('major_credits', 40) - user_info.get('general_credits', 30)
    }
    
    existing = await get_tag_by_group(db, user_id, system_category, lecture_category)
    if existing:
        return  
    
    if system_category == 'major':
        min_credits = user_credits['major_credits']
    elif system_category == 'general':
        min_credits = user_credits['general_credits']
    elif system_category == 'etc':
        min_credits = user_credits['etc_credits']
    else:
        min_credits = 0
    
    await create_tag(
        db=db,
        user_id=user_id,
        system_category=system_category,
        tag_name=None,  
        min_credits=min_credits,
        tag_group=lecture_category  
    )
    
    await log_repo.write_log(
        db,
        table_name="course_tags",
        provider_id_hash=provider_id_hash,
        action_type="INSERT",
        payload={"action": "auto create tag group"}
    )


# 4. 과목 수동 추가 서비스
async def add_manual_course(db: AsyncSession, provider_id_hash: str, data: dict):
    user_info = await get_user_info(db, provider_id_hash)
    user_id = user_info['user_id']
    
    lecture_id = await insert_manual_lecture(db, user_id, provider_id_hash, data)

    if data.get("lecture_category") and data.get("system_category"):
        await auto_create_tag_group(
            db=db,
            user_info=user_info,
            provider_id_hash=provider_id_hash,
            system_category=data["system_category"],
            lecture_category=data["lecture_category"]
        )
    return {"lecture_evidence_id": lecture_id, "message": "과목이 추가되었습니다."}


# 5. 과목 수정 서비스
async def edit_course(db: AsyncSession, lecture_id: int, provider_id_hash: str, data: dict):
    user_info = await get_user_info(db, provider_id_hash)
    user_id = user_info['user_id']
    
    result = await update_lecture(db, lecture_id, user_id, data)
    if not result:
        raise ValueError("과목을 찾을 수 없거나 수정 권한이 없습니다.")
    return {"message": "과목이 수정되었습니다."}


# 6. 과목 삭제 서비스
async def remove_course(db: AsyncSession, lecture_id: int, provider_id_hash: str):
    user_info = await get_user_info(db, provider_id_hash)
    user_id = user_info['user_id']
    
    result = await delete_lecture(db, lecture_id, user_id)
    if not result:
        raise ValueError("과목을 찾을 수 없거나 삭제 권한이 없습니다.")
    return {"message": "과목이 삭제되었습니다."}