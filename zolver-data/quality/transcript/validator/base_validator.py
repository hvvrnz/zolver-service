from constants.transcript.error_codes import RuleCode
from pathlib import Path

class BaseValidator:
    def __init__(self, log_helper):
        self.log_helper = log_helper
        self.provider_id_hash = log_helper.provider_id_hash
        self.file_path = log_helper.file_path
        self.file_name = self.file_path.name  
        self.steps = [] # validate 실행 함수 LIST
        self.delete_on_fail = False # 검증 실패 시 파일 삭제 여부

    def validate_all(self):
        try:
            current_rule = None
            for rule_code, step_func in self.steps:
                current_rule = rule_code # 현재 검사 중인 규칙 저장
                result = step_func()
                self.log_helper.log_return(
                    rule_no=rule_code.code,
                    result=result,
                    message=rule_code.message,
                    class_name=self.__class__.__name__
                )
                if not result:
                    return False
            return True  
            
        except Exception as e:
            error_msg = f"SYSTEM_ERROR: {type(e).__name__} | {e}"
            if current_rule:
                self.log_helper.log_return(
                    rule_no=current_rule.code,
                    result=False,
                    message=f"{current_rule.message} | {error_msg})",
                    class_name=self.__class__.__name__
                )
            return False