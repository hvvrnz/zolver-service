import { useState } from 'react';
import reportModalImg from '../../assets/reportmodal.png';
import { FiX, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import { MdPersonAdd } from 'react-icons/md';
import client from '../../api/client';
import './RegisterModal.css';

const CHIP_COLORS = [
  { key: 'green',    label: '연두',     bg: '#e8f0d8', color: '#4e6e30', border: '#ccdcaa' },
  { key: 'mint',     label: '민트',     bg: '#d8eeea', color: '#2e7060', border: '#a8d8cf' },
  { key: 'pink',     label: '뮤트핑크', bg: '#f0e0e8', color: '#8a4060', border: '#ddbbc8' },
  { key: 'lavender', label: '라벤더',   bg: '#e4dff5', color: '#5545a0', border: '#c4b8e8' },
  { key: 'mustard',  label: '베이지', bg: '#f0ebe0', color: '#7a6840', border: '#ddd0a8' },
];
const getChip = key => CHIP_COLORS.find(c => c.key === key) || CHIP_COLORS[0];

const ENROLL_OPTIONS  = ['재학', '휴학', '복학', '수료', '졸업'];
const STUDENT_OPTIONS = ['일반', '편입', '재입학', '교환학생'];

export default function RegisterModal({ isOpen, onClose }) {
  const [step, setStep]     = useState(1); // 1: 기본정보, 2: 전공
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const [form, setForm] = useState({
    name:           '',
    admission_year: '',
    college:        '',
    enroll_status:  '재학',
    student_type:   '일반',
    grade:          1,
  });

  const [majors, setMajors]     = useState([{ major: '', major_type: 'green', college: '' }]);
  const [colorOpen, setColorOpen] = useState(null); // 색상 드롭다운 열린 index

  const handleClose = () => {
    setStep(1);
    setDone(false);
    setForm({ name: '', admission_year: '', college: '', enroll_status: '재학', student_type: '일반', grade: 1 });
    setMajors([{ major: '', major_type: 'green', college: '' }]);
    setColorOpen(null);
    onClose();
  };

  if (!isOpen) return null;

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addMajor = () => setMajors(p => [...p, { major: '', major_type: 'mint', college: '' }]);
  const removeMajor = i => setMajors(p => p.filter((_, idx) => idx !== i));
  const setMajorField = (i, k, v) => setMajors(p => p.map((m, idx) => idx === i ? { ...m, [k]: v } : m));

  const canNext = form.name.trim() && form.admission_year && form.grade && form.college.trim();
  const canSubmit = majors.every(m => m.major.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return alert('학과명을 모두 입력해주세요.');
    setLoading(true);
    try {
      const res = await client.post('/api/v1/users/register', {
        name:           form.name.trim(),
        college:        form.college.trim(),
        admission_year: Number(form.admission_year),
        enroll_status:  form.enroll_status,
        student_type:   form.student_type,
        grade:          Number(form.grade),
        majors:         majors.map(m => ({
          major:      m.major.trim(),
          major_type: m.major_type,
          college:    m.college.trim() || null,
        })),
      });

      // 새 토큰으로 교체 (status: member)
      if (res.data.access_token)  localStorage.setItem('access_token',  res.data.access_token);
      if (res.data.refresh_token) localStorage.setItem('refresh_token', res.data.refresh_token);

      setDone(true);
      setTimeout(() => { window.location.href = '/'; }, 1800);
    } catch (err) {
      alert('등록 실패: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-backdrop" onClick={handleClose}>
      <div className="reg-modal" onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div className="reg-header">
          <div className="reg-header-title">
            <MdPersonAdd size={20}/>
            <span>사용자 등록</span>
          </div>
          <button className="reg-close" onClick={handleClose}><FiX size={17}/></button>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="reg-steps">
          <div className={`reg-step ${step >= 1 ? 'active' : ''}`}>
            <span className="reg-step-num">1</span>
            <span>안내</span>
          </div>
          <div className="reg-step-line"/>
          <div className={`reg-step ${step >= 2 ? 'active' : ''}`}>
            <span className="reg-step-num">2</span>
            <span>기본 정보</span>
          </div>
          <div className="reg-step-line"/>
          <div className={`reg-step ${step >= 3 ? 'active' : ''}`}>
            <span className="reg-step-num">3</span>
            <span>전공 정보</span>
          </div>
        </div>

        {/* 완료 화면 */}
        {done ? (
          <div className="reg-done">
            <div className="reg-done-icon">✓</div>
            <p className="reg-done-title">등록 완료!</p>
            <p className="reg-done-sub">잠시 후 자동으로 이동합니다...</p>
          </div>
        ) : (
          <>
            <div className="reg-body">

              {/* STEP 1: 안내 */}
              {step === 1 && (
                <div className="reg-guide">
                  <div className="reg-guide-img-wrap">
                    <img src={reportModalImg} alt="홈 화면 미리보기" className="reg-guide-img"/>
                    <p className="reg-guide-img-caption">등록 후 홈 화면 미리보기</p>
                  </div>
                  <ul className="reg-guide-list">
                    <li>
                      <span className="reg-guide-num">1</span>
                      <span> 소속대학과 입학연도(학번), 주전공은 유저 등록 후 메인 페이지에 <strong>칩 형식</strong>으로 표시됩니다.</span>
                    </li>
                    <li>
                      <span className="reg-guide-num">2</span>
                      <span><strong>소속대학명과 입학연도 정보는 수정이 불가</strong>하므로 신중하게 입력해주세요.</span>
                    </li>
                    <li>
                      <span className="reg-guide-num">3</span>
                      <span>이름 변경 및 학과 변경은 서비스 내 설정에서 자유롭게 가능합니다.</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* STEP 2: 기본 정보 */}
              {step === 2 && (
                <div className="reg-fields">
                  <div className="reg-field">
                    <label>닉네임 *</label>
                    <input className="reg-input" placeholder="닉네임을 입력해주세요."
                      value={form.name} onChange={e => setField('name', e.target.value)}/>
                  </div>

                  <div className="reg-field">
                    <label>소속 대학(가입 후 변경불가) *</label>
                    <input className="reg-input" placeholder="예: 건국대학교글로컬"
                      value={form.college} onChange={e => setField('college', e.target.value)}/>
                  </div>

                  <div className="reg-field-row">
                    <div className="reg-field">
                      <label>입학연도(가입 후 변경불가) *</label>
                      <input className="reg-input" type="number" placeholder="예: 2026"
                        min="1970" max="2030"
                        value={form.admission_year}
                        onChange={e => setField('admission_year', e.target.value)}/>
                    </div>
                    <div className="reg-field">
                      <label>학년 *</label>
                      <select className="reg-input reg-select"
                        value={form.grade} onChange={e => setField('grade', e.target.value)}>
                        {[1,2,3,4,5].map(g => <option key={g} value={g}>{g}학년</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="reg-field-row">
                    <div className="reg-field">
                      <label>재학 상태</label>
                      <select className="reg-input reg-select"
                        value={form.enroll_status}
                        onChange={e => setField('enroll_status', e.target.value)}>
                        {ENROLL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="reg-field">
                      <label>학생 유형</label>
                      <select className="reg-input reg-select"
                        value={form.student_type}
                        onChange={e => setField('student_type', e.target.value)}>
                        {STUDENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: 전공 정보 */}
              {step === 3 && (
                <div className="reg-fields">
                  <p className="reg-major-hint">
                    소속 학과를 추가하고 칩 색상으로 구분할 수 있어요.
                  </p>
                  {majors.map((m, i) => {
                    const chip = getChip(m.major_type);
                    return (
                      <div key={i} className="reg-major-block">
                        <div className="reg-major-top">
                          <span className="reg-major-num">{i + 1}</span>
                          {majors.length > 1 && (
                            <button className="reg-major-del" onClick={() => removeMajor(i)}>
                              <FiTrash2 size={13}/>
                            </button>
                          )}
                        </div>

                        <div className="reg-field">
                          <label>학과명 *</label>
                          <input className="reg-input" placeholder="예: 컴퓨터공학과"
                            value={m.major}
                            onChange={e => setMajorField(i, 'major', e.target.value)}/>
                        </div>

                        <div className="reg-field">
                          <label>소속 단과대 (선택)</label>
                          <input className="reg-input" placeholder="예: 과학기술대학 ICT융합공학부"
                            value={m.college}
                            onChange={e => setMajorField(i, 'college', e.target.value)}/>
                        </div>

                        <div className="reg-field">
                          <label>칩 색상</label>
                          <div className="reg-color-wrap">
                            <button type="button" className="reg-color-trigger"
                              onClick={() => setColorOpen(colorOpen === i ? null : i)}>
                              <span className="reg-color-swatch"
                                style={{ background: chip.bg, border: `2px solid ${chip.color}` }}/>
                              <span style={{ color: chip.color, fontWeight: 700, fontSize: 13 }}>{chip.label}</span>
                              <span className="reg-color-arrow">{colorOpen === i ? '▲' : '▼'}</span>
                            </button>

                            {colorOpen === i && (
                              <>
                                <div className="reg-color-backdrop"
                                  onMouseDown={() => setColorOpen(null)}/>
                                <div className="reg-color-panel">
                                  {CHIP_COLORS.map(c => (
                                    <button key={c.key} type="button"
                                      className={`reg-color-option${m.major_type === c.key ? ' selected' : ''}`}
                                      onMouseDown={e => { e.preventDefault(); setMajorField(i, 'major_type', c.key); setColorOpen(null); }}>
                                      <span className="reg-color-swatch"
                                        style={{ background: c.bg, border: `2px solid ${c.color}` }}/>
                                      <span style={{ color: c.color, fontWeight: 600, fontSize: 13 }}>{c.label}</span>
                                      <span className="reg-chip-preview"
                                        style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                                        {m.major || '학과명'}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button className="reg-add-major" onClick={addMajor}>
                    <FiPlus size={14}/> 전공 추가
                  </button>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="reg-footer">
              {step === 1 && (
                <>
                  <button className="reg-btn-cancel" onClick={handleClose}>취소</button>
                  <button className="reg-btn-next" onClick={() => setStep(2)}>
                    다음 →
                  </button>
                </>
              )}
              {step === 2 && (
                <>
                  <button className="reg-btn-cancel" onClick={() => setStep(1)}>← 이전</button>
                  <button className="reg-btn-next" onClick={() => setStep(3)} disabled={!canNext}>
                    다음 →
                  </button>
                </>
              )}
              {step === 3 && (
                <>
                  <button className="reg-btn-cancel" onClick={() => setStep(2)}>← 이전</button>
                  <button className="reg-btn-submit" onClick={handleSubmit}
                    disabled={loading || !canSubmit}>
                    {loading ? '등록 중...' : <><FiCheck size={14}/> 등록 완료</>}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
