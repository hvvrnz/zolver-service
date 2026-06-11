# zolver-frontend

Zolver 서비스의 **React SPA 프론트엔드**입니다.

**🔗 서비스 주소: [www.zolver.co.kr](https://www.zolver.co.kr)**

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| Framework | React (CRA) |
| 라우팅 | React Router v6 |
| 상태관리 | React 내장 (useState · useEffect · useCallback) |
| 차트 | SVG 직접 구현 (외부 라이브러리 미사용) |
| HTTP 클라이언트 | axios (인터셉터 기반 토큰 자동 첨부 · 재발급 처리) |
| API 통신 | 자체 api 모듈 (`/api/`) 추상화 |
| 스타일 | CSS Modules (페이지별 `.css`) |
| 서빙 | Nginx (정적 파일) |
| 인증 | 카카오 OAuth 2.0 + JWT |
| 배포 환경 | AWS EC2 (Ubuntu) |
| 개발 환경 | Windows + WSL2 |

---

## 페이지 구조

```
src/
├── pages/
│   ├── home/
│   │   ├── LandingPage       # 비로그인 랜딩 페이지
│   │   └── HomePage          # 로그인 후 대시보드 (member 전용)
│   ├── auth/
│   │   ├── LoginPage         # 카카오 로그인
│   │   └── OAuthCallback     # 카카오 OAuth 콜백 처리
│   ├── welcome/
│   │   └── WelcomePage       # 최초 로그인 후 학번·학과 등록
│   ├── record/
│   │   └── CourseRecordPage  # 이수 과목 등록 (xlsx 업로드 + 직접 입력)
│   ├── organze/
│   │   ├── MajorYoramPage    # 전공 이수 현황
│   │   ├── LiberalYoramPage  # 교양 이수 현황
│   │   └── EtcYoramPage      # 기타 이수 현황
│   ├── tags/
│   │   └── TagPage           # 태그 관리 (그룹·소분류·최소학점)
│   ├── simulation/
│   │   └── SimulationPage    # 수강 시뮬레이션
│   ├── gpa/
│   │   └── GpaPage           # GPA 분석 · 목표 설정 · 시뮬레이션
│   ├── catalog/
│   │   └── CourseCatalogPage # 과목 모아보기
│   ├── guide/
│   │   └── GuidePage         # 이용 가이드
│   ├── support/
│   │   ├── ReportPage        # 오류 신고
│   │   └── FAQPage           # 자주 묻는 질문
│   ├── policy/
│   │   ├── TermsPage         # 이용약관
│   │   └── PrivacyPage       # 개인정보처리방침
│   └── error/
│       └── ErrorPage         # 404 · 500 · 503 에러 페이지
├── components/
│   ├── Header                # 상단 네비게이션
│   ├── Footer                # 하단 푸터
│   └── ProtectedRoute        # 인증 가드 (guest · member 분기)
├── api/                      # API 호출 모듈 추상화
│   ├── courses.js
│   ├── user.js
│   └── ...
└── utils/
    └── constants.js          # 전역 상수 (INVALID_GRADES 등)
```

---

## 주요 기능

### 대시보드 (`/`)
- 전공·교양·기타 학점 달성률 원형 그래프
- 수강 예정 과목 (시뮬레이션 기반 학기별 계획)
- 나의 졸업요건 메모
- 공지사항

### 이수 과목 등록 (`/record/courserecord`)
- 학교 포털에서 다운받은 **.xlsx 성적표 업로드** → L1·L2 자동 검증 후 파싱
- 과목 직접 입력·수정·삭제
- 학기별 과목 카드 (과목코드·이수구분·학점·성적 표시)

### 이수 현황 (`/organize/major`, `/organize/liberal`, `/organize/etc`)
- 전공·교양·기타별 달성률 원형 그래프
- **태그별 이수 현황**: 그룹·소분류 단위로 취득학점 / 목표학점 / 달성 여부 표시
- 이수 과목 목록 펼쳐보기

### 태그 관리 (`/tags`)
- 전공·교양·기타 과목에 태그(그룹·소분류) 직접 생성·수정·삭제
- 최소 이수학점 설정 → 이수 현황에서 달성 여부 자동 반영
- 태그 계층 구조: 그룹 > 소분류

### 수강 시뮬레이션 (`/simulation`)
- 앞으로 들을 과목을 학기별로 미리 등록
- 졸업·전공·교양·기타 달성률 실시간 시뮬레이션
- 태그별 예상 이수 현황 확인

### GPA 분석 (`/gpa`)
- 학기별 GPA 추이 꺾은선 그래프 (SVG 직접 구현)
- 전체 평균 · 전공 평균 · 직전 학기 GPA 요약 카드
- 목표 GPA 설정 (전체·전공)
- **GPA 달성 시뮬레이션**: 앞으로 들을 학점 수 입력 → 필요 평균 평점 계산 + 과목 조합 추정
- 성적 분포 테이블 (A+~F 등급별 과목 수·학점·비율)

### 과목 모아보기 (`/catalog`)
- 관리자 등록 과목 + L3 신뢰도 알고리즘으로 시스템 검증된 과목 통합 검색
- 전공·교양·기타 / 학점별 필터링
- 과목 상세: `total_val_score`, 학번별 이수 현황 막대 차트

---

## 인증 및 라우팅 가드

```
[ProtectedRoute]
  ├── allowGuest={false} (기본) → member만 접근 가능
  └── allowGuest={true}         → guest + member 둘 다 접근 가능

공개 페이지 (로그인 불필요)
  /landing, /login, /auth/callback, /terms, /privacy, /faq, /welcome
```

- 에러 상태(`500` · `503`)는 URL 변경 없이 에러 페이지 인라인 렌더링
- `REACT_APP_MAINTENANCE=true` 시 전체 서비스를 점검 페이지로 전환

---

## 환경 변수 설정

```bash
cp .env.example .env
```

| 변수명 | 설명 | 예시 |
|---|---|---|
| `REACT_APP_API_BASE_URL` | 백엔드 API 주소 | `https://www.zolver.co.kr` |
| `REACT_APP_KAKAO_CLIENT_ID` | 카카오 앱 REST API 키 | - |
| `REACT_APP_MAINTENANCE` | 점검 모드 활성화 | `false` |

### 빌드 시 주의사항

React 빌드 시 `.env.local`이 `.env`보다 **우선 적용**
운영 빌드 전 반드시 `.env.local`을 백업하거나 삭제한 후 빌드

```bash
mv .env.local .env.local.bak
npm run build
mv .env.local.bak .env.local
```

---

## 로컬 개발 실행

```bash
npm install
npm start        # 기본 포트: 3000
```

---

## 프로덕션 빌드 및 배포

```bash
npm run build    # build/ 디렉토리에 정적 파일 생성
```

빌드 결과물을 Nginx 정적 파일 루트로 지정하세요.

```nginx
server {
    listen 80;
    server_name zolver.co.kr www.zolver.co.kr;

    root /var/www/zolver/build;
    index index.html;

    # React SPA 라우팅 처리
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 요청 백엔드로 프록시
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
