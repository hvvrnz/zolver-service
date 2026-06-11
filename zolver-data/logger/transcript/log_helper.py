from pathlib import Path
from logger.transcript.logger_transcript import *

class LogHelper:
    def __init__(self, file_path: Path, provider_id_hash: str):
        self.file_path = file_path
        self.provider_id_hash = provider_id_hash
        self.file_name = file_path.name
        self.history = {}
        self.transcript_val_logger = transcript_val_logger # logs/transcript_val 적재
        self.failed_schema_logger = failed_schema_logger # logs/failed_schema 적재
        self.schema_mismatch_masked_logger = schema_mismatch_masked_logger # logs/schema_mismatch_masked 적재

    def log_return(self, rule_no: str, result: bool, message: str = "", class_name: str = "Common"):
        if class_name not in self.history:
            self.history[class_name] = []
        log_data = {
            "rule_no": rule_no,
            "is_success": result,
            "message": message if message else ("SUCCESS" if result else "FAILED")
        }
        self.history[class_name].append(log_data)
        return result

    # === transcript_val_logger 호출 ===
    def log_transcript_val(self, is_success: bool):
        final_log = {
            "provider_id_hash": self.provider_id_hash,
            "file_name": self.file_name,
            "is_all_success": is_success,
            "history": self.history 
        }
        
        if is_success:
            self.transcript_val_logger.info(final_log)
        else:
            self.transcript_val_logger.error(final_log)

    def log_error(self, message: str):
        self.transcript_val_logger.error(message)

    def log_critical(self, message: str):
        self.transcript_val_logger.critical(message)

    def log_warning(self, message: str):
        self.transcript_val_logger.warning(message)

    # === failed_schema_logger 호출 (logs/failed_schema 적재) ===
    def log_failed_schema(self, rule_no: str, result: bool, report: dict, class_name: str = "Common"):
        final_log = {
            "provider_id_hash": self.provider_id_hash,
            "file_name": self.file_name,
            "rule_no": rule_no,
            "is_success": result,
            "history": class_name,
            "report": report
        }
        if not result:
            self.failed_schema_logger.error(final_log)
            return False
        return True
    
    def schema_mismatch_masked(self, report: dict):
        final_log = {
            "provider_id_hash": self.provider_id_hash,
            "file_name": self.file_name,
            "report": report
        }
        self.schema_mismatch_masked_logger.info(final_log)
        return True