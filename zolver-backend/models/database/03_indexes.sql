-- ========================================
-- lecture_validation
-- ========================================

-- 동일 evidence + rule 중복 검증 방지
-- (rule_id가 NULL인 스냅샷 행은 제외 → WHERE rule_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_val_evidence_rule
    ON lecture_validation(evidence_lec_id, rule_id)
    WHERE rule_id IS NOT NULL;

-- Airflow가 frequency upsert 할 때 snap 컬럼으로 JOIN하는 경로
CREATE INDEX IF NOT EXISTS idx_val_snap_keys
    ON lecture_validation(snap_lecture_code, snap_lecture_name,
                          snap_lecture_credit, snap_lecture_category);

CREATE INDEX IF NOT EXISTS idx_val_snap_unique_hash ON lecture_validation(snap_unique_hash);


-- ========================================
-- lecture_frequency
-- ========================================

-- 승격 후보 조회: match_count >= 2 AND is_promoted = FALSE
CREATE INDEX IF NOT EXISTS idx_freq_promotion_candidates
    ON lecture_frequency(match_count, is_promoted)
    WHERE is_promoted = FALSE;


CREATE UNIQUE INDEX uk_master_verified 
ON lecture_master (lecture_code, lecture_name, credits, category_type)
WHERE standard_type = 'verified';