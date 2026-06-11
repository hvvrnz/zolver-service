import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { EMPTY_FORM, SYS_CATEGORY_OPTIONS, FORCE_INVALID, GRADE_OPTIONS } from '../../utils/constants';
import FormGroup from '../FormGroup';
import TagSelect from '../TagSelect';

export default function AddCourseModal({
  isOpen,
  onClose,
  onSave,
  formYear,
  formSem,
  tags,
  selectedCourse,
}) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY_FORM,
        completion_year:     formYear || new Date().getFullYear(),
        completion_semester: formSem  || '1학기',
        ...(selectedCourse ? {
          lecture_name:     selectedCourse.lecture_name    || '',
          lecture_credit:   selectedCourse.credits         || 3,
          system_category:  selectedCourse.system_category || 'major',
          lecture_code:     selectedCourse.lecture_code    || 'MANUAL',
          lecture_category: selectedCourse.category_type   || '',
          area:             selectedCourse.area            || '',
        } : {}),
      });
    }
  }, [isOpen, formYear, formSem, selectedCourse]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleChange(field, value) {
    setForm(prev => {
      // 구분(system_category) 바뀌면 lecture_category + area 초기화
      if (field === 'system_category') return { ...prev, system_category: value, lecture_category: '', area: '' };
      if (field === 'course_grade') {
        const forceInvalid = ['N', 'NP'].includes(value.toUpperCase());
        return { ...prev, course_grade: value, delete_type: forceInvalid ? '취득학점포기' : prev.delete_type };
      }
      return { ...prev, [field]: value };
    });
  }

  async function handleSave() {
    if (!form.lecture_name.trim()) { alert('과목명을 입력해주세요.'); return; }
    if (!form.lecture_credit || form.lecture_credit < 1) { alert('학점을 입력해주세요.'); return; }
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      console.error('저장 실패:', err);
      alert(`과목 추가 실패: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const isFromSearch = !!selectedCourse;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-box edit-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h4>{isFromSearch ? '과목 추가 확인' : '수기 과목 추가'}</h4>
            {formYear && <p className="modal-header-sub">{formYear}년 {formSem}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose}><FiX size={18}/></button>
        </div>

        <div className="edit-form-grid">

          <FormGroup label="과목명 *" span={2}>
            <input
              className="zol-input"
              placeholder="예: 자료구조"
              autoFocus
              value={form.lecture_name}
              onChange={e => handleChange('lecture_name', e.target.value)}
            />
          </FormGroup>

          <FormGroup label="학점 *">
            <input
              className="zol-input"
              type="number" min="1" max="6"
              value={form.lecture_credit}
              onChange={e => handleChange('lecture_credit', Number(e.target.value))}
            />
          </FormGroup>

          <FormGroup label="성적">
            <select
              className="zol-input"
              value={form.course_grade}
              onChange={e => handleChange('course_grade', e.target.value)}
            >
              {GRADE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="구분 *">
            <select
              className="zol-input"
              value={form.system_category}
              onChange={e => handleChange('system_category', e.target.value)}
            >
              {SYS_CATEGORY_OPTIONS.filter(o => o.value !== 'all').map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormGroup>

          {/* [변경] 교양은 lecture_category(그룹) + area(소분류) 분리 저장 */}
          <FormGroup label={form.system_category === 'general' ? '교양 영역' : '세부영역'}>
            <TagSelect
              category={form.system_category}
              value={form.lecture_category}
              areaValue={form.area}
              onChange={e => handleChange('lecture_category', e.target.value)}
              onAreaChange={e => handleChange('area', e.target.value)}
              tags={tags}
            />
          </FormGroup>

          {!formYear && (
            <>
              <FormGroup label="이수 년도 *">
                <input
                  className="zol-input"
                  type="number" min="2000"
                  value={form.completion_year}
                  onChange={e => handleChange('completion_year', Number(e.target.value))}
                />
              </FormGroup>
              <FormGroup label="이수 학기 *">
                <select
                  className="zol-input"
                  value={form.completion_semester}
                  onChange={e => handleChange('completion_semester', e.target.value)}
                >
                  <option value="1학기">1학기</option>
                  <option value="2학기">2학기</option>
                  <option value="하계 계절학기">하계 계절학기</option>
                  <option value="동계 계절학기">동계 계절학기</option>
                </select>
              </FormGroup>
            </>
          )}

          <FormGroup label="" span={2}>
            <label className="edit-toggle-label">
              <input
                type="checkbox"
                checked={!!form.delete_type}
                onChange={e => handleChange('delete_type', e.target.checked ? '취득학점포기' : null)}
              />
              <span>취득학점 포기 (평점 계산 제외)</span>
            </label>
            {form.course_grade === 'F' && (
              <p className="edit-auto-note">
                ⚠️ F학점은 취득학점에는 미반영되지만 평점에는 0.0으로 반영돼요.<br/>
                평점에서도 제외하려면 위 취득학점 포기에 체크해주세요.<br/><br/>
                실제 취득학점 포기 여부는 본인이 반드시 확인해주세요. <br/>
                (성적표, 학사포털 확인 및 학과사무실 문의)</p>
            )}
            {['N', 'NP'].includes((form.course_grade || '').toUpperCase()) && (
              <p className="edit-auto-note">⚠️ N/NP 성적은 취득학점과 평점 모두 미반영돼요.</p>
            )}
          </FormGroup>

        </div>

        <div className="course-form-actions">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? '저장 중...' : '과목 추가'}
          </button>
        </div>

      </div>
    </div>
  );
}
