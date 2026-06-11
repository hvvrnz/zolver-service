"""
promotion_promote.py
Task 2: 승격 처리
- curriculum 있으면 UPDATE (year/semester/admission_stats/metadata)
- curriculum 없으면 verified로 INSERT
"""
import json
from datetime import datetime
from config import get_session


def check_and_promote(**context):
    """
    curriculum 있으면 → UPDATE만
    curriculum 없으면 → verified INSERT

    둘 다 metadata에 검증 정보 기록
    """
    candidates = context['ti'].xcom_pull(key='candidates')
    if not candidates:
        print("[promote] 승격 후보 없음")
        return

    session = get_session()
    promoted_ids = []

    try:
        for row in candidates:
            # metadata: 검증 정보 기록
            metadata = json.dumps({
                "total_val_score": float(row['total_val_score'] or 0)
            })

            if row['is_in_master'] and row['master_id']:
                # --------------------------------
                # curriculum에 있으면 UPDATE만
                # --------------------------------
                session.execute("""
                    UPDATE lecture_master SET
                        last_completed_year     = :year,
                        last_completed_semester = :semester,
                        admission_stats         = CAST(:completion_info AS jsonb),
                        metadata                = CAST(:metadata AS jsonb),
                        updated_at              = NOW()
                    WHERE std_lecture_id = :master_id
                """, {
                    'year':            row['completion_year'] or 0,
                    'semester':        row['completion_semester'] or '',
                    'completion_info': json.dumps(row['completion_info'] or {}),
                    'metadata':        metadata,
                    'master_id':       row['master_id'],
                })
                print(f"[promote] curriculum UPDATE: {row['lecture_name']}")

            else:
                # --------------------------------
                # curriculum 없으면 verified INSERT
                # --------------------------------
                session.execute("""
                    INSERT INTO lecture_master (
                        validation_id,
                        standard_type,
                        system_category,
                        lecture_code,
                        lecture_name,
                        category_type,
                        credits,
                        last_completed_year,
                        last_completed_semester,
                        admission_stats,
                        metadata,
                        updated_at
                    ) VALUES (
                        :validation_id,
                        'verified',
                        :system_category,
                        :lecture_code,
                        :lecture_name,
                        :lecture_category,
                        :lecture_credit,
                        :year,
                        :semester,
                        CAST(:completion_info AS jsonb),
                        CAST(:metadata AS jsonb),
                        NOW()
                    )
                    ON CONFLICT (lecture_code, lecture_name, credits, category_type)
                    WHERE standard_type = 'verified'
                    DO UPDATE SET
                        last_completed_year     = :year,
                        last_completed_semester = :semester,
                        admission_stats         = CAST(:completion_info AS jsonb),
                        metadata                = CAST(:metadata AS jsonb),
                        updated_at              = NOW()
                """, {
                    'validation_id':   row['validation_id'],
                    'system_category': row.get('system_category') or 'etc',
                    'lecture_code':    row['lecture_code'],
                    'lecture_name':    row['lecture_name'],
                    'lecture_category': row['lecture_category'],
                    'lecture_credit':  row['lecture_credit'],
                    'year':            row['completion_year'] or 0,
                    'semester':        row['completion_semester'] or '',
                    'completion_info': json.dumps(row['completion_info'] or {}),
                    'metadata':        metadata,
                })
                print(f"[promote] verified INSERT: {row['lecture_name']}")

            promoted_ids.append(row['frequency_id'])

        session.commit()
        print(f"[promote] 완료: {len(promoted_ids)}건")
        context['ti'].xcom_push(key='promoted_ids', value=promoted_ids)

    except Exception as e:
        session.rollback()
        print(f"[promote] 오류: {e}")
        raise
    finally:
        session.close()