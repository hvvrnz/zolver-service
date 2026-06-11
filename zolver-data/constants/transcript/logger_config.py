from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOG_DIR = BASE_DIR / 'logs'/'transcript'
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_BACKUP_COUNT = 90
LOG_ENCODING = "utf-8"