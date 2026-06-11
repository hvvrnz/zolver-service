import SemesterSection from './SemesterSection';
import { SEM_ORDER } from '../utils/constants';

export default function YearGroup({
  year,
  semesters,
  expandedKey,
  onToggle,
  onCategoryChange,
  onEdit,
  onDelete,
  onAddCourse,
  onSearchCourse,
  isManualSemester,
  onRemoveSemester,
}) {
  return (
    <div className="grade-group">
      <div className="grade-group-title">{year}년도</div>

      {Object.entries(semesters)
        .sort(([a], [b]) => SEM_ORDER.indexOf(a) - SEM_ORDER.indexOf(b))
        .map(([semester, courses]) => (
          <SemesterSection
            key={`${year}-${semester}`}
            year={year}
            semester={semester}
            courses={courses}
            isExpanded={expandedKey === `${year}-${semester}`}
            onToggle={() => {
              const key = `${year}-${semester}`;
              onToggle(expandedKey === key ? null : key);
            }}
            onCategoryChange={onCategoryChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddCourse={onAddCourse}
            onSearchCourse={onSearchCourse}
            // 수동 추가 학기면 삭제 버튼 표시
            isManual={isManualSemester ? isManualSemester(year, semester) : false}
            onRemoveSemester={onRemoveSemester}
          />
        ))}
    </div>
  );
}
