# schema_drift_viewer

Zolver L2 검증 실패 로그를 시각화하는 디버깅 도구.

Elasticsearch의 `schema_mismatch_masked` 로그를 50×50 그리드로 렌더링하고,
`excel_coords.py`에 정의된 기댓값 좌표와 실제 값을 비교해 불일치 셀을 즉시 식별한다.

---

## 배경

Zolver는 성적표 엑셀을 L1(물리 검증) → L2(스키마 검증) → L3(신뢰도 엔진) 순으로 처리한다.  
L2에서 실패한 파일은 `schema_mismatch_masked` 로그에 50×50 플랫 배열로 기록되는데,
이 배열만 보고는 "어느 셀이 왜 달라졌는지" 파악하기 어렵다.

이 뷰어는 해당 배열을 그리드로 펼치고, 기댓값 좌표를 오버레이해
**검증 로직 수정에 필요한 정보를 한눈에 제공**한다.

---

## 로컬 실행

별도 설치 없음. 브라우저만 있으면 된다.

```bash
# 그냥 더블클릭하거나
open viewer.html

# 또는 터미널에서
cd zolver-elastic/tools/schema_drift_viewer
start viewer.html   # Windows
open viewer.html    # macOS
xdg-open viewer.html # Linux
```

---

## 사용법

1. Kibana → Discover에서 실패 Document 선택
2. 우측 패널에서 JSON 전체 복사 (`_index`, `fields` 포함)
3. 뷰어 텍스트박스에 붙여넣기 → **그리드 보기** 클릭

---

## 색상 의미

| 색상 | 의미 |
|------|------|
| 초록 테두리 | 기댓값 좌표 — 값 일치 ✅ |
| 빨간 테두리 | 기댓값 좌표 — 값 없거나 불일치 ❌ |
| 파란 배경 | 값 있는 일반 셀 |
| 노란 배경 | `[PRIVATE]` 마스킹 셀 |

셀에 마우스를 올리면 `기댓값: xxx | 실제: yyy` 툴팁이 표시된다.

---

## 기댓값 좌표 기준

`excel_coords.py`의 constants를 그대로 반영했다.

| 구분 | 좌표 (행, 열) | 기댓값 |
|------|--------------|--------|
| 메인 타이틀 | (2, 2) | 학생인적사항 |
| 서브 타이틀 | (6, 2) | 개인별전체성적조회 |
| 헤더 | (7, 2~33) | 년도 / 학기 / 이수구분 / 학수번호 / 과목명 / 학점 / 등급 / 인정구분 / 삭제구분 |
| 인적사항 | (3, 3~33) | 학번 / 학적상태 / 학생구분 / 학년 / 교직여부 |
| 소속 정보 | (4, 3~18) | 소속 / 기타전공 |

좌표 변경 시 `viewer.html` 내 `EXPECTED_COORDS` 객체를 수정한다.

---

## 파일 구조

```
schema_drift_viewer/
├── viewer.html   # 뷰어 본체 (단일 파일, 외부 의존성 없음)
└── README.md
```
