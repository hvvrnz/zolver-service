"""
validation_dag.py
L3 신뢰도 검증 DAG

실행 순서:
fetch_unvalidated → calculate_score → upsert_frequency

로직은 script/ 폴더에:
- fetch.py   : 미검증 데이터 조회
- score.py   : 룰 적용 및 점수 계산
- upsert.py  : frequency upsert + master 업데이트
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import sys

sys.path.insert(0, '/opt/airflow/script')

from validation.fetch  import fetch_unvalidated
from validation.score  import calculate_score
from validation.upsert import upsert_frequency

default_args = {
    'owner': 'zolver',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='l3_validation',
    default_args=default_args,
    description='L3 신뢰도 검증 및 lecture_frequency upsert',
    schedule_interval='0 0 * * *',  # 매일 자정
    start_date=datetime(2026, 6, 1),
    catchup=False,
    tags=['zolver', 'validation'],
) as dag:

    task_fetch = PythonOperator(
        task_id='fetch_unvalidated',
        python_callable=fetch_unvalidated,
    )

    task_score = PythonOperator(
        task_id='calculate_score',
        python_callable=calculate_score,
    )

    task_upsert = PythonOperator(
        task_id='upsert_frequency',
        python_callable=upsert_frequency,
    )

    task_fetch >> task_score >> task_upsert