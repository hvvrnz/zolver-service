import logging
from constants.transcript.logger_config import *
from logger.config import get_common_formatter
from logging.handlers import TimedRotatingFileHandler

def setup_validators_loggers():
    failed_schema_logs_path = LOG_DIR / "failed_schema"
    transcript_val_logs_path = LOG_DIR / "transcript_val"
    schema_mismatch_masked_path = LOG_DIR/ "schema_mismatch_masked"

    failed_schema_logs_path.mkdir(parents=True, exist_ok=True)
    transcript_val_logs_path.mkdir(parents=True, exist_ok=True)
    schema_mismatch_masked_path.mkdir(parents=True, exist_ok=True)

    f_logger = logging.getLogger("failed_schema")
    v_logger = logging.getLogger("transcript_val")
    smm_logger = logging.getLogger("schema_mismatch_masked")

    formatter = get_common_formatter()

    # === Failed Schema Logger 설정 ===
    if not f_logger.handlers:
        f_logger.setLevel(logging.ERROR)
        f_handler = TimedRotatingFileHandler(
            filename=str(failed_schema_logs_path / "failed_schema.log"),
            when="D",
            interval=1,
            backupCount=LOG_BACKUP_COUNT,
            encoding=LOG_ENCODING
        )
        f_handler.setFormatter(formatter)
        f_logger.addHandler(f_handler)

    # === Transcript Validation Logger 설정 ===
    if not v_logger.handlers:
        v_logger.setLevel(logging.INFO)
        v_handler = TimedRotatingFileHandler(
            filename=str(transcript_val_logs_path / "transcript_val.log"),
            when="D",
            interval=1,
            backupCount=LOG_BACKUP_COUNT,
            encoding=LOG_ENCODING
        )
        v_handler.setFormatter(formatter)
        v_logger.addHandler(v_handler)
    
    if not smm_logger.handlers:
        smm_logger.setLevel(logging.INFO)
        smm_handler = TimedRotatingFileHandler(
            filename=str(schema_mismatch_masked_path / "schema_mismatch_masked.log"),
            when="D",
            interval=1,
            backupCount=LOG_BACKUP_COUNT,
            encoding=LOG_ENCODING
        )
        smm_handler.setFormatter(formatter)
        smm_logger.addHandler(smm_handler)

    return f_logger, v_logger, smm_logger

failed_schema_logger, transcript_val_logger, schema_mismatch_masked_logger  = setup_validators_loggers()