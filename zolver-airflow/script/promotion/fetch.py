"""
promotion_fetch.py
Task 1: 승격 후보 조회
match_count >= 2, total_val_score >= 1.5, is_promoted = False
"""
from config import get_session


def fetch_candidates(**context):
    """
    lecture_frequency에서 임계값 초과한 것 조회
    - match_count >= 2: 2명 이상 이수
    - total_val_score >= 1.5: 신뢰도 점수 합계
    - is_promoted = False: 아직 승격 안 된 것
    """
    session = get_session()
    try:
        rows = session.execute("""
            SELECT
                lf.frequency_id,
                lf.validation_id,
                lf.lecture_code,
                lf.lecture_name,
                lf.lecture_credit,
                lf.lecture_category,
                lf.system_category,
                lf.completion_year,
                lf.completion_semester,
                lf.total_val_score,
                lf.match_count,
                lf.completion_info,

                -- lecture_master (curriculum, verified)에 이미 있는지 체크 (4개 조건)
                EXISTS (
                    SELECT 1 FROM lecture_master lm
                    WHERE lm.lecture_code  = lf.lecture_code
                    AND   lm.lecture_name  = lf.lecture_name
                    AND   lm.credits       = lf.lecture_credit
                    AND   lm.category_type = lf.lecture_category
                    AND   lm.standard_type IN('curriculum', 'verified')
                ) AS is_in_master,
                (
                    SELECT lm.std_lecture_id FROM lecture_master lm
                    WHERE lm.lecture_code  = lf.lecture_code
                    AND   lm.lecture_name  = lf.lecture_name
                    AND   lm.credits       = lf.lecture_credit
                    AND   lm.category_type = lf.lecture_category
                    AND   lm.standard_type IN('curriculum', 'verified')
                    LIMIT 1
                ) AS master_id
            FROM lecture_frequency lf
            WHERE lf.match_count >= 2
            AND   lf.total_val_score >= 1.5
            AND   lf.is_promoted = FALSE
        """).fetchall()

        result = [dict(r) for r in rows]
        print(f"[fetch] 승격 후보: {len(result)}건")
        context['ti'].xcom_push(key='candidates', value=result)

    finally:
        session.close()