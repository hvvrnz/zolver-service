"""
promotion_dag.py
lecture_frequency → lecture_master 승격 DAG

실행 순서:
fetch_candidates → check_and_promote → mark_promoted

로직은 script/ 폴더에:
- promotion_fetch.py   : 승격 후보 조회
- promotion_promote.py : curriculum UPDATE or verified INSERT
- promotion_mark.py    : is_promoted, is_standard = True
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import sys
sys.path.insert(0, '/opt/airflow/script')

from promotion.fetch   import fetch_candidates
from promotion.promote import check_and_promote
from promotion.mark    import mark_promoted

default_args = {
    'owner': 'zolver',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='lecture_promotion',
    default_args=default_args,
    description='lecture_frequency → lecture_master 승격',
    schedule_interval='0 1 * * *',  # 매일 새벽 1시
    start_date=datetime(2026, 6, 1),
    catchup=False,
    tags=['zolver', 'promotion'],
) as dag:

    task_fetch = PythonOperator(
        task_id='fetch_candidates',
        python_callable=fetch_candidates,
    )

    task_promote = PythonOperator(
        task_id='check_and_promote',
        python_callable=check_and_promote,
    )

    task_mark = PythonOperator(
        task_id='mark_promoted',
        python_callable=mark_promoted,
    )

    task_fetch >> task_promote >> task_mark