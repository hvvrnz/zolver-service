
CONFIG = {
    'TITLE_MAP': {"main_title": (1, 1), "sub_title": (5, 1)},
    'EXPECTED_TITLES': {"main_title": "학생인적사항", "sub_title": "개인별전체성적조회"},
    'HEADER_ROW_IDX': 6,
    'HEADER_COL_INDICES': [1, 2, 4, 6, 11, 22, 24, 26, 32],
    'EXPECTED_HEADER_LIST': ["년도", "학기", "이수구분", "학수번호", "과목명", "학점", "등급", "인정구분", "삭제구분"],
    'ANCHOR_SEARCH_RANGE': (4, 21),  # 제목을 찾을 행 범위
    'HEADER_OFFSET': 1,              # 제목 바로 다음 행이 헤더
    'DATA_OFFSET': 2,                # 제목 두 칸 아래가 데이터 시작
}

USER_INFO_ROW = 2
USER_INFO_MAP = {
    "학번": 3,
    "학적상태": 16,
    "학생구분": 23,
    "학년": 28,
    "교직여부": 33
}
STUDENT_ID_YEAR_LENGTH = 4

USER_MAJOR_INFO_ROW = 3
USER_MAJOR_INFO_MAP = {
    "소속": 3,
    "기타전공": 18
}
MAJOR_SPLIT_LIMIT = 1
NA_KEYWORDS = ["없음", "None", "-", " ", "nan"]
MAJOR_COLUMN_NAMES = ["대학", "학과"]


LECTURE_START_ROW = 6
LECTURE_COLS = [1,2,4,6,11,22,24,26,32]
LECTURE_REQUIRED_POSITIONS = [0, 4] # 년도, 과목명 

MAJOR_END_ROW = LECTURE_START_ROW - 1




   