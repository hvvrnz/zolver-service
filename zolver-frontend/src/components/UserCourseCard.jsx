import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { SYS_CATEGORY_OPTIONS, INVALID_GRADES } from '../utils/constants';

export default function CourseCard({ course, onCategoryChange, onEdit, onDelete }) {
  const isInvalid = INVALID_GRADES.includes(course.course_grade) || course.delete_type !== null;
  const isManual  = course.source_type === 'manual';

  // 교양 과목 태그 표시 로직
  // - lecture_category: 그룹(대분류) — 항상 표시
  // - area: 소분류(tag_name) — 있을 때만 추가 표시
  const showGroupChip = !!course.lecture_category;
  const showSubChip   = course.system_category === 'general' && !!course.area && course.area !== course.lecture_category;

  return (
    <div className={`course-card ${isInvalid ? 'invalid' : ''}`}>
      <div className="course-card-main">
        <div className="course-card-left">

          {/* 과목명 + 수기 뱃지 + 취득포기 */}
          <div className="course-card-name-row">
            <span className={`course-card-name ${isInvalid ? 'strikethrough' : ''}`}>
              {course.lecture_name}
            </span>
            {isManual && <span className="badge badge-manual">수기</span>}
            {course.delete_type && <span className="badge-invalid-text">취득포기</span>}
          </div>

          {/* 성적 · 학점 */}
          <div className="course-card-sub">
            <span className={`course-grade-text ${isInvalid ? 'grade-invalid' : ''}`}>
              {course.course_grade || '-'}
            </span>
            <span className="dot">·</span>
            <span>{course.lecture_credit}학점</span>
          </div>

          {/* [변경] 태그 칩 영역
              - 전공/기타: lecture_category 칩 하나
              - 교양: lecture_category(그룹) 칩 + area(소분류) 칩(있을 때) */}
          {showGroupChip && (
            <div className="course-card-tags-row">
              {/* 그룹(대분류) 칩 */}
              <span className={`cat-tag-chip ${course.system_category}`}>
                {course.lecture_category}
              </span>

              {/* 소분류 칩 — 교양에서 area까지 지정한 경우만 */}
              {showSubChip && (
                <span className={`cat-tag-chip ${course.system_category} sub-chip`}>
                  {course.area}
                </span>
              )}
            </div>
          )}

          <div className="course-card-code">{course.lecture_code}</div>

        </div>

        <div className="course-card-right">
          <select
            className={`cat-select ${course.system_category}`}
            value={course.system_category}
            onChange={e => onCategoryChange(course.evidence_lec_id, e.target.value)}
          >
            {SYS_CATEGORY_OPTIONS.filter(o => o.value !== 'all').map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="course-card-actions">
            <button onClick={() => onEdit(course)} title="수정">
              <FiEdit2 size={12}/>
            </button>
            <button onClick={() => onDelete(course.evidence_lec_id)} title="삭제" className="danger">
              <FiTrash2 size={12}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
