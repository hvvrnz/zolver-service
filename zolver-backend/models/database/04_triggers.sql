CREATE OR REPLACE FUNCTION fn_snap_evidence_to_validation()
RETURNS TRIGGER AS $$
DECLARE
    -- ① 변수 선언 구역: BEGIN 전에 전부 선언해야 함
    v_past_validation_id INT4;       -- 재업로드 감지용
    v_user_college       VARCHAR(100); -- 유저 소속 학교
    v_transcript_count   INT4;       -- ✅ 추가: 성적표 업로드 횟수
BEGIN
 
    -- ================================================================
    -- STEP 1: 재업로드 감지
    -- 동일한 unique_hash로 과거에 올렸다가 삭제된 기록이 있는지 확인
    -- evidence_lec_id IS NULL = 유저가 삭제해서 FK가 끊긴 상태
    -- ================================================================
    SELECT validation_id
    INTO v_past_validation_id         -- ② SELECT INTO: 조회 결과를 변수에 담기
    FROM lecture_validation
    WHERE snap_unique_hash = NEW.unique_hash  -- NEW = 방금 INSERT된 행
      AND evidence_lec_id IS NULL
    LIMIT 1;
 
    -- ③ IF 문법: IF 조건 THEN ... END IF; (세미콜론 필수)
    IF v_past_validation_id IS NOT NULL THEN
        RAISE NOTICE '재업로드 감지: validation_id % 번', v_past_validation_id;
        -- RAISE NOTICE = 로그 출력. %는 뒤 변수값으로 치환됨
    END IF;
 
 
    -- ================================================================
    -- STEP 2: CASE 1 — source_type = 'excel'
    -- 성적표 업로드 과목. 조건 없이 전부 스냅샷 저장.
    -- ================================================================
    IF NEW.source_type = 'excel' THEN   -- ④ NEW.컬럼명으로 INSERT된 값 접근
        INSERT INTO lecture_validation (
            evidence_lec_id,
            snap_unique_hash,
            snap_lecture_code,
            snap_lecture_name,
            snap_lecture_credit,
            snap_lecture_category,
            snap_system_category,
            snap_area,
            snap_admission_year,
            snap_completion_year,
            snap_completion_semester,
            snap_source_type,
            snap_college
        )
        SELECT                          -- ⑤ INSERT INTO ... SELECT: 조회 결과를 바로 삽입
            NEW.evidence_lec_id,
            NEW.unique_hash,
            NEW.lecture_code,
            NEW.lecture_name,
            NEW.lecture_credit,
            NEW.lecture_category,
            NEW.system_category,
            NEW.area,
            u.admission_year,
            NEW.completion_year,
            NEW.completion_semester,
            NEW.source_type,
            u.college
        FROM users u
        WHERE u.user_id = NEW.user_id;
 
    -- ================================================================
    -- STEP 3: CASE 2 — source_type = 'manual'
    -- 아래 세 조건 모두 충족할 때만 스냅샷 저장:
    --   ① 유저의 college = '건국대학교글로컬' (서비스 대상 학교)
    --   ② lecture_code != 'MANUAL' (실제 과목코드가 있는 경우)
    --   ③ transcript_upload_count >= 1 (성적표 최소 1회 업로드한 유저) ✅ 추가
    -- ================================================================
    ELSIF NEW.source_type = 'manual' AND NEW.lecture_code != 'MANUAL' THEN
        -- ⑥ ELSIF: else if. 앞 조건 안 맞을 때 다음 조건 확인
 
        -- college + transcript_upload_count 한 번에 조회 (쿼리 2번 → 1번으로 최적화)
        SELECT college, transcript_upload_count
        INTO v_user_college, v_transcript_count   -- ⑦ 변수 여러 개에 한번에 담기
        FROM users
        WHERE user_id = NEW.user_id;
 
        -- 세 조건 모두 통과할 때만 스냅샷 저장
        -- ⑧ AND로 조건 연결. 줄바꿈해도 동일하게 동작
        IF v_user_college = '건국대학교글로컬'
           AND v_transcript_count >= 1
        THEN
            INSERT INTO lecture_validation (
                evidence_lec_id,
                snap_unique_hash,
                snap_lecture_code,
                snap_lecture_name,
                snap_lecture_credit,
                snap_lecture_category,
                snap_system_category,
                snap_area,
                snap_admission_year,
                snap_completion_year,
                snap_completion_semester,
                snap_source_type,
                snap_college
            )
            SELECT
                NEW.evidence_lec_id,
                NEW.unique_hash,
                NEW.lecture_code,
                NEW.lecture_name,
                NEW.lecture_credit,
                NEW.lecture_category,
                NEW.system_category,
                NEW.area,
                u.admission_year,
                NEW.completion_year,
                NEW.completion_semester,
                NEW.source_type,
                u.college
            FROM users u
            WHERE u.user_id = NEW.user_id;
        END IF;
 
    END IF;  -- ⑨ IF 블록 닫기. ELSIF/ELSE 포함한 전체를 END IF로 닫음
 
    RETURN NEW;  -- ⑩ 트리거 함수는 반드시 행 반환. AFTER INSERT면 NEW 반환
END;
$$ LANGUAGE plpgsql;
 
 
-- ========================================
-- 트리거 정의
-- ⑪ DROP TRIGGER IF EXISTS: 이미 있으면 지우고 다시 만들기 (재실행 안전)
-- AFTER INSERT: evidence가 완전히 삽입된 후 실행
-- FOR EACH ROW: 삽입된 행마다 함수 실행
-- ========================================
DROP TRIGGER IF EXISTS trg_snap_evidence ON lecture_evidence;
CREATE TRIGGER trg_snap_evidence
    AFTER INSERT ON lecture_evidence
    FOR EACH ROW
    EXECUTE FUNCTION fn_snap_evidence_to_validation();