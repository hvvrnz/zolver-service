# zolver-elastic

Zolver 서비스의 **로그 수집 및 분석 파이프라인**입니다.

EC2 서버에서 생성된 검증 로그를 로컬에서 수집·분석하여 **Schema Drift 탐지** 및 **업로드 성공률 모니터링** 대시보드를 구성합니다.

---

## 아키텍처

```
EC2 서버 (로그 생성)
    │
    │ scp (수동 수집)
    ▼
로컬 WSL2 ~/Zolver/zolver-elastic/logs/
    │
    ▼
Filebeat (Docker) → Elasticsearch (Docker) → Kibana (Docker)
```

> EC2 서버 RAM이 1GB로 Elasticsearch 운영 불가(최소 2GB 필요)하여 로컬 분석 환경으로 구성했습니다.
> scp로 로그를 주기적으로 수집한 후 분석합니다.

---

## 로그 구조

검증 파이프라인에서 생성되는 로그는 3종입니다.

```
logs/transcript/
├── transcript_val/          # 전체 파이프라인 실행 이력 (L1+L2 rule별 성공/실패)
├── failed_schema/           # L2 R202 실패: 헤더 키워드 불일치
└── schema_mismatch_masked/  # L2 실패: 50x50 셀 구조 스냅샷 + form_hash (마스킹)
```

### transcript_val
L1/L2 전체 실행 이력. `is_all_success`로 업로드 성공 여부 확인 가능.

```json
{
  "timestamp": "2026-06-14 23:14:38",
  "level": "INFO",
  "logger": "transcript_val",
  "is_all_success": true,
  "history": {
    "L1FileValidator": [{"rule_no": "R100", "is_success": true}, ...],
    "L2TranscriptValidator": [{"rule_no": "R200", "is_success": true}, ...]
  }
}
```

### failed_schema
L2 헤더 검증 실패 시 기록. 예상 헤더와 실제 헤더 불일치 내용 포함.

```json
{
  "logger": "failed_schema",
  "rule_no": "R202",
  "report": {
    "header": {
      "type": "HEADER_MISMATCH",
      "expected": ["년도", "학기", "이수구분", ...],
      "actual": ["이수구분", "년도", "학기", ...],
      "row_index": 6
    }
  }
}
```

### schema_mismatch_masked
L2 실패 시 50x50 셀 구조 스냅샷. 개인정보 마스킹 처리. `form_hash`로 양식 식별.

```json
{
  "logger": "schema_mismatch_masked",
  "form_hash": "5362693b5b",
  "report": {
    "sample_10x10": [...]
  }
}
```

---

## Schema Drift 탐지 로직

```
서로 다른 유저가 동일한 form_hash로 반복 실패
    ↓
해당 form_hash = 파서가 인식 못하는 새 양식
    ↓
학교 측 성적표 양식 변경 감지 → 파서 업데이트 필요
```

- **form_hash 변화** → 새 양식 등장
- **동일 form_hash 반복 실패** → 해당 양식에 대한 파서 미지원 확인
- **성공 시 form_hash 없음** → 실패 로그에서만 탐지 가능

---

## Elasticsearch 인덱스 구조

로그 종류별로 인덱스를 분리했습니다.

| 인덱스 | 대상 로그 | 이유 |
|---|---|---|
| `zolver-schema-*` | failed_schema + schema_mismatch_masked | `history` 필드가 문자열 타입 |
| `zolver-val-*` | transcript_val | `history` 필드가 JSON 객체 타입 |

> **매핑 충돌 이슈**: `history` 필드가 `failed_schema`에선 문자열, `transcript_val`에선 JSON 객체라 동일 인덱스에 넣으면 Elasticsearch 매핑 충돌 발생. 인덱스 분리로 해결.

---

## Kibana 대시보드

| 시각화 | 설명 |
|---|---|
| 업로드 성공/실패 비율 | `is_all_success` true/false 비율 (Pie chart) |
| Schema Drift 탐지 | `form_hash` 별 실패 건수 집계 |
| logger 별 실패 건수 | `failed_schema` vs `schema_mismatch_masked` 건수 |
| provider별 실패 집계 | `provider_id_hash` 별 에러 건수 (과다 실패 유저 탐지) |

---

## 로컬 실행

### 1. 서버에서 로그 수집

```bash
scp -i ~/.ssh/키.pem -r ubuntu@서버IP:~/Zolver/zolver-data/logs/transcript ~/Zolver/zolver-elastic/logs/
```

### 2. Filebeat 설정 파일 권한 설정

```bash
# Filebeat는 설정 파일 소유자가 root여야 실행됨
sudo chown root:root ~/Zolver/zolver-elastic/filebeat.yml
```

### 3. Elastic Stack 실행

```bash
cd ~/Zolver/zolver-elastic
docker compose up -d
```

### 4. Kibana 접속

브라우저에서 `http://localhost:5601` 접속

---

## 트러블슈팅

### Filebeat 설정 파일 권한 오류
```
error loading config file: must be owned by the user identifier (uid=0) or root
```
→ `sudo chown root:root filebeat.yml` 로 소유자를 root로 변경

### Elasticsearch 매핑 충돌 (status=400)
```
Cannot index event (status=400): dropping event!
```
→ 동일 인덱스에 타입이 다른 필드가 들어올 때 발생. 인덱스 분리로 해결.

인덱스 초기화:
```bash
curl -X DELETE localhost:9200/_data_stream/filebeat-8.13.0
```

### 날짜별 로그 파일 미수집
→ `filebeat.yml`의 `paths`를 `*.log`에서 `*.log*`로 변경

---

## 디렉토리 구조

```
zolver-elastic/
├── docker-compose.yml    # Elasticsearch + Kibana + Filebeat
├── filebeat.yml          # 로그 수집 설정 (인덱스 분리)
├── logs/                 # 서버에서 scp로 수집한 로그 (gitignore)
│   └── transcript/
│       ├── failed_schema/
│       ├── schema_mismatch_masked/
│       └── transcript_val/
└── README.md
```

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 로그 수집 | Filebeat 8.13.0 |
| 저장·검색 | Elasticsearch 8.13.0 |
| 시각화 | Kibana 8.13.0 |
| 실행 환경 | Docker Compose (로컬 WSL2) |
