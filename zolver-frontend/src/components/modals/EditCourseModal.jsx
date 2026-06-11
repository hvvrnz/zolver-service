import { FiX } from 'react-icons/fi';
import { SYS_CATEGORY_OPTIONS, FORCE_INVALID, GRADE_OPTIONS } from '../../utils/constants';
import TagSelect from '../TagSelect';

export default function EditCourseModal({
  isOpen,
  course,
  formData,
  onFormChange,
  onClose,
  onSave,
  loading,
  tags,
}) {
  if (!isOpen || !course) return null;

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-box edit-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h4>과목 수정</h4>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX size={18}/>
          </button>
        </div>

        <div className="edit-form-grid">

          <div className="form-group span-2">
            <label>과목명 *</label>
            <input
              className="zol-input"
              value={formData.lecture_name}
              onChange={e => onFormChange('lecture_name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>학점</label>
            <input
              className="zol-input"
              type="number" min="1" max="6"
              value={formData.lecture_credit}
              onChange={e => onFormChange('lecture_credit', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>성적</label>
            <select
              className="zol-input"
              value={formData.course_grade}
              onChange={e => onFormChange('course_grade', e.target.value)}
            >
              {GRADE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>구분</label>
            <select
              className="zol-input"
              value={formData.system_category}
              onChange={e => onFormChange('system_category', e.target.value)}
            >
              {SYS_CATEGORY_OPTIONS.filter(o => o.value !== 'all').map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* [변경] 교양은 lecture_category(그룹) + area(소분류) 분리 */}
          <div className="form-group">
            <label>{formData.system_category === 'general' ? '교양 영역' : '세부영역'}</label>
            <TagSelect
              category={formData.system_category}
              value={formData.lecture_category}
              areaValue={formData.area}
              onChange={e => onFormChange('lecture_category', e.target.value)}
              onAreaChange={e => onFormChange('area', e.target.value)}
              tags={tags}
            />
          </div>

          <div className="form-group">
            <label>이수 년도</label>
            <input
              className="zol-input"
              type="number"
              value={formData.completion_year}
              onChange={e => onFormChange('completion_year', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>이수 학기</label>
            <select
              className="zol-input"
              value={formData.completion_semester}
              onChange={e => onFormChange('completion_semester', e.target.value)}
            >
              <option value="1학기">1학기</option>
              <option value="2학기">2학기</option>
              <option value="하계 계절학기">하계 계절학기</option>
              <option value="동계 계절학기">동계 계절학기</option>
            </select>
          </div>

          <div className="form-group span-2">
            <label className="edit-toggle-label">
              <input
                type="checkbox"
                checked={!!formData.delete_type}
                onChange={e => onFormChange('delete_type', e.target.checked ? '취득학점포기' : null)}
              />
              <span>취득학점 포기 (평점 계산 제외)</span>
            </label>
            {formData.course_grade === 'F' && (
              <p className="edit-auto-note">
                ⚠️ F학점은 취득학점에는 미반영되지만 평점에는 0.0으로 반영돼요.<br/>
                    평점에서도 제외하려면 위 취득학점 포기에 체크해주세요.<br/><br/>
                    실제 취득학점 포기 여부는 본인이 반드시 확인해주세요. <br/>
                    (성적표, 학사포털 확인 및 학과사무실 문의)
              </p>
            )}
            {['N', 'NP'].includes((formData.course_grade || '').toUpperCase()) && (
              <p className="edit-auto-note">⚠️ N/NP 성적은 취득학점과 평점 모두 미반영돼요.</p>
            )}
          </div>

        </div>

        <div className="course-form-actions">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-save" onClick={onSave} disabled={loading}>
            {loading ? '저장 중...' : '수정 완료'}
          </button>
        </div>

      </div>
    </div>
  );
}
