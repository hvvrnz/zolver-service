
class TranscriptMapper:
    @staticmethod
    # create type system_category as enum ('common', 'general','major','etc');
    def to_system_category(excel_val: str) -> str:
        return mapping.get(excel_val, "etc")

    @staticmethod
    def calculate_taken_grade(year_semester: str, admission_year: int) -> str:
        """2021-1 같은 문자열과 입학년도를 계산해 '1-1' 형태의 기본값 생성"""
        try:
            # '2021-1' -> [2021, 1]
            year, semester = map(int, year_semester.split('-'))
            # (이수연도 - 입학연도) + 1 = 학년
            grade = (year - admission_year) + 1
            return f"{grade}-{semester}"
        except (ValueError, AttributeError):
            return "1-1" # 형식이 잘못됐을 때의 세이프티 가드

    @staticmethod
    def to_custom_data(initial_grade: str):
        return {
            "initial_value": initial_grade,
            "is_modified": False,
            "history": [] # [{ "from": "1-1", "to": "2-1", "at": "2026-04-01" }] 식의 로그용
        }