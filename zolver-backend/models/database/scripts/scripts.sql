INSERT INTO validation_rule (rule_code, metadata, is_active) VALUES
('R300', '{"name": "excel + curriculum", "description": "성적표 업로드 과목 (공식 커리큘럼 db 사전등록)", "weight": 1.5, "source_type": "excel", "is_in_curriculum": true}', true),
('R301', '{"name": "excel", "description": "성적표 업로드 과목 (공식 커리큘럼 db 미등록)", "weight": 1.0, "source_type": "excel", "is_in_curriculum": false}', true),
('R302', '{"name": "manual + curriculum", "description": "사용자 수기 등록 과목 (공식 커리큘럼 db 사전등록)", "weight": 0.8, "source_type": "manual", "is_in_curriculum": true}', true),
('R303', '{"name": "manual", "description": "사용자 수기 등록 과목 (공식 커리큘럼 db 미등록)", "weight": 0.5, "source_type": "manual", "is_in_curriculum": false}', false);













DELETE FROM lecture_validation
WHERE validation_id != 650;


SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

alter table lecture_validation
drop column uploader_admission_year;

DELETE FROM lecture_validation
WHERE snap_source_type IS NULL


sELECT lecture_name, lecture_category, tag_group 
FROM lecture_evidence 

ALTER TABLE lecture_validation 
DROP CONSTRAINT IF EXISTS lecture_validation_evidence_lec_id_fkey;


ALTER TABLE lecture_evidence ADD COLUMN IF NOT EXISTS area VARCHAR(100);

delete from login_sessions;
delete from lecture_evidence;
delete from user_actions_log;
delete from course_tags;
delete from users;
delete from user_majors;
delete from simulation_courses;
delete from lecture_master;
select * from users;

ALTER TABLE lecture_validation 
ALTER COLUMN major TYPE VARCHAR(255);


UPDATE lecture_master
SET
    last_completed_year = 2024,
    last_completed_semester = 2,
    updated_at      = NOW()
WHERE
    std_lecture_id = 528;


select * from course_tags;
SELECT * FROM lecture_master WHERE lecture_name like '%베이스';
select count(*) from lecture_master;
ALTER TABLE user_majors 
ALTER COLUMN major TYPE VARCHAR(255);

ALTER TABLE course_tags 
ALTER COLUMN min_credits SET DEFAULT 0;

UPDATE lecture_master
SET
    admission_stats = '{"21": 1}',
    metadata        = '{"영역 변경": "2025년 전필→전선"}',
    updated_at      = NOW()
WHERE
    std_lecture_id = 528;



-- 탈퇴 시에도 분석용으로 데이터만을 남기기 위함
ALTER TABLE user_majors ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE lecture_evidence ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE user_majors ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE lecture_evidence ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;

-- =========================================================================

ALTER TABLE lecture_evidence RENAME COLUMN area TO tag_group;

alter table users
drop column email;

select * from course_tags;
select * from req_master;
delete from req_master;

select * from user_profile_info;
drop table req_master;
select * from course_tags;
ALTER TABLE course_tags ADD COLUMN tag_group VARCHAR(50);
select * from user_actions_log;
DELETE FROM login_sessions;
DELETE FROM user_actions_log;
select * from users;
select * from login_sessions;

select * from lecture_master;
select * from lecture_evidence;

alter table lecture_master add column source_college varchar(100) default '건국대학교글로컬';
seLECT * FROM lecture_master
WHERE lecture_name LIKE '%터구조';
ALTER TABLE lecture_evidence ADD COLUMN IF NOT EXISTS area VARCHAR(100);


select * FROM lecture_evidence; 
select * from course_tags;

INSERT INTO lecture_master (
	last_completed_year,
	last_completed_semester,
    standard_type,        
    curriculum_ver,        
    system_category,
    lecture_code,   
    lecture_name,
    area,
    category_type,
    credits,
    times
) 
VALUES (
	0,
	0,
    'curriculum',              
    2025,    
    'major', 
    'NDGE12263',
    '컴퓨터구조',
    ' ',
    '전선',
    3,
    3.00
);
-- sim_course_id는 적지 않아도 알아서 생성됨!

select * from lecture_evidence;

select * from user_majors;

delete from simulation_courses;
select * from lecture_master;

select * from lecture_master;

select * from simulation_plans;
select * from simulation_courses;

select count(*) from lecture_master;  
select * from lecture_frequency;

-- provider_id 컬럼 추가
ALTER TABLE user_actions_log ADD COLUMN provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN college varchar(100) default '건국대학교글로컬';
-- login_sessions에 컬럼 추가
ALTER TABLE login_sessions ADD COLUMN kakao_access_token TEXT;
ALTER TABLE login_sessions ADD COLUMN kakao_token_expires_at TIMESTAMPTZ;

ALTER TABLE lecture_evidence RENAME COLUMN email_hash TO provider_hash;
ALTER TABLE users RENAME COLUMN provider_hash TO provider_id_hash;
ALTER TABLE lecture_evidence RENAME COLUMN provider_hash TO provider_id_hash;
ALTER TABLE users ADD COLUMN provider_hash VARCHAR(64) NOT NULL DEFAULT '';
alter table users drop column updated_at;

drop TABLE user_actions_log CASCADE;
select * from simulation_courses;

select * from lecture_frequency;

ALTER TABLE simulation_courses ADD COLUMN is_active BOOLEAN DEFAULT true;

-- 플랜 여러 개 (학기별로 계속 추가 가능)
CREATE TABLE simulation_plans (
    plan_id     SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(user_id),
    year        INT NOT NULL,
    semester    VARCHAR(20) NOT NULL,
    grade       INT NOT NULL,
    max_credits INT DEFAULT 18,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE simulation_courses (
    sim_course_id   SERIAL PRIMARY KEY,
    plan_id         INT REFERENCES simulation_plans(plan_id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(user_id),
    system_category VARCHAR(20),
    tag_id          INT REFERENCES course_tags(tag_id) ON DELETE SET NULL,
    lecture_credit  INT DEFAULT 3,
    memo            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE course_tags ALTER COLUMN tag_name DROP NOT null;
ALTER TABLE course_tags ALTER COLUMN tag_group SET NOT NULL;
ALTER TABLE course_tags ADD CONSTRAINT uq_tag_group_per_user 
  UNIQUE (user_id, system_category, tag_group, tag_name);

ALTER TABLE course_tags ALTER COLUMN tag_name DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tag_group_null_name 
  ON course_tags (user_id, system_category, tag_group) 
  WHERE tag_name IS NULL;

CREATE UNIQUE INDEX uq_tag_group_null_name 
  ON course_tags (user_id, system_category, tag_group) 
  WHERE tag_name IS NULL;


ALTER TABLE users 
ADD COLUMN total_credits INT DEFAULT 132,
ADD COLUMN major_credits INT DEFAULT 40,
ADD COLUMN general_credits INT DEFAULT 30;



select count(*) from lecture_master;



DELETE FROM lecture_master
WHERE std_lecture_id IN (
    SELECT sub.std_lecture_id
    FROM (
        SELECT 
            std_lecture_id,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    standard_type, 
                    lecture_code,   -- 과목코드
                    lecture_name,   -- 과목명
                    category_type,    -- 이수구분
                    area,
                    credits,        -- 학점
                    times           -- 시수
                ORDER BY curriculum_ver ASC -- 가장 낮은 년도를 1번으로 부여
            ) as rn
        FROM lecture_master
        WHERE standard_type = 'curriculum'
    ) sub
    WHERE sub.rn > 1 -- 1번(최초 개설)을 제외한 나머지 중복 데이터들 선택
);

alter table lecture_evidence drop column provider_id_hash;
select * from lecture_evidence;
-- lec_evidence key
-- 1. 중복 방지용 해시값을 담을 컬럼 추가
ALTER TABLE lecture_evidence ADD COLUMN unique_hash VARCHAR(64);
-- 2. 이 컬럼에 중복된 값이 못 들어오게 유니크 인덱스 설정
CREATE UNIQUE INDEX idx_lecture_unique_hash ON lecture_evidence(unique_hash);








WITH new_val AS (
    INSERT INTO lecture_validation (
        evidence_lec_id, rule_id, validation_score, is_standard,
        started_at, finished_at,
        snap_lecture_code, snap_lecture_name, snap_lecture_credit,
        snap_lecture_category, snap_system_category,
        snap_completion_year, snap_completion_semester
    ) VALUES (
        NULL, NULL, 0.95, TRUE, NOW(), NOW(),
        'CSE021105', '테스트용데이터', 3,
        '전공', 'major', 2024, '2학기'
    )
    RETURNING validation_id
)
INSERT INTO lecture_master (
    validation_id, standard_type, curriculum_ver,
    system_category, lecture_code, lecture_name,
    category_type, credits, area, times,
    last_completed_year, last_completed_semester,
    admission_stats, metadata, updated_at
)
SELECT
    validation_id, 'verified', NULL,
    'major', 'CSE021105', '테스트용데이터',
    '전공', 3.00, NULL, 3.00,
    2024, '2학기',
    '{"20": 4, "21": 22, "22": 28, "23": 9}',
    NULL, NOW()
FROM new_val;