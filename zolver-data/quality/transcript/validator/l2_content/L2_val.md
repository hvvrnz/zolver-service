### Pandas-Excel Index Mapping Cheat Sheet 

성적표 데이터 추출 및 검증(L2/L3) 로직 설계 시 발생하는 좌표 혼동을 방지하기 위한 표준 매핑 가이드

### 1. 핵심 인덱싱 규칙 
* **Python/Pandas**: 데이터 처리를 위한 내부 로직용.
* **Excel/openpyxl**: 사용자 가시성 및 원본 파일 대조용.
---

### 2. 라이브러리별 좌표 체계 비교

| 대상 | Pandas (`iloc`) | openpyxl (`cell`) | 실제 엑셀 위치 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **행 시작 (Row)** | `0` | `1` | 1행 | - |
| **열 시작 (Col)** | `0` | `1` | A열 | - |
| **속성/메서드** | `df.iloc[r, c]` | `cell.row`, `cell.column` | `[Column][Row]` | - |

---

### 3. Slicing 및 추출 규칙

| Pandas 코드          | 실제 엑셀 범위             | 비고                        |
|:-------------------|:---------------------|:--------------------------|
| `header = 6`       | **7행**               | `read_excel` 옵션           |
| `iloc[1:5, :]`     | **2행 ~ 5행** , 열 전체   | `end` 인덱스(5)는 제외          |
| `iloc[7:, :]`      | **8행부터 마지막 행까지**     | -                         |
| `iloc[:, [2, 11]]` | **3열, 12열**의 전체 행 추출 | 불연속 열 선택 |



---

### 4. Architecture Summary

#### 4-1️. L2 Validation (Whitelist validation & Masking)
* **Tool:** `openpyxl`
* **Reasoning:**
    * **Memory Efficiency:** 엑셀의 XML 구조를 직접 파싱하여 메모리 점유율을 최소화한 상태로 휘발성 검증 수행.
    * **Granular Control:** 정밀한 셀(Cell) 단위 접근을 통해 Whitelist 기반의 실시간 마스킹(`_get_mask_value`)을 수행.
    * **Data Security:** 마스킹 완료 직후 보안을 위해 물리적 원본 파일을 즉시 파기(`unlink`)하여 데이터 유출 위험 원천 차단.

#### 4-2️. L3 Processing (데이터 정제 및 구조화)
* **Tool:** `pandas`
* **Reasoning:**
    * **Data Structuring:** 마스킹이 완료되어 보안성이 확보된 데이터를 고수준의 **DataFrame** 형태로 변환하여 효율적으로 관리.
    * **Complex Layout Parsing:** 성적표의 복잡한 비정형 레이아웃에서 필요한 과목 정보만을 정밀하게 추출.
    * **Load Optimization:** 추출된 데이터를 **PostgreSQL DB 스키마에 최적화된 형태**로 구조화하여 최종 적재 공정의 안정성 확보.