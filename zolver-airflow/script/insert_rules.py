"""
insert_rules.py
validation_rule 테이블에 룰 데이터 삽입하는 스크립트
최초 1회 실행하면 됨
"""
import sys
sys.path.insert(0, '/opt/airflow/script')
from config import get_session

RULES = [
    {
        "rule_code": "R300",
        "metadata": {
            "name": "excel + curriculum",
            "description": "성적표 업로드 과목 (공식 커리큘럼 db 사전등록)",
            "weight": 1.5,
            "source_type": "excel",
            "is_in_curriculum": True
        }
    },
    {
        "rule_code": "R301",
        "metadata": {
            "name": "excel",
            "description": "성적표 업로드 과목 (공식 커리큘럼 db 미등록)",
            "weight": 1.0,
            "source_type": "excel",
            "is_in_curriculum": False
        }
    },
    {
        "rule_code": "R302",
        "metadata": {
            "name": "manual + curriculum",
            "description": "사용자 수기 등록 과목 (공식 커리큘럼 db 사전등록)",
            "weight": 0.8,
            "source_type": "manual",
            "is_in_curriculum": True
        }
    },
    {
        "rule_code": "R303",
        "metadata": {
            "name": "manual",
            "description": "사용자 수기 등록 과목 (공식 커리큘럼 db 미등록)",
            "weight": 0.5,
            "source_type": "manual",
            "is_in_curriculum": False
        }
    },
]

def insert_rules():
    session = get_session()
    try:
        for rule in RULES:
            session.execute("""
                INSERT INTO validation_rule (rule_code, metadata, is_active)
                VALUES (:rule_code, :metadata::jsonb, true)
                ON CONFLICT (rule_code) DO UPDATE
                SET metadata = :metadata::jsonb,
                    is_active = true
            """, {
                "rule_code": rule["rule_code"],
                "metadata": str(rule["metadata"]).replace("'", '"')
                            .replace("True", "true")
                            .replace("False", "false")
            })
        session.commit()
        print("룰 데이터 삽입 완료!")
        for rule in RULES:
            print(f"  {rule['rule_code']}: {rule['metadata']['name']} (가중치: {rule['metadata']['weight']})")
    except Exception as e:
        session.rollback()
        print(f"오류: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    insert_rules()