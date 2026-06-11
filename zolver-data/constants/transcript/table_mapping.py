
LECTURE_EVIDENCE_TABLE_MAPPING = {
    "년도": "completion_year",
    "학기": "completion_semester",
    "이수구분": "lecture_category",
    "학수번호": "lecture_code",
    "과목명": "lecture_name",
    "학점": "lecture_credit",
    "등급": "course_grade",
    "인정구분": "recognition_type",
    "삭제구분": "delete_type"
}


USERS_TABLE_MAPPING = {
    "학번": "admission_year",
    "학적상태": "enroll_status",
    "학생구분": "student_type",
    "학년": "grade",
    "교직여부": "is_teaching",
}

USER_MAJORS_TABLE_MAPPING = {
    "대학": "college",
    "학과" : "major",
    "기타전공": "sub_major",
}

SEMESTER_MAPPING = {
    "1학기": "1",
    "2학기": "2",
    "하계 계절학기": "summer",
    "동계 계절학기": "winter",
}