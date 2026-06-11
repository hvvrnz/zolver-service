import traceback
from pathlib import Path
from constants.transcript.error_codes import RuleCode
from utils.file_util import FileUtil
from constants.transcript.validation_config import TRANSCRIPT_VALIDATORS

class ValidationService:
    @staticmethod
    def _automatic_cleanup(log_helper):
        """보안 및 자원 관리를 위해 서버 디스크에 남은 성적표 원본 파일을 완전히 삭제합니다."""
        try:
            path = log_helper.file_path
            if not path.exists():
                return
            if path.is_file():
                FileUtil.delete_file(path)
                print(f"[CLEANUP] 성적표 파일 삭제 성공: {path.name}", flush=True)
            elif path.is_dir():
                FileUtil.delete_dir(path)
        except Exception as e:
            print(f"CLEANUP ERROR] 파일 삭제 실패: {e} ", flush=True)
            pass

    @staticmethod
    def run_full_validation(log_helper) -> bool: 
        try:
            is_all_success = True
            for v_class in TRANSCRIPT_VALIDATORS:
                validator = v_class(log_helper)
                
                
                if not validator.validate_all():
                    is_all_success = False
                    if validator.delete_on_fail:
                        ValidationService._automatic_cleanup(log_helper)
                    break

            log_helper.log_transcript_val(is_success=is_all_success)
            if not is_all_success:
                ValidationService._automatic_cleanup(log_helper)
                
            return is_all_success

        except Exception as e:
            print(f"!!! [CRITICAL SYSTEM ERROR] 검증 프로세스 크래시 발생: {e}", flush=True)
            traceback.print_exc()
            
            log_helper.log_return(
                rule_no=RuleCode.SYSTEM_ERROR.code,
                result=False,
                message=f"{RuleCode.SYSTEM_ERROR.message} | {e}",
                class_name=ValidationService.__name__
            )
            
            ValidationService._automatic_cleanup(log_helper)
            return False