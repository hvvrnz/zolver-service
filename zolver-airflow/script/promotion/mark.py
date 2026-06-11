"""
promotion_mark.py
Task 3: 승격 완료 표시
- lecture_frequency.is_promoted = True
- lecture_validation.is_standard = True
"""
from config import get_session


def mark_promoted(**context):
    """
    승격 완료된 것들 플래그 업데이트
    → 재승격 방지
    """
    promoted_ids = context['ti'].xcom_pull(key='promoted_ids')
    if not promoted_ids:
        print("[mark] 처리할 것 없음")
        return

    session = get_session()
    try:
        # lecture_frequency.is_promoted = True
        session.execute("""
            UPDATE lecture_frequency
            SET is_promoted = TRUE,
                updated_at  = NOW()
            WHERE frequency_id = ANY(:ids)
        """, {'ids': promoted_ids})

        # lecture_validation.is_standard = True
        session.execute("""
            UPDATE lecture_validation lv
            SET is_standard = TRUE
            WHERE lv.validation_id IN (
                SELECT lf.validation_id
                FROM lecture_frequency lf
                WHERE lf.frequency_id = ANY(:ids)
            )
        """, {'ids': promoted_ids})

        session.commit()
        print(f"[mark] is_promoted = True: {len(promoted_ids)}건")
        print(f"[mark] is_standard = True: {len(promoted_ids)}건")

    except Exception as e:
        session.rollback()
        print(f"[mark] 오류: {e}")
        raise
    finally:
        session.close()