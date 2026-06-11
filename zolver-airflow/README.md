# Zolver Airflow DAG

건국대학교 글로컬캠퍼스 졸업요건 분석 서비스 Zolver의 배치 파이프라인입니다.

---

## 환경

- Apache Airflow 2.9.1
- Python 3.12
- PostgreSQL 15

### 폴더 구조

```
zolver-airflow/
├── dags/
│   ├── validation_dag.py    ← L3 신뢰도 검증 DAG
│   └── promotion_dag.py     ← 강의 승격 DAG
├── script/
│   ├── config.py            ← DB 연결 설정
│   ├── insert_rules.py      ← 검증 룰 초기 데이터 삽입 (최초 1회)
│   ├── validation/
│   │   ├── fetch.py         ← Task 1: 미검증 데이터 조회
│   │   ├── score.py         ← Task 2: 룰 적용 및 점수 계산
│   │   └── upsert.py        ← Task 3: frequency upsert + master 업데이트
│   └── promotion/
│       ├── fetch.py         ← Task 1: 승격 후보 조회
│       ├── promote.py       ← Task 2: curriculum UPDATE or verified INSERT
│       └── mark.py          ← Task 3: 승격 완료 표시
├── backups/                 ← DB 덤프 파일 저장 (7일 보관)
├── logs/                    ← Airflow 로그
├── Dockerfile
├── requirements.txt
├── docker-compose.yml
├── .env.local               ← 로컬 DB 연결 정보 (gitignore)
└── .env.server              ← 서버 DB 연결 정보 (gitignore)
```

---

## DAG 구성

| DAG ID | 스케줄 | 역할 |
| --- | --- | --- |
| `l3_validation` | 매일 00:00 | 신뢰도 검증 + frequency upsert |
| `lecture_promotion` | 매일 01:00 | 임계값 초과 → master 승격 |
| `db_dump` | 매일 02:00 | 서버 DB 백업 (7일 보관) |

---

## l3_validation DAG

### 흐름

```
fetch_unvalidated
  → lecture_validation에서 미검증 데이터 조회
  → val_status = READY OR evidence 없는 탈퇴 유저
  → curriculum 여부 4개 조건으로 체크

calculate_score
  → R300: excel + curriculum  → 1.5점
  → R301: excel only          → 1.0점
  → R302: manual + curriculum → 0.8점
  → R303: manual only         → 0.5점

upsert_frequency
  → lecture_frequency upsert (match_count, total_val_score 누적)
  → lecture_master curriculum 업데이트 (year, semester, admission_stats)
  → lecture_validation 업데이트 (rule_id, score, log)
  → lecture_evidence val_status → SUCCESS
```

### 검증 룰

| 룰 코드 | 조건 | 가중치 |
| --- | --- | --- |
| R300 | excel + curriculum 등록 과목 | 1.5 |
| R301 | excel + curriculum 미등록 | 1.0 |
| R302 | manual + curriculum 등록 과목 | 0.8 |
| R303 | manual + curriculum 미등록 | 0.5 |

### snap_lecture_category 처리

```
snap_lecture_category 있으면 → 그대로 사용
snap_lecture_category NULL이면 → lecture_evidence에서 최신값 가져옴
탈퇴 유저(evidence 없음) → NULL 그대로
```

### is_promoted 설계

```
curriculum 과목 → is_promoted = True (이미 master에 있음)
curriculum 아닌 과목 → is_promoted = False (promotion_dag에서 임계값 초과 시 승격)
```

---

## lecture_promotion DAG

### 흐름

```
fetch_candidates
  → match_count >= 2
  → total_val_score >= 1.5
  → is_promoted = False

check_and_promote
  → curriculum or verified에 이미 있으면 → UPDATE
      (last_completed_year, semester, admission_stats, metadata)
  → 없으면 → verified INSERT

mark_promoted
  → lecture_frequency.is_promoted = True
  → lecture_validation.is_standard = True
```

### 승격 조건

```
match_count >= 2      (2건 이상 이수 기록)
total_val_score >= 1.5 (신뢰도 점수 합계)
```

---

## db_dump DAG

### 흐름

```
dump_database
  → SSH 터널을 통해 서버 DB 접속
  → pg_dump 실행
  → backups/zolver_db_YYYYMMDD_HHMMSS.sql 저장

cleanup_old
  → 7일 이상 된 덤프 파일 자동 삭제
```

---

## 로컬 개발 환경 실행

### 사전 준비

```bash
# .env.local 생성
cp .env.example .env.local
# DB_PASSWORD, AIRFLOW_SECRET_KEY 등 값 채우기

# AIRFLOW_SECRET_KEY 생성
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 실행

```bash
# 기존 로컬 서비스 먼저 띄우기 (zolver-db가 필요)
cd ~/Zolver
docker compose --env-file .env.local -f docker-compose.local.yml up -d

# Airflow 띄우기
cd ~/Zolver/zolver-airflow
docker compose --env-file .env.local up --build -d

# localhost:8080 접속
# Username: admin / Password: .env.local의 AIRFLOW_PASSWORD
```

### 검증 룰 초기 데이터 삽입 (최초 1회)

```bash
docker exec -it airflow-scheduler python /opt/airflow/script/insert_rules.py
```

---

## 서버 DB 연결 (SSH 터널)

로컬 Airflow에서 서버 DB에 연결하는 방법입니다.

### 포트 흐름

```
Airflow 컨테이너
  → host.docker.internal:5433 (로컬)
  → SSH 터널 (로컬 :5433 → 서버 :5432)
  → 서버 PostgreSQL :5432
```

### 실행 순서

```bash
# 1. SSH 터널 열기 (새 터미널)
ssh -i "~/.ssh/zolver-key.pem" -L 5433:localhost:5432 ubuntu@서버IP -N &

# 2. .env.server 생성
# ZOLVER_DB_HOST=host.docker.internal
# ZOLVER_DB_PORT=5433
# ZOLVER_DB_NAME=zolver_db
# ZOLVER_DB_USER=zolver
# ZOLVER_DB_PASSWORD=서버DB비번

# 3. 로컬 서비스 down (포트 충돌 방지)
cd ~/Zolver
docker compose --env-file .env.local -f docker-compose.local.yml down

# 4. Airflow 서버 모드로 재시작
cd ~/Zolver/zolver-airflow
docker compose --env-file .env.local down
docker compose --env-file .env.server up -d
```

---

## DB 초기화 (테스트용)

```sql
-- frequency 초기화
TRUNCATE lecture_frequency;

-- validation 초기화
UPDATE lecture_validation
SET validation_score = NULL, rule_id = NULL,
    finished_at = NULL, validation_log = NULL, is_standard = FALSE;

-- evidence 초기화
UPDATE lecture_evidence SET val_status = 'READY'
WHERE evidence_lec_id IS NOT NULL;

-- verified 삭제 (curriculum은 유지)
DELETE FROM lecture_master WHERE standard_type = 'verified';

-- curriculum master 초기화
UPDATE lecture_master SET
    validation_id = NULL,
    last_completed_year = 0,
    last_completed_semester = '0',
    admission_stats = '{}',
    metadata = NULL
WHERE standard_type = 'curriculum';
```

---

## 주의사항

- `.env.local`, `.env.server` 는 gitignore에 포함되어 있습니다.
- 서버에서 Airflow를 직접 실행하지 않습니다 (RAM 1GB 제한).
- DAG 재실행 시 중복 반영 없음:
  - `l3_validation`: `validation_score IS NULL` 인 것만 처리
  - `lecture_promotion`: `is_promoted = False` 인 것만 처리
