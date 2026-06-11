"""
upsert.py
Task 3: lecture_frequency upsert + master 업데이트
"""
import json
from datetime import datetime
from config import get_session

# 학기 순서 정의
# 같은 year일 때 어떤 semester가 더 최신인지 판단
SEMESTER_ORDER = {
    '1학기':        1,
    '하계 계절학기': 2,
    '2학기':        3,
    '동계 계절학기': 4,
}

def is_more_recent(new_year, new_sem, old_year, old_sem):
    """
    새 이수년도/학기가 기존보다 더 최신인지 판단
    year 다르면 year로 비교
    year 같으면 SEMESTER_ORDER로 비교
    """
    if new_year != old_year:
        return new_year > old_year
    return SEMESTER_ORDER.get(new_sem, 0) > SEMESTER_ORDER.get(old_sem, 0)


def upsert_frequency(**context):
    """
    lecture_frequency upsert:
    ① match_count 누적
    ② total_val_score 누적
    ③ completion_year/semester 최신값으로 (SEMESTER_ORDER 기준)
    ④ completion_info 학번별 누적 {"22": 3, "23": 1}
    ⑤ score_update_reason: 점수가 왜 이렇게 됐는지
    ⑥ lecture_update_reason: 강의 정보가 왜 업데이트됐는지
    ⑦ is_promoted: curriculum이면 True, 아니면 False

    추후 돌릴 dag2인 promotion dag는 is_promoted가 False인 강의 중에서 승격여부 결정됨.
    ⑧ system_category: snap_system_category 값

    lecture_master(curriculum) 업데이트:
    ① validation_id 연결
    ② last_completed_year/semester 최신값으로
    ③ admission_stats 학번별 누적

    lecture_validation 업데이트:
    ① rule_id, validation_score, validation_log, finished_at

    lecture_evidence 업데이트:
    ① val_status → SUCCESS
    """
    scored_rows = context['ti'].xcom_pull(key='scored_rows')
    if not scored_rows:
        print("[upsert] 처리할 데이터 없음")
        return

    session = get_session()
    try:
        for row in scored_rows:
            # 학번 앞 2자리 (예: 2022 → "22")
            admission_year = str(row.get('snap_admission_year', ''))
            year_key = admission_year[2:4] if len(admission_year) >= 4 else admission_year

            completion_year     = row.get('snap_completion_year') or 0
            completion_semester = row.get('snap_completion_semester') or ''
            is_in_curriculum    = row.get('is_in_curriculum', False)

            # ----------------------------------------
            # 기존 frequency 데이터 조회
            # ① score_update_reason 작성용 (이전 값과 비교)
            # ② completion_year/semester 최신값 결정용
            # ----------------------------------------
            existing = session.execute("""
                SELECT total_val_score, match_count, completion_year, completion_semester
                FROM lecture_frequency
                WHERE lecture_code     = :code
                AND   lecture_name     = :name
                AND   lecture_credit   = :credit
                AND   lecture_category = :category
            """, {
                'code':     row['snap_lecture_code'],
                'name':     row['snap_lecture_name'],
                'credit':   row['snap_lecture_credit'],
                'category': row['snap_lecture_category'],
            }).fetchone()

            prev_score = float(existing['total_val_score'] or 0) if existing else 0
            prev_count = existing['match_count'] if existing else 0
            new_score  = prev_score + row['validation_score']
            new_count  = prev_count + 1

            # 최신 year/semester 결정
            # Python에서 SEMESTER_ORDER 기준으로 비교
            if existing and not is_more_recent(
                completion_year, completion_semester,
                existing['completion_year'] or 0,
                existing['completion_semester'] or ''
            ):
                final_year     = existing['completion_year']
                final_semester = existing['completion_semester']
            else:
                final_year     = completion_year
                final_semester = completion_semester

            # ----------------------------------------
            # score_update_reason: 점수가 왜 이렇게 됐는지
            # ----------------------------------------
            score_update_reason = json.dumps({
                "rule_code":        row['rule_code'],
                "is_in_curriculum": is_in_curriculum,
                "source_type":      row.get('snap_source_type'),
                "score_added":      row['validation_score'],
                "prev_total":       prev_score,
                "new_total":        new_score,
                "match_count":      new_count
            })

            # ----------------------------------------
            # lecture_update_reason: 강의 정보가 왜 업데이트됐는지
            # ----------------------------------------
            lecture_update_reason = json.dumps({
                "reason":         "airflow_l3_validation",
                "updated_fields": ["completion_year", "completion_semester", "admission_stats"],
                "new_year":       final_year,
                "new_semester":   final_semester,
                "batch_date":     datetime.now().strftime('%Y-%m-%d')
            })

            # ----------------------------------------
            # 1. lecture_frequency upsert
            # f-string으로 year_key 직접 넣기
            # (SQLAlchemy가 array[:year_key]를 파라미터로 오인 방지)
            # ----------------------------------------
            freq_sql = f"""
                INSERT INTO lecture_frequency (
                    validation_id,
                    lecture_code,
                    lecture_name,
                    lecture_credit,
                    lecture_category,
                    completion_year,
                    completion_semester,
                    total_val_score,
                    match_count,
                    is_promoted,
                    completion_info,
                    score_update_reason,
                    lecture_update_reason,
                    system_category,
                    updated_at
                ) VALUES (
                    :validation_id,
                    :lecture_code,
                    :lecture_name,
                    :lecture_credit,
                    :lecture_category,
                    :final_year,
                    :final_semester,
                    :score,
                    1,
                    :is_promoted,
                    CAST(:completion_info AS jsonb),
                    CAST(:score_update_reason AS jsonb),
                    CAST(:lecture_update_reason AS jsonb),
                    :system_category,
                    NOW()
                )
                ON CONFLICT (lecture_code, lecture_name, lecture_credit, lecture_category)
                DO UPDATE SET
                    match_count           = lecture_frequency.match_count + 1,
                    total_val_score       = lecture_frequency.total_val_score + :score,
                    completion_year       = :final_year,
                    completion_semester   = :final_semester,
                    completion_info       = jsonb_set(
                        COALESCE(lecture_frequency.completion_info, '{{}}'),
                        array['{year_key}'],
                        to_jsonb(COALESCE((lecture_frequency.completion_info->>'{year_key}')::int, 0) + 1)
                    ),
                    score_update_reason   = CAST(:score_update_reason AS jsonb),
                    lecture_update_reason = CAST(:lecture_update_reason AS jsonb),
                    system_category       = :system_category,
                    updated_at            = NOW()
            """
            session.execute(freq_sql, {
                'validation_id':         row['validation_id'],
                'lecture_code':          row['snap_lecture_code'],
                'lecture_name':          row['snap_lecture_name'],
                'lecture_credit':        row['snap_lecture_credit'],
                'lecture_category':      row['snap_lecture_category'],
                'final_year':            final_year,
                'final_semester':        final_semester,
                'score':                 row['validation_score'],
                'is_promoted':           is_in_curriculum,
                'completion_info':       json.dumps({year_key: 1}),
                'score_update_reason':   score_update_reason,
                'lecture_update_reason': lecture_update_reason,
                'system_category':       row.get('snap_system_category') or 'etc',
            })

            # ----------------------------------------
            # 2. lecture_master(curriculum) 업데이트
            # ----------------------------------------
            if is_in_curriculum and row.get('master_id'):
                master_sql = f"""
                    UPDATE lecture_master SET
                        validation_id           = :validation_id,
                        last_completed_year     = :final_year,
                        last_completed_semester = :final_semester,
                        admission_stats = jsonb_set(
                            COALESCE(admission_stats, '{{}}'),
                            array['{year_key}'],
                            to_jsonb(COALESCE((admission_stats->>'{year_key}')::int, 0) + 1)
                        ),
                        metadata = jsonb_set(
                            COALESCE(metadata, '{{}}'),
                            array['total_val_score'],
                            to_jsonb(
                                COALESCE((metadata->>'total_val_score')::numeric, 0) + :score
                            )
                        ),
                        updated_at = NOW()
                    WHERE std_lecture_id = :master_id
                """
                session.execute(master_sql, {
                    'validation_id':  row['validation_id'],
                    'final_year':     final_year,
                    'final_semester': final_semester,
                    'master_id':      row['master_id'],
                    'score':          row['validation_score'],
                })

            # ----------------------------------------
            # 3. lecture_validation 업데이트
            # ----------------------------------------
            validation_log = json.dumps({
                'rule_code':        row['rule_code'],
                'is_in_curriculum': is_in_curriculum,
                'processed_at':     datetime.now().isoformat()
            })
            session.execute(
                """UPDATE lecture_validation SET
                    rule_id          = :rule_id,
                    validation_score = :score,
                    validation_log   = CAST(:vlog AS jsonb),
                    finished_at      = NOW()
                WHERE validation_id = :vid""",
                {
                    'rule_id': row['rule_id'],
                    'score':   row['validation_score'],
                    'vlog':    validation_log,
                    'vid':     row['validation_id']
                }
            )

            # ----------------------------------------
            # 4. lecture_evidence val_status → SUCCESS
            # 탈퇴 유저(evidence 없음)는 skip
            # ----------------------------------------
            if row.get('evidence_lec_id'):
                session.execute(
                    "UPDATE lecture_evidence SET val_status = 'SUCCESS' WHERE evidence_lec_id = :eid",
                    {'eid': row['evidence_lec_id']}
                )

        session.commit()
        print(f"[upsert] 완료: {len(scored_rows)}건")

    except Exception as e:
        session.rollback()
        print(f"[upsert] 오류: {e}")
        raise
    finally:
        session.close()