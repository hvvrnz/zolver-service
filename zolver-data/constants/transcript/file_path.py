from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DATA_DIR = BASE_DIR / 'data' / 'transcipt' / 'processed'
TEMP_DATA_DIR = BASE_DIR / 'data' / 'transcript' / 'temp'
TRNASCRIPT_RAW_PATH = BASE_DIR / 'data' / 'transcript' / 'raw'