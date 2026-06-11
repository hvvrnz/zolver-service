from constants.transcript.table_mapping import USERS_TABLE_MAPPING, USER_MAJORS_TABLE_MAPPING, LECTURE_EVIDENCE_TABLE_MAPPING

LOAD_REGISTRY = {
    "users": {
        "mapping": USERS_TABLE_MAPPING,
        "table_name": "users"
    },
    "user_majors": {
        "mapping": USER_MAJORS_TABLE_MAPPING,
        "table_name": "user_majors"
    },
    "lecture": {
        "mapping": LECTURE_EVIDENCE_TABLE_MAPPING,
        "table_name": "lecture_evidences"
    }
}