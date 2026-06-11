import { FiSearch, FiX, FiAlertCircle, FiFilter, FiInfo, FiCheck } from 'react-icons/fi';
import { MdAdminPanelSettings, MdVerified } from 'react-icons/md';
import { SYS_CATEGORY_OPTIONS, BADGE_OPTIONS } from '../../utils/constants';

// ✅ onDirectSave: 과목 선택 시 모달 없이 바로 DB 저장하는 핸들러 (CourseRecordPage에서 전달)
// onSelect: 기존처럼 AddCourseModal로 넘기는 경우 (상세 확인 필요할 때 사용 가능)
export default function SearchModal({
  isOpen,
  onClose,
  onDirectSave,   // ✅ 추가: 선택 → 바로 저장
  onSelect,       // 기존 유지 (필요시 사용)
  formYear,
  formSem,
  hasUploaded,
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  categoryFilter,
  onCategoryChange,
  badgeFilter,
  onBadgeChange,
  onDetailClick,
  saving,         // 저장 중 로딩 상태
}) {
  if (!isOpen) return null;

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function renderBadge(course) {
    if (course.validation_id)
      return <span className="badge badge-verified"><MdVerified size={11}/> 검증완료</span>;
    if (course.standard_type === 'curriculum')
      return <span className="badge badge-curriculum"><MdAdminPanelSettings size={11}/> 관리자 등록</span>;
    return null;
  }

  // 추가 버튼 클릭: onDirectSave가 있으면 바로 저장, 없으면 기존 onSelect 흐름
  function handleAdd(course) {
    if (onDirectSave) {
      onDirectSave(course);
    } else {
      onSelect(course);
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h4>이수 과목 검색 추가</h4>
            {formYear && <p className="modal-header-sub">{formYear}년 {formSem}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose}><FiX size={18}/></button>
        </div>

        {!hasUploaded && (
          <div className="modal-upload-notice">
            <FiInfo size={14}/>
            <span>성적표를 먼저 업로드해야 과목 검색이 가능해요</span>
          </div>
        )}

        <div className="modal-badge-guide">
          <div className="badge-guide-item">
            <span className="badge badge-curriculum"><MdAdminPanelSettings size={11}/> 관리자 등록</span>
            <span>관리자가 직접 확인한 실제 존재 과목</span>
          </div>
          <div className="badge-guide-item">
            <span className="badge badge-verified"><MdVerified size={11}/> 시스템 검증완료</span>
            <span>학생 업로드 데이터를 시스템이 검증한 과목</span>
          </div>
        </div>

        <div className="modal-search-bar">
          <FiSearch size={15}/>
          <input
            autoFocus
            placeholder={hasUploaded ? '과목명을 입력하세요' : '성적표 업로드 후 검색 가능해요'}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            disabled={!hasUploaded}
          />
        </div>

        <div className="modal-filters">
          <div className="filter-group">
            <FiFilter size={12}/>
            {SYS_CATEGORY_OPTIONS.map(o => (
              <button key={o.value}
                className={`filter-tab ${categoryFilter === o.value ? 'active' : ''}`}
                onClick={() => onCategoryChange(o.value)}
                disabled={!hasUploaded}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {BADGE_OPTIONS.map(o => (
              <button key={o.value}
                className={`filter-tab ${badgeFilter === o.value ? `active ${o.value}` : ''}`}
                onClick={() => onBadgeChange(o.value)}
                disabled={!hasUploaded}
              >
                {o.value === 'curriculum' && <MdAdminPanelSettings size={11}/>}
                {o.value === 'verified'   && <MdVerified size={11}/>}
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-results">
          {searchLoading && <div className="modal-loading"><div className="loading-spinner"/></div>}

          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <div className="modal-empty">
              <FiAlertCircle size={22}/>
              <p>검색 결과가 없어요</p>
            </div>
          )}

          {!searchLoading && searchResults.map((c, i) => (
            <div key={i} className="modal-result-item">
              <div className="modal-result-info">
                <div className="modal-result-top">
                  <span className="modal-result-name">{c.lecture_name}</span>
                  {renderBadge(c)}
                </div>
                <div className="modal-result-meta">
                  <span className={`cat-badge ${c.system_category}`}>
                    {SYS_CATEGORY_OPTIONS.find(o => o.value === c.system_category)?.label}
                  </span>
                  <span>{c.lecture_credit || c.credits}학점</span>
                  {c.lecture_category && <span>{c.lecture_category}</span>}
                  <span className="course-code-small">{c.lecture_code}</span>
                </div>
              </div>
              <div className="modal-result-actions">
                <button className="btn-detail-sm" onClick={() => onDetailClick(c)}>
                  <FiInfo size={13}/>
                </button>
                {/* ✅ 추가 버튼: 바로 저장, saving 중엔 비활성화 */}
                <button
                  className="modal-select-btn"
                  onClick={() => handleAdd(c)}
                  disabled={saving}
                >
                  <FiCheck size={12}/>
                  {saving ? '저장 중...' : '추가'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
