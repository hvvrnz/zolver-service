"""
fetch.py
Task 1: 미검증 lecture_validation 데이터 조회
"""
from config import get_session


def fetch_unvalidated(**context):
    """
    검증 안 된 lecture_validation 데이터 조회

    조건:
    1. validation_score IS NULL → 아직 검증 안 된 것
    2. snap_lecture_code IS NOT NULL → snap 데이터 있는 것
    3. evidence READY 상태 OR evidence 없음(탈퇴 유저)

    snap_lecture_category 처리:
    - snap에 값 있으면 그대로
    - snap이 NULL이면 evidence에서 최신값
    - 탈퇴 유저(evidence 없음)는 NULL 그대로

    is_in_curriculum:
    - code + name + credit + category 4개 조건으로 판단
    """
    session = get_session()
    try:
        rows = session.execute("""
            SELECT
                lv.validation_id,
                lv.evidence_lec_id,
                lv.snap_lecture_code,
                lv.snap_lecture_name,
                lv.snap_lecture_credit,
                COALESCE(lv.snap_lecture_category, le.lecture_category) AS snap_lecture_category,
                lv.snap_system_category,
                lv.snap_completion_year,
                lv.snap_completion_semester,
                lv.snap_source_type,
                lv.snap_admission_year,
                lv.snap_college,
                EXISTS (
                    SELECT 1 FROM lecture_master lm
                    WHERE lm.lecture_code  = lv.snap_lecture_code
                    AND   lm.lecture_name  = lv.snap_lecture_name
                    AND   lm.credits       = lv.snap_lecture_credit
                    AND   lm.category_type = COALESCE(lv.snap_lecture_category, le.lecture_category)
                    AND   lm.standard_type = 'curriculum'
                ) AS is_in_curriculum,
                (
                    SELECT lm.std_lecture_id FROM lecture_master lm
                    WHERE lm.lecture_code  = lv.snap_lecture_code
                    AND   lm.lecture_name  = lv.snap_lecture_name
                    AND   lm.credits       = lv.snap_lecture_credit
                    AND   lm.category_type = COALESCE(lv.snap_lecture_category, le.lecture_category)
                    AND   lm.standard_type = 'curriculum'
                    LIMIT 1
                ) AS master_id
            FROM lecture_validation lv
            LEFT JOIN lecture_evidence le ON lv.evidence_lec_id = le.evidence_lec_id
            WHERE (
                le.val_status = 'READY'
                OR lv.evidence_lec_id IS NULL
            )
            AND lv.validation_score IS NULL
            AND lv.snap_lecture_code IS NOT NULL
        """).fetchall()

        result = [dict(r) for r in rows]
        print(f"[fetch] READY 상태 데이터: {len(result)}건")
        context['ti'].xcom_push(key='rows', value=result)

    finally:
        session.close()