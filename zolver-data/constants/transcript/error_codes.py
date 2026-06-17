from enum import Enum

class RuleCode(Enum):

    SYSTEM_ERROR = ("R000", "SYSTEM_ERROR")              # 시스템 오류

    # --- Layer 1: Physical Validation ---
    FILE_EXISTS      = ("R100", "FILE_EXISTENCE_CHECK")       # 파일 존재 확인
    FILE_EXTENSION   = ("R101", "FILE_EXTENSION_VALIDITY")    # 확장자 유효성
    FILE_SIZE        = ("R102", "FILE_SIZE_LIMIT_CHECK")      # 용량 제한 확인
    FILE_MODIFIER    = ("R103", "AUTHOR_INTEGRITY_CHECK")     # 작성자 무결성
    FILE_TIMESTAMP   = ("R104", "TIMESTAMP_LOGIC_CHECK")      # 시간 논리 확인
    HIDDEN_FILE      = ("R105", "HIDDEN_SYSTEM_FILE_CHECK")   # 숨김 파일 여부
    PATH_VALIDATION  = ("R106", "INPUT_PATH_TYPE_CHECK")      # 경로 타입 확인
    FILE_MOVEMENT    = ("R107", "TEMP_DIRECTORY_MOVEMENT")    # 임시 폴더 이동

    # Layer 2: Content Validation
    CONTENT_SCAN     = ("R200", "WHITELIST_CONTENT_SCAN")     # 화이트리스트 스캔
    SCHEMA_EXTRACT   = ("R201", "EXCEL_SCHEMA_EXTRACTION")    # 스키마 추출
    SCHEMA_COORDS    = ("R202", "COORDINATE_MAPPING_PROCESS") # 좌표 매핑 처리
    SCHEMA_DYNAMIC   = ("R206", "DYNAMIC_SCHEMA_RECOVERY") # 동적 스키마 복구 

    # ETL Process
    DATA_EXTRACT     = ("R203", "TRANSCRIPT_DATA_EXTRACTION") # 데이터 추출
    DATA_TRANSFORM   = ("R204", "TRANSCRIPT_DATA_TRANSFORM")  # 데이터 변환
    DATA_LOAD        = ("R205", "DATABASE_LOADING_PROCESS")   # 데이터 적재

   


    def __init__(self, code, message):
        self.code = code
        self.message = message


