import logging
from pathlib import Path
from datetime import datetime
import pytz
import json

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.now(pytz.timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M:%S'),
            "level": record.levelname,
            "logger": record.name
        }

        if isinstance(record.msg, dict):
            log_record.update(record.msg)
        else:
            log_record["message"] = record.getMessage()
        return json.dumps(log_record, ensure_ascii=False)

def get_common_formatter():
    return JsonFormatter()