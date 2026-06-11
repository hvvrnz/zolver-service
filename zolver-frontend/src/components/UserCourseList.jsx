import { useState } from 'react';
import { FiSearch, FiPlus, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { MdOutlineSchool } from 'react-icons/md';
import { SEM_ORDER } from '../utils/constants';
import YearGroup from './YearGroup';

const SEM_OPTIONS = ['1학기', '2학기', '하계 계절학기', '동계 계절학기'];

export default function CourseList({
  courses,
  loading,
  grouped,
  years,
  tags,
  onCategoryChange,
  onEdit,
  onDelete,
  onAddCourse,
  onSearchCourse,
  onAddSemester,
  onRemoveSemester,   // 수동 추가 학기 삭제
  manualSemesters,    // 수동 추가 학기 목록 (삭제 버튼 표시 여부 판단용)
}) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [showSemForm, setShowSemForm] = useState(false);
  const [semForm, setSemForm]         = useState({
    year:     new Date().getFullYear(),
    semester: '1학기',
  });

  const handleAddSemester = () => {
    onAddSemester(semForm.year, semForm.semester);
    setShowSemForm(false);
    setSemForm({ year: new Date().getFullYear(), semester: '1학기' });
  };

  // 수동 추가 학기인지 확인
  const isManual = (year, semester) =>
    (manualSemesters || []).some(s => String(s.year) === String(year) && s.semester === semester);

  if (loading) {
    return (
      <div className="record-loading">
        <div className="loading-spinner"/>
        <p>과목 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 학기 직접 추가 버튼 */}
      <div className="sem-add-row">
        {!showSemForm ? (
          <button className="btn-add-semester" onClick={() => setShowSemForm(true)}>
            <FiCalendar size={13}/> 학기 직접 추가
          </button>
        ) : (
          <div className="sem-add-form">
            <span className="sem-add-label">학기 추가</span>
            <input
              className="zol-input sem-year-input"
              type="number"
              min="2000"
              max="2099"
              value={semForm.year}
              onChange={e => setSemForm({ ...semForm, year: Number(e.target.value) })}
            />
            <span className="sem-add-label">년도</span>
            <select
              className="zol-input sem-sem-select"
              value={semForm.semester}
              onChange={e => setSemForm({ ...semForm, semester: e.target.value })}
            >
              {SEM_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-sem-confirm" onClick={handleAddSemester}>추가</button>
            <button className="btn-sem-cancel" onClick={() => setShowSemForm(false)}>취소</button>
          </div>
        )}
      </div>

      {years.length === 0 ? (
        <div className="record-empty">
          <MdOutlineSchool size={44}/>
          <p>등록된 과목이 없어요</p>
          <p className="record-empty-sub">
            성적표를 업로드하거나 과목을 직접 추가해보세요
          </p>
        </div>
      ) : (
        <div className="record-groups">
          {years.map(year => (
            <YearGroup
              key={year}
              year={year}
              semesters={grouped[year] || {}}
              expandedKey={expandedKey}
              onToggle={setExpandedKey}
              onCategoryChange={onCategoryChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddCourse={onAddCourse}
              onSearchCourse={onSearchCourse}
              isManualSemester={isManual}
              onRemoveSemester={onRemoveSemester}
            />
          ))}
        </div>
      )}
    </div>
  );
}

