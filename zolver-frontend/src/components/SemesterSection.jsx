import { FiChevronDown, FiChevronUp, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import CourseCard from './UserCourseCard';
import { INVALID_GRADES } from '../utils/constants';

export default function SemesterSection({
  year,
  semester,
  courses,
  isExpanded,
  onToggle,
  onCategoryChange,
  onEdit,
  onDelete,
  onAddCourse,
  onSearchCourse,
  isManual,         // 수동 추가 학기 여부
  onRemoveSemester, // 학기 삭제 핸들러
}) {
  const isInvalid = (c) => INVALID_GRADES.includes(c.course_grade) || c.delete_type !== null;
  const validCredits = courses
    .filter(c => !isInvalid(c))
    .reduce((sum, c) => sum + (c.lecture_credit || 0), 0);

  const handleRemove = () => {
    if (courses.length > 0) {
      if (!window.confirm(`${year}년도 ${semester}를 삭제하면 이 학기에 추가한 과목도 모두 삭제돼요. 계속할까요?`)) return;
      // 과목이 있으면 각 과목 삭제 후 학기 제거는 부모에서 처리
    }
    onRemoveSemester(year, semester);
  };

  return (
    <div className="sem-section">
      <div className="sem-section-header-wrap">
        <button
          className={`sem-section-header ${isExpanded ? 'open' : ''}`}
          onClick={onToggle}
        >
          <div className="sem-section-left">
            <span className="sem-section-label">{semester}</span>
            <span className="sem-section-meta">
              {courses.length}과목 · 유효 {validCredits}학점
            </span>
            {isManual && courses.length === 0 && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-disabled)', marginLeft: '4px' }}>
                빈 학기
              </span>
            )}
          </div>
          {isExpanded ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
        </button>

        <div className="sem-section-actions">
          <button
            className="btn-sem-search"
            title="과목 검색 추가"
            onClick={() => onSearchCourse(year, semester)}
          >
            <FiSearch size={13}/>
          </button>
          <button
            className="btn-sem-add"
            title="직접 입력"
            onClick={() => onAddCourse(year, semester)}
          >
            <FiPlus size={13}/>
          </button>
          {/* 수동 추가 학기만 삭제 버튼 표시 */}
          {isManual && (
            <button
              className="btn-sem-remove"
              title="학기 삭제"
              onClick={handleRemove}
            >
              <FiTrash2 size={13}/>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="course-card-grid">
          {courses.map(course => (
            <CourseCard
              key={course.evidence_lec_id}
              course={course}
              onCategoryChange={onCategoryChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
