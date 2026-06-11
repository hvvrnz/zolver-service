create type source_type as enum ('manual','std_manual','excel');
create type system_category as enum ('common', 'general','major','etc');
create type manual_status as enum ('original','fixed');

create type status as enum ('active','deleted','modify');
create type current_layer as enum ('L1', 'L2', 'L3');
create type val_status as enum ('IN_PROGRESS', 'SUCCESS', 'FAIL', 'READY');
create type standard_type as enum('curriculum', 'verified');


-- ========================================
-- 1. users (only user_id)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY key,
    college varchar(100) default '건국대학교글로컬',
    name VARCHAR(100),
    admission_year INT4,
    enroll_status VARCHAR(100),
    student_type VARCHAR(100),
    grade INT4,
    is_teaching VARCHAR(100),
    transcript_upload_count INT4 DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    total_credits INT4 DEFAULT 130,
    major_credits INT4 DEFAULT 60,
    general_credits INT4 DEFAULT 30
);


-- ========================================
-- 2. login_sessions (user_id + provider_id_hash)
-- ========================================
CREATE TABLE IF NOT EXISTS login_sessions (
    session_id SERIAL PRIMARY KEY,
    provider VARCHAR(50) not null,
    provider_id_hash VARCHAR(255) not null,
    user_id INT4 REFERENCES users(user_id) ON DELETE CASCADE,
    nickname varchar(100),
    refresh_token_hash VARCHAR(255) not null,
    expires_at TIMESTAMPTZ not null,
    is_revoked BOOLEAN DEFAULT false not null,
    created_at TIMESTAMPTZ DEFAULT NOW() not null
);

-- ========================================
-- 3. user_actions_log (only provider_id_hash)
-- ========================================
CREATE TABLE IF NOT EXISTS user_actions_log (
    log_id SERIAL PRIMARY KEY,
    provider_id_hash VARCHAR(255),
    table_name VARCHAR(100),
    action_type VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. user_majors (사용자 전공)
-- ========================================
CREATE TABLE IF NOT EXISTS user_majors (
    user_major_id SERIAL PRIMARY KEY,
    user_id INT4,
    major VARCHAR(100),
    major_type VARCHAR(100),
    college VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT FALSE
);

-- ========================================
-- 5. notices (공지사항)
-- ========================================
CREATE TABLE IF NOT EXISTS notices (
    notice_id SERIAL PRIMARY KEY,
    content jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ========================================
-- 6. course_tags (강의 태그)
-- ========================================
CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    user_id INT4 REFERENCES users(user_id) ON DELETE cascade not null,
    system_category system_category not null,
    tag_group VARCHAR(50) not null,
    tag_name VARCHAR(100),
    min_credits INT4 not null default 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 8. simulation_plans (수강신청 시뮬레이션 계획)
-- ========================================
CREATE TABLE IF NOT EXISTS simulation_plans (
    plan_id SERIAL PRIMARY KEY,
    user_id INT4 REFERENCES users(user_id) ON DELETE cascade not null,
    year INT4 not null,
    semester VARCHAR(20) not null,
    grade INT4 not null,
    max_credits INT4 not null,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. simulation_courses (수강신청 시뮬레이션 과목)
-- ========================================
CREATE TABLE IF NOT EXISTS simulation_courses (
    sim_course_id SERIAL PRIMARY KEY,
    user_id INT4 REFERENCES users(user_id) ON DELETE cascade not null,
    plan_id INT4 REFERENCES simulation_plans(plan_id) ON DELETE cascade not null,
    system_category system_category not null,
    tag_id INT4 REFERENCES course_tags(tag_id) ON DELETE SET null,  -- NOT NULL 제거: ON DELETE SET NULL과 NOT NULL은 논리 충돌
    lecture_credit INT4 not null,
    memo TEXT not null,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ========================================
-- 9. user_manual_curriculum (수기 요람 작성)
-- ========================================
CREATE TABLE IF NOT EXISTS user_manual_curriculum (
    manual_curr_id SERIAL PRIMARY KEY,
    user_id INT4 REFERENCES users(user_id) ON DELETE CASCADE,
    content JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ========================================
-- 10. lecture_evidence (강의 증빙) -- Airflow 배치용 상태 플래그 추가
-- ========================================
CREATE TABLE IF NOT EXISTS lecture_evidence (
    evidence_lec_id SERIAL PRIMARY KEY,
    unique_hash VARCHAR(64) UNIQUE NOT NULL, -- user_id + 과목 정보 등이 포함된 멱등성 해시
    user_id INT4 REFERENCES users(user_id), -- user_id NULL (유저 탈퇴시 manual_status == fixed인 레코드만 삭제)  ← 쉼표 누락 수정
    source_type source_type,                 --
    taken_grade INT4,
    taken_semester VARCHAR(50),
    system_category system_category,         
    area VARCHAR(100),
    tag_group VARCHAR(100),
    completion_year INT4,
    completion_semester VARCHAR(50),
    lecture_category VARCHAR(50),
    lecture_code VARCHAR(50),
    lecture_name VARCHAR(50),
    lecture_credit INT4,
    course_grade VARCHAR(10),
    recognition_type VARCHAR(50),
    delete_type VARCHAR(50),
    manual_status manual_status DEFAULT 'original', -- 사용자가 직접 수정 시 'fixed'로 업데이트됨
    status status DEFAULT 'active',                 --
    is_anonymous BOOLEAN DEFAULT false,
    val_status val_status DEFAULT 'READY',          -- 'READY', 'IN_PROGRESS', 'SUCCESS', 'FAIL'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 14. validation_rule (검증 룰)
-- ========================================
CREATE TABLE IF NOT EXISTS validation_rule (
    rule_id   SERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE,
    metadata  JSONB,
    is_active BOOLEAN DEFAULT TRUE
);


-- ========================================
-- 12. lecture_validation
-- ✅ 변경사항:
--   1) rule_id NOT NULL 제거
--      → evidence INSERT 시점엔 rule을 모름, Airflow 배치가 나중에 채움
--   2) snap_* 컬럼 추가
--      → evidence INSERT 트리거가 자동으로 채워줌
--      → 유저가 evidence를 수정(fixed)해도 snap은 원본값 그대로 보존
-- ========================================
CREATE TABLE IF NOT EXISTS lecture_validation (
    validation_id    SERIAL PRIMARY KEY,
    evidence_lec_id  INT4 REFERENCES lecture_evidence(evidence_lec_id) ON DELETE SET NULL,   -- 유저가 삭제해도 검증 기록 보존
    rule_id          INT4 REFERENCES validation_rule(rule_id) ON DELETE RESTRICT,
 	validation_score NUMERIC(3, 2),
    validation_log   JSONB,
    is_standard      BOOLEAN DEFAULT FALSE,
    started_at       TIMESTAMPTZ DEFAULT NOW(),
    finished_at      TIMESTAMPTZ,
    snap_unique_hash         VARCHAR(64),   
    snap_lecture_code        VARCHAR(50),   
    snap_lecture_name        VARCHAR(50),   
    snap_lecture_credit      INT4,          
    snap_lecture_category    VARCHAR(50),   
    snap_system_category     system_category,
    snap_area                VARCHAR(100),
    snap_admission_year      INT4,          
    snap_completion_year     INT4,
    snap_completion_semester VARCHAR(50),
    snap_source_type         source_type,
    snap_college             VARCHAR(100)   -- ← 세미콜론 제거 (컬럼 정의 중간에 있던 오류 수정)
);

-- ========================================
-- 13. lecture_frequency
--   lecture_name, lecture_credit, lecture_category 컬럼 추가
--   → 중복 판정을 lecture_code 하나가 아니라 4개 요소로 해야 하기 때문
--  -- FK: 가장 최신 이수 기준 validation (Upsert 시 갱신)
-- ========================================
CREATE TABLE IF NOT EXISTS lecture_frequency (
    frequency_id    SERIAL PRIMARY key,
    validation_id   INT4 REFERENCES lecture_validation(validation_id) ON DELETE RESTRICT NOT NULL,
    lecture_code     VARCHAR(100) NOT NULL,
    lecture_name     VARCHAR(200) NOT NULL,
    lecture_credit   INT4        NOT NULL,
    lecture_category VARCHAR(50) NOT NULL,
    system_category system_category NOT NULL,
    completion_year     INT4,   -- 최신 이수 정보 (Upsert 시 더 최신 값으로 덮어씀)
    completion_semester VARCHAR(100),
    total_val_score  NUMERIC(3, 2),
    match_count      INT4 DEFAULT 1,
    is_promoted      BOOLEAN DEFAULT FALSE,  -- 승격 플래그 (TRUE면 이미 master로 올라감 → 재승격 방지)
    completion_info       JSONB,
    lecture_update_reason JSONB,
    score_update_reason   JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
 
 
-- ========================================
-- 13. lecture_master (강의 마스터)
-- ========================================
CREATE TABLE IF NOT EXISTS lecture_master (
    std_lecture_id SERIAL PRIMARY KEY,       --
    validation_id INT4 REFERENCES lecture_validation(validation_id) ON DELETE RESTRICT, --
    last_completed_year INT4 default 0,      --
    last_completed_semester VARCHAR(255) default '0', 
    admission_stats JSONB DEFAULT '{}',
    standard_type standard_type,             --
    curriculum_ver VARCHAR(50),              --
    system_category system_category,         --
    lecture_code VARCHAR(250),               --
    lecture_name VARCHAR(250),               --
    category_type VARCHAR(250),              --
    credits NUMERIC(3, 2),                   --
    area VARCHAR(50),                        --
    times NUMERIC(3, 2),                     --
    updated_at TIMESTAMPTZ DEFAULT NOW(),    --
    metadata jsonb                           --
);

ALTER TABLE lecture_master 
ADD CONSTRAINT uk_master_verified 
UNIQUE (lecture_code, lecture_name, credits, category_type);

ALTER TABLE users
  ADD COLUMN target_gpa        NUMERIC(3,2),
  ADD COLUMN target_gpa_major  NUMERIC(3,2);

ALTER TABLE lecture_frequency 
ALTER COLUMN total_val_score TYPE NUMERIC(6,2);