"""
score.py
Task 2: 룰 적용 및 신뢰도 점수 계산
"""
import json
from config import get_session

def calculate_score(**context):
    """
    source_type + is_in_curriculum 조합으로 룰 결정

    R300: excel + curriculum  → 1.5
    R301: excel only          → 1.0
    R302: manual + curriculum → 0.8
    R303: manual only         → 0.5

    가중치는 validation_rule 테이블에서 읽어옴
    → 가중치 변경 시 DB만 수정하면 됨
    """
    rows = context['ti'].xcom_pull(key='rows')
    if not rows:
        print("[score] 처리할 데이터 없음")
        return

    session = get_session()
    try:
        rules = session.execute("""
            SELECT rule_id, rule_code, metadata
            FROM validation_rule
            WHERE is_active = true
        """).fetchall()

        rule_map = {}
        for r in rules:
            meta = r['metadata'] if isinstance(r['metadata'], dict) else json.loads(r['metadata'])
            rule_map[r['rule_code']] = {
                'rule_id': r['rule_id'],
                'weight':  meta['weight']
            }

        scored = []
        for row in rows:
            source_type      = row.get('snap_source_type')
            is_in_curriculum = row.get('is_in_curriculum', False)

            if source_type == 'excel' and is_in_curriculum:
                rule_code = 'R300'
            elif source_type == 'excel' and not is_in_curriculum:
                rule_code = 'R301'
            elif source_type == 'manual' and is_in_curriculum:
                rule_code = 'R302'
            else:
                rule_code = 'R303'

            rule = rule_map.get(rule_code, {'rule_id': None, 'weight': 0.5})
            row['rule_code']        = rule_code
            row['rule_id']          = rule['rule_id']
            row['validation_score'] = rule['weight']
            scored.append(row)

        print(f"[score] 점수 계산 완료: {len(scored)}건")
        context['ti'].xcom_push(key='scored_rows', value=scored)

    finally:
        session.close()