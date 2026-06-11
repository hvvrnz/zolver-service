-- ========================================
-- lecture_master: 교육과정 버전 내 과목코드 중복 방지
-- ========================================
DO $$ BEGIN
    ALTER TABLE lecture_master ADD CONSTRAINT uk_lecture_master_ver_code UNIQUE (curriculum_ver, lecture_code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ========================================
-- lecture_evidence: unique_hash 중복 방지
-- ========================================
DO $$ BEGIN
    ALTER TABLE lecture_evidence ADD CONSTRAINT uk_lec_unique_hash UNIQUE (unique_hash);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- lecture_validation_evidence_lec_id_fkey 는 01_schema.sql의 lecture_validation 테이블 정의에서
-- evidence_lec_id INT4 REFERENCES lecture_evidence(evidence_lec_id) ON DELETE SET NULL 로 이미 생성됨 → 중복 제거

-- ========================================
-- course_tags: 유저별 태그 중복 방지
-- ========================================
DO $$ BEGIN
    ALTER TABLE course_tags ADD CONSTRAINT unique_user_tag UNIQUE (user_id, system_category, tag_group, tag_name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ========================================
-- lecture_frequency: 4대 요소 조합 UNIQUE
-- ✅ 이게 핵심: ON CONFLICT의 기준이 됨
--    lecture_code만으론 부족 → 4개 조합이 진짜 "같은 과목" 판단 기준
-- ========================================
DO $$ BEGIN
    ALTER TABLE lecture_frequency ADD CONSTRAINT uk_freq_4keys UNIQUE (lecture_code, lecture_name, lecture_credit, lecture_category);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 중복 로그인 세션 생성 방지
DO $$ BEGIN
    ALTER TABLE login_sessions ADD CONSTRAINT uk_login_provider UNIQUE (provider_id_hash, provider);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;