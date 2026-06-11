# zolver-worker

Zolver의 핵심인 **Anchor Data 구축** 및 유저 성적표의 **신뢰도 검증 파이프라인**을 담당하는 Worker 모듈입니다.

FastAPI 백엔드(`zolver-backend`)에서 성적표 업로드 시 동기적으로 호출되며, L1·L2 검증을 통과한 데이터를 ETL 처리하여 DB에 적재합니다.

> L3 신뢰도 점수 산출 및 `lecture_master` 승격은 `zolver-airflow` repo에서 관리합니다.

---

## 파이프라인 개요

```
성적표 업로드 (Excel)
       │
       ▼
  [L1 Physical Check]  ── 실패 ──▶  파일 즉시 파기 · 400 반환 (로그 없음)
  화이트리스트 키워드 스캔
       │ 통과
       ▼
  [L2 Content Check]   ── 실패 ──▶  실패 로그 적재 (failed_schema · schema_mismatch)
  고정 좌표 구조·헤더 검증
       │ 통과
       ▼
  [ETL]  데이터 추출·변환·적재
  transcript_val 로그 기록
       │
       ▼
  lecture_evidence INSERT
  트리거 → validation 스냅샷 자동 생성
       │
       ▼
  200 OK 반환 · 원본 파일 파기

  ── 별도 배치 ──────────────────────────────────────
  [Airflow]  L3 신뢰도 검증 → lecture_frequency 누적
                            → lecture_master 승격
```

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 언어 | Python |
| DB | PostgreSQL (zolver-backend와 공유) |
| 실행 방식 | zolver-backend에서 동기 호출 (import) |
| 볼륨 마운트 | Docker Compose 볼륨으로 backend와 코드 공유 |

---

## 디렉토리 구조

```
zolver-worker/
├── etl/                        # 추출-변환-적재 파이프라인
│   ├── extractor/
│   │   ├── data_locator.py     # 엑셀 내 데이터 좌표 탐색
│   │   └── excel_reader.py     # 엑셀 파일 읽기
│   ├── transformer/
│   │   └── lecture_transformer.py  # 과목 데이터 정규화
│   └── loader/
│       ├── lecture.py          # lecture_evidence DB 적재
│       └── user.py             # 유저 메타 적재
├── quality/
│   └── transcript/             # 성적표 전용 검증 로직
│       ├── l1_physical/        # L1: 물리적 위변조 검증
│       └── l2_content/         # L2: 양식 무결성 검증
├── services/
│   ├── masking.py              # 민감 정보 마스킹
│   └── confidence_engine.py    # 신뢰도 점수 산출 (L3 전처리)
├── constants/
│   └── transcript/
│       └── error_codes.py      # 에러 코드 체계 (R1xx~R999)
├── scripts/                    # 일회성 스크립트
│   └── seed_lectures.py        # 초기 과목 데이터 시딩
├── logger/                     # 계층별 로깅 시스템
├── utils/                      # 공용 유틸 (Excel, File, Hash)
├── notebooks/                  # 데이터 분석·테스트용
└── zolver_data_app.py          # Worker 실행 엔트리포인트
```

---

## 검증 단계 상세

### L1 — Physical Check (`quality/transcript/l1_physical`)

파일 자체의 물리적 무결성을 검증합니다. **실패 시 파일을 즉시 파기하고 로그를 남기지 않습니다.**

### L2 — Content Check (`quality/transcript/l2_content`)

엑셀 내 고정 좌표의 텍스트가 성적표 양식과 일치하는지 검증합니다. **실패 시 `failed_schema` 또는 `mismatch` 로그를 DB에 적재합니다.**

### Rule ID 체계

`constants/transcript/error_codes.py`의 `RuleCode` Enum에 정의된 에러 코드 시스템입니다.

**R0xx — System**

| 코드 | 이름 | 설명 |
|---|---|---|
| R000 | SYSTEM_ERROR | 시스템 오류 |

**R1xx — L1 Physical Validation**

| 코드 | 이름 | 설명 |
|---|---|---|
| R100 | FILE_EXISTENCE_CHECK | 파일 존재 확인 |
| R101 | FILE_EXTENSION_VALIDITY | 확장자 유효성 |
| R102 | FILE_SIZE_LIMIT_CHECK | 용량 제한 확인 |
| R103 | AUTHOR_INTEGRITY_CHECK | 작성자 무결성 (화이트리스트) |
| R104 | TIMESTAMP_LOGIC_CHECK | 시간 논리 확인 |
| R105 | HIDDEN_SYSTEM_FILE_CHECK | 숨김 파일 여부 |
| R106 | INPUT_PATH_TYPE_CHECK | 경로 타입 확인 |
| R107 | TEMP_DIRECTORY_MOVEMENT | 임시 폴더 이동 |

**R2xx — L2 Content Validation + ETL**

| 코드 | 이름 | 설명 |
|---|---|---|
| R200 | WHITELIST_CONTENT_SCAN | 화이트리스트 콘텐츠 스캔 |
| R201 | EXCEL_SCHEMA_EXTRACTION | 스키마 추출 |
| R202 | COORDINATE_MAPPING_PROCESS | 좌표 매핑 처리 |
| R203 | TRANSCRIPT_DATA_EXTRACTION | 데이터 추출 (ETL) |
| R204 | TRANSCRIPT_DATA_TRANSFORM | 데이터 변환 (ETL) |
| R205 | DATABASE_LOADING_PROCESS | 데이터 적재 (ETL) |

---

## ETL 프로세스

L1·L2 검증을 통과한 데이터는 다음 순서로 처리됩니다.

```
[Extractor]  data_locator → excel_reader
    데이터 좌표 탐색 + 엑셀 파싱
       │
       ▼
[Transformer]  lecture_transformer
    과목 코드, 이수구분, 학점 정규화
       │
       ▼
[Loader]  lecture.py
    lecture_evidence INSERT
    → DB 트리거로 validation 스냅샷 자동 생성
```

---

## 로깅 시스템

- `BaseValidator`를 상속받아 각 레이어(L1, L2)별 독립 로그 세션 생성
- 모든 검증 히스토리는 **유저 식별 해시값 / 파일 해시값 / 과목 이수 정보 + 사용자 식별 해시** 기준으로 JSON 계층 구조 기록
- L1 실패는 로그 없음 (보안 목적), L2 실패부터 DB 적재

---

## 환경 변수 설정

| 변수명 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (backend와 동일 DB) |
| `WHITELIST_KEYWORDS` | L1 화이트리스트 키워드 목록 |

---

## 로컬 개발

Worker는 `zolver-backend`의 Docker Compose 볼륨에 마운트되어 실행됩니다.

```bash
# zolver-backend 디렉토리에서
docker-compose up -d
```

`docker-compose.yml`에서 worker 코드 경로를 볼륨으로 마운트하도록 설정되어 있습니다.

### 로그 확인

Docker 볼륨 마운트를 통해 서버 환경에서도 Worker의 모든 검증 로그를 실시간으로 확인할 수 있습니다.

볼륨 마운트 구조상 로컬 파일시스템에도 로그가 기록되므로, 컨테이너 재시작 후에도 로그가 유지됩니다.

```yaml
# docker-compose.yml 볼륨 설정 예시
services:
  worker:
    volumes:
      - ./logs:/app/logs        # 로그 파일 로컬 동기화
      - ./zolver-worker:/app    # Worker 코드 마운트
```

---

## 보안 설계 원칙

- **L1 실패 시 로그 없음**: 악의적 파일 탐지 정보 노출 방지
- **원본 파일 파기**: 검증 완료 후 임시 저장된 파일 즉시 삭제
- **민감 정보 마스킹**: `services/masking.py`를 통해 성적표 내 민감 정보 처리
- **과목 이수 정보 + 사용자 식별 해시 기반 추적**: 동일 파일 내용 중복 업로드 탐지 및 멱등성 보장 
