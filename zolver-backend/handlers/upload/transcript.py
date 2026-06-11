import hmac
import hashlib
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile

from core.security import create_access_token
from repositories.upload import transcript_repo
from repositories import auth_repo, log_repo
from logger.transcript.log_helper import LogHelper
from services.validation_service import ValidationService
from services.transcript_pipeline import TranscriptPipeline
from utils.excel_util import ExcelUtil
from constants.transcript.file_path import TEMP_DATA_DIR
from utils.file_util import FileUtil


async def upload_transcript(
    file: UploadFile,
    pihash: str,
    status: str,
    db: AsyncSession
) -> dict:
    
    # file_load
    file_name = f"{pihash[:10]}_{file.filename}".replace(" ", "_")
    file_path = TEMP_DATA_DIR / file_name
    
    log_helper = LogHelper(file_path, pihash)
    await FileUtil.save_file(file, file_path)

    # L1/L2 Validator 로직 실행
    # 멱등성 위한 unique_hash를 가진 과목이 인식된다면, inser x
    try:
        # 4. L1 → L2 검증 (실패 시 validation_service 내부에서 1차로 지워주지만, 여기서도 이중 방어)
        is_valid = ValidationService.run_full_validation(log_helper)
        if not is_valid: 
            failed_rules = []
            for layer, rules in log_helper.history.items():
                for rule in rules:
                    if not rule.get("is_success"):
                        failed_rules.append(rule.get("rule_no"))
            raise ValueError(f"VALIDATION_FAILED:{','.join(failed_rules)}")

        # 5. 데이터 추출(Extract) 및 변환(Transform)
        file_path = log_helper.file_path
        transcript_df = ExcelUtil.read_excel_to_df(file_path)
        pipeline = TranscriptPipeline(log_helper)
        if not pipeline.extract(transcript_df):
            raise ValueError("성적표 데이터 추출 실패")
        pipeline.transform()

        # 6. 세션 조회
        session = await auth_repo.find_login_record_by_provider(db, pihash, "kakao")
        if not session:
            raise ValueError("세션이 없습니다")

        # 7. 멱등성 보장 및 user_id 식별 
        user_id = session.get('user_id')
        if not user_id: 
            user_id = await transcript_repo.insert_user(
                db,
                pipeline.user_info,
                session.nickname,
            )
            await transcript_repo.insert_user_majors(db, pipeline.user_major_info, user_id)
            await auth_repo.link_user(db, pihash, user_id)
            await log_repo.write_log(db, table_name="login_session", action_type="UPDATE", provider_id_hash = pihash, payload={"status" : "guest → member" , "action" : "link user_id"})
        
        else: 
            pass 

        # DB insert
        await transcript_repo.update_upload_count(db, user_id)
        await transcript_repo.insert_lecture_evidence(
            db, pipeline.lecture, user_id, pihash
        )
        await log_repo.write_log(
            db,
            table_name="lecture_evidence, course_tags, user_majors",
            action_type="INSERT",
            provider_id_hash=pihash,
            payload={"action": "upload_transcript"},
        )

        # 8. 처음 업로드한 사용자 새 토큰 발급 및 응답 반환
        if status == "guest":
            new_access_token = create_access_token(pihash, "member")
            await log_repo.write_log(db, table_name="login_session", action_type="UPDATE", provider_id_hash = pihash, payload={"status": "guest → member", "action": "update token status"})
            
            return {
                "status": "success",
                "access_token": new_access_token,
                "token_type": "bearer",
                "message": "성적표가 성공적으로 분석되었으며, Member 권한으로 승격되었습니다.",
            }

        else:
            await log_repo.write_log(db, table_name="lecture_evidence", action_type="UPDATE", provider_id_hash = pihash, payload={"status": "member" , "action": "upload transcript"})
            return {"message": "성적표 재업로드 및 데이터 동기화가 완료되었습니다.", "status": "success"}

    finally:
        if file_path.exists():
            FileUtil.delete_file(file_path)
            # flush=True를 줘서 지워졌다는 사실을 도커 로그창에 즉시 즉각적으로 각인시킵니다.
            print(f"=== [SECURITY] 유저 성적표 원본 안전하게 영구 삭제 완료: {file_name} ===", flush=True)
