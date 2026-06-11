"""
dump_dag.py
서버 DB를 SSH 터널로 접속해서 pg_dump 뜨고
로컬 backups/ 폴더에 저장
7일 이상 된 파일 자동 삭제

흐름:
1. dump_database: SSH 터널 → pg_dump 실행
2. cleanup_old: 7일 이상 된 덤프 파일 삭제
"""
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {
    'owner': 'zolver',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# 덤프 파일 저장 위치
BACKUP_DIR = '/opt/airflow/backups'

# ========================
# Task 1: DB 덤프
# ========================
def dump_database(**context):
    """
    SSH 터널을 통해 서버 DB에 접속하고 pg_dump 실행
    파일명: zolver_db_YYYYMMDD_HHMMSS.sql
    """
    # 환경변수에서 서버 접속 정보 읽기
    server_host     = os.environ.get('SERVER_HOST')
    server_user     = os.environ.get('SERVER_USER', 'ubuntu')
    server_key_path = os.environ.get('SERVER_KEY_PATH')
    db_name         = os.environ.get('SERVER_DB_NAME', 'zolver_db')
    db_user         = os.environ.get('SERVER_DB_USER', 'zolver')
    db_password     = os.environ.get('SERVER_DB_PASSWORD')

    # backups 폴더 없으면 생성
    Path(BACKUP_DIR).mkdir(parents=True, exist_ok=True)

    # 파일명: 날짜+시간
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename  = f"zolver_db_{timestamp}.sql"
    filepath  = f"{BACKUP_DIR}/{filename}"

    # SSH 터널 통해 pg_dump 실행
    # -o StrictHostKeyChecking=no: 호스트 키 확인 skip
    cmd = [
        'ssh',
        '-i', server_key_path,
        '-o', 'StrictHostKeyChecking=no',
        f'{server_user}@{server_host}',
        f'PGPASSWORD={db_password} pg_dump -U {db_user} -d {db_name} --no-password'
    ]

    print(f"[dump] 덤프 시작: {filename}")

    with open(filepath, 'w') as f:
        result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        print(f"[dump] 오류: {result.stderr}")
        raise Exception(f"pg_dump 실패: {result.stderr}")

    # 파일 크기 확인
    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"[dump] 완료: {filename} ({size_mb:.2f} MB)")

    context['ti'].xcom_push(key='dump_file', value=filepath)


# ========================
# Task 2: 오래된 파일 삭제
# ========================
def cleanup_old(**context):
    """
    7일 이상 된 덤프 파일 삭제
    """
    backup_path = Path(BACKUP_DIR)
    if not backup_path.exists():
        print("[cleanup] backups 폴더 없음")
        return

    cutoff = datetime.now() - timedelta(days=7)
    deleted = []

    for f in backup_path.glob('zolver_db_*.sql'):
        # 파일 수정 시간 확인
        mtime = datetime.fromtimestamp(f.stat().st_mtime)
        if mtime < cutoff:
            f.unlink()
            deleted.append(f.name)
            print(f"[cleanup] 삭제: {f.name}")

    if deleted:
        print(f"[cleanup] 총 {len(deleted)}개 파일 삭제")
    else:
        print("[cleanup] 삭제할 파일 없음")


# ========================
# DAG 정의
# ========================
with DAG(
    dag_id='db_dump',
    default_args=default_args,
    description='서버 DB 백업 및 오래된 파일 정리',
    schedule_interval='0 2 * * *',  # 매일 새벽 2시
    start_date=datetime(2026, 6, 1),
    catchup=False,
    tags=['zolver', 'backup'],
) as dag:

    task_dump = PythonOperator(
        task_id='dump_database',
        python_callable=dump_database,
    )

    task_cleanup = PythonOperator(
        task_id='cleanup_old',
        python_callable=cleanup_old,
    )

    task_dump >> task_cleanup