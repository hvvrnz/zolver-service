import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiX, FiPlus, FiEdit2, FiTrash2, FiCheck, FiAlertTriangle, FiLogOut, FiUser } from 'react-icons/fi';
import { createMajor, updateMajor, deleteMajor } from '../../api/majors';
import { deleteMyAccount, updateMyCredits, updateMyName } from '../../api/user';
import './SettingsModal.css';

// major_type 컬럼에 color key 직접 저장
// 'green' | 'mint' | 'pink' | 'lavender' | 'mustard'
const CHIP_COLORS = [
  { key: 'green',    label: '연두',     bg: '#e8f0d8', color: '#4e6e30', border: '#ccdcaa' },
  { key: 'mint',     label: '민트',     bg: '#d8eeea', color: '#2e7060', border: '#a8d8cf' },
  { key: 'pink',     label: '핑크', bg: '#f0e0e8', color: '#8a4060', border: '#ddbbc8' },
  { key: 'lavender', label: '라벤더',   bg: '#e4dff5', color: '#5545a0', border: '#c4b8e8' },
  { key: 'mustard',  label: '베이지', bg: '#f0ebe0', color: '#7a6840', border: '#ddd0a8' },
];

// 성적표 자동 파싱값 → color key fallback
const AUTO_COLOR_MAP = {
  '주전공':   'green',
  '복수전공': 'mint',
  '다전공':   'mint',
  '부전공':   'pink',
  '연계전공': 'lavender',
  '기타':     'mustard',
};

// major_type → 칩 스타일 (color key 직접 or 파싱값 fallback 모두 처리)
const getChipStyle = (majorType) => {
  const direct = CHIP_COLORS.find(c => c.key === majorType);
  if (direct) return direct;
  const mapped = AUTO_COLOR_MAP[majorType];
  return CHIP_COLORS.find(c => c.key === mapped) || CHIP_COLORS[0];
};

export default function SettingsModal({ isOpen, onClose, userInfo, majors: initialMajors, onSaved }) {
  const [majors, setMajors]             = useState(initialMajors || []);
  const [editMajorId, setEditMajorId]   = useState(null);
  const [majorForm, setMajorForm]       = useState({ major: '', major_type: 'green', college: '' });
  const [showAddMajor, setShowAddMajor] = useState(false);
  const [majorLoading, setMajorLoading] = useState(false);

  const [credits, setCredits] = useState({
    total_credits:   userInfo?.total_credits   || 130,
    major_credits:   userInfo?.major_credits   || 60,
    general_credits: userInfo?.general_credits || 30,
  });
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsSaved, setCreditsSaved]     = useState(false);

  const [nameValue, setNameValue]     = useState(userInfo?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved]     = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMajors(initialMajors || []);
      setCredits({
        total_credits:   userInfo?.total_credits   || 130,
        major_credits:   userInfo?.major_credits   || 60,
        general_credits: userInfo?.general_credits || 30,
      });
      setNameValue(userInfo?.name || '');
      setNameSaved(false);
      setShowAddMajor(false);
      setEditMajorId(null);
    }
  }, [isOpen, initialMajors, userInfo]);

  if (!isOpen) return null;

  const handleAddMajor = async () => {
    if (!majorForm.major.trim()) return alert('학과명을 입력해주세요.');
    setMajorLoading(true);
    try {
      const res = await createMajor({ major: majorForm.major.trim(), major_type: majorForm.major_type, college: majorForm.college || null });
      setMajors(prev => [...prev, { user_major_id: res.data.user_major_id, major: majorForm.major.trim(), major_type: majorForm.major_type, college: majorForm.college || null }]);
      setMajorForm({ major: '', major_type: 'green', college: '' });
      setShowAddMajor(false);
      onSaved?.();
    } catch (err) { alert('전공 추가 실패: ' + (err.response?.data?.detail || err.message)); }
    finally { setMajorLoading(false); }
  };

  const handleUpdateMajor = async (id) => {
    setMajorLoading(true);
    try {
      await updateMajor(id, { major: majorForm.major.trim(), major_type: majorForm.major_type, college: majorForm.college || null });
      setMajors(prev => prev.map(m => m.user_major_id === id
        ? { ...m, major: majorForm.major.trim(), major_type: majorForm.major_type, college: majorForm.college }
        : m));
      setEditMajorId(null);
      onSaved?.();
    } catch (err) { alert('전공 수정 실패: ' + (err.response?.data?.detail || err.message)); }
    finally { setMajorLoading(false); }
  };

  const handleDeleteMajor = async (id) => {
    if (!window.confirm('전공을 삭제할까요?')) return;
    try {
      await deleteMajor(id);
      setMajors(prev => prev.filter(m => m.user_major_id !== id));
      onSaved?.();
    } catch (err) { alert('전공 삭제 실패: ' + (err.response?.data?.detail || err.message)); }
  };

  const handleSaveCredits = async () => {
    setCreditsLoading(true);
    try {
      await updateMyCredits({ total_credits: Number(credits.total_credits), major_credits: Number(credits.major_credits), general_credits: Number(credits.general_credits) });
      setCreditsSaved(true); setTimeout(() => setCreditsSaved(false), 2000);
      onSaved?.();
    } catch (err) { alert('학점 설정 저장 실패: ' + (err.response?.data?.detail || err.message)); }
    finally { setCreditsLoading(false); }
  };

  const handleSaveAll = async () => {
    const tasks = [];
    if (nameValue.trim() && nameValue.trim() !== (userInfo?.name || '')) {
      tasks.push(updateMyName({ name: nameValue.trim() }));
    }
    const creditsChanged =
      Number(credits.total_credits)   !== (userInfo?.total_credits   || 130) ||
      Number(credits.major_credits)   !== (userInfo?.major_credits   || 60)  ||
      Number(credits.general_credits) !== (userInfo?.general_credits || 30);
    if (creditsChanged) {
      tasks.push(updateMyCredits({
        total_credits:   Number(credits.total_credits),
        major_credits:   Number(credits.major_credits),
        general_credits: Number(credits.general_credits),
      }));
    }
    if (tasks.length === 0) return onClose();
    setCreditsLoading(true);
    try {
      await Promise.all(tasks);
      setCreditsSaved(true);
      setTimeout(() => { setCreditsSaved(false); onSaved?.(); onClose(); }, 800);
    } catch (err) { alert('저장 실패: ' + (err.response?.data?.detail || err.message)); }
    finally { setCreditsLoading(false); }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return alert('이름을 입력해주세요.');
    setNameLoading(true);
    try {
      await updateMyName({ name: nameValue.trim() });
      setNameSaved(true); setTimeout(() => setNameSaved(false), 2000);
      onSaved?.();
    } catch (err) { alert('이름 변경 실패: ' + (err.response?.data?.detail || err.message)); }
    finally { setNameLoading(false); }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠어요?')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };

  // 커스텀 색상 선택 드롭다운 — fixed 포지션으로 모달 overflow 우회
  const ColorSelect = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const selected = getChipStyle(value);

    const handleOpen = () => {
      if (!open && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPanelPos({ top: rect.bottom + 4, left: rect.left });
      }
      setOpen(o => !o);
    };

    return (
      <div className="cs-wrap" tabIndex={0} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <button ref={triggerRef} type="button" className="cs-trigger" onClick={handleOpen}>
          <span className="cs-swatch" style={{ background: selected.bg, border: `2px solid ${selected.color}` }}/>
          <span className="cs-label" style={{ color: selected.color }}>{selected.label}</span>
          <span className="cs-arrow">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="cs-panel" style={{ position: 'fixed', top: panelPos.top, left: panelPos.left }}>
            {CHIP_COLORS.map(c => (
              <button key={c.key} type="button" className={`cs-option${value === c.key ? ' cs-selected' : ''}`}
                onClick={() => { onChange(c.key); setOpen(false); }}>
                <span className="cs-swatch" style={{ background: c.bg, border: `2px solid ${c.color}` }}/>
                <span style={{ color: c.color, fontWeight: 600, fontSize: 13 }}>{c.label}</span>
                <span className="cs-chip-preview" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                  학과명
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-title"><FiSettings size={18}/> 설정</h2>
          <button className="modal-close-btn" onClick={onClose}><FiX size={17}/></button>
        </div>

        <div className="modal-body">

          {/* ① 프로필 수정 */}
          <div className="settings-section">
            <div className="section-label"><FiUser size={13} style={{ marginRight: 5 }}/>프로필 정보 수정</div>
            <div className="profile-info-grid">
              <div className="profile-field">
                <label className="profile-field-label">이름</label>
                <div className="profile-field-row">
                  <input className="zol-input profile-input" placeholder="이름 입력"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}/>

                </div>
              </div>
              <div className="profile-field">
                <label className="profile-field-label">학번</label>
                <div className="profile-field-row">
                  <input className="zol-input profile-input" readOnly
                    value={userInfo?.admission_year ? `${userInfo.admission_year}학번` : '—'}
                    style={{ background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}/>
                  <span className="profile-readonly-hint">자동설정</span>
                </div>
              </div>
              <div className="profile-field">
                <label className="profile-field-label">소속 대학</label>
                <div className="profile-field-row">
                  <input className="zol-input profile-input" readOnly
                    value={userInfo?.college || '—'}
                    style={{ background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}/>
                  <span className="profile-readonly-hint">자동설정</span>
                </div>
              </div>
            </div>
          </div>

          {/* ② 전공 관리 */}
          <div className="settings-section">
            <div className="section-label">소속 학과 및 다중전공 관리</div>
            <p className="section-hint">칩 색상을 선택해 홈 화면에서 전공을 구분할 수 있어요</p>

            <div className="major-list">
              {majors.map(m => {
                const chipStyle = getChipStyle(m.major_type);
                return (
                  <div key={m.user_major_id} className="major-item">
                    {editMajorId === m.user_major_id ? (
                      <div className="major-edit-row">
                        <input className="zol-input major-input"
                          value={majorForm.major}
                          onChange={e => setMajorForm(p => ({ ...p, major: e.target.value }))}
                          placeholder="학과명"/>
                        <ColorSelect
                          value={majorForm.major_type}
                          onChange={v => setMajorForm(p => ({ ...p, major_type: v }))}/>
                        <button className="major-btn confirm" onClick={() => handleUpdateMajor(m.user_major_id)} disabled={majorLoading}><FiCheck size={13}/></button>
                        <button className="major-btn cancel" onClick={() => setEditMajorId(null)}><FiX size={13}/></button>
                      </div>
                    ) : (
                      <div className="major-view-row">
                        <div className="major-info">
                          {/* 칩 색상 미리보기 스와치 */}
                          <span className="major-color-swatch"
                            style={{ background: chipStyle.bg, border: `1px solid ${chipStyle.border}` }}
                            title={chipStyle.label}/>
                          <span className="major-name">{m.major}</span>
                          <span className="major-type-badge"
                            style={{ background: chipStyle.bg, color: chipStyle.color }}>
                            {chipStyle.label}
                          </span>
                        </div>
                        <div className="major-actions">
                          <button className="major-btn edit" onClick={() => {
                            setEditMajorId(m.user_major_id);
                            setMajorForm({ major: m.major, major_type: m.major_type, college: m.college || '' });
                          }}><FiEdit2 size={12}/></button>
                          <button className="major-btn delete" onClick={() => handleDeleteMajor(m.user_major_id)}><FiTrash2 size={12}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {showAddMajor ? (
              <div className="major-edit-row" style={{ marginTop: 8 }}>
                <input className="zol-input major-input"
                  value={majorForm.major}
                  onChange={e => setMajorForm(p => ({ ...p, major: e.target.value }))}
                  placeholder="예: 컴퓨터공학과" autoFocus/>
                <ColorSelect
                  value={majorForm.major_type}
                  onChange={v => setMajorForm(p => ({ ...p, major_type: v }))}/>
                <button className="major-btn confirm" onClick={handleAddMajor} disabled={majorLoading}><FiCheck size={13}/></button>
                <button className="major-btn cancel" onClick={() => { setShowAddMajor(false); setMajorForm({ major: '', major_type: 'green', college: '' }); }}><FiX size={13}/></button>
              </div>
            ) : (
              <button className="add-major-btn" onClick={() => { setShowAddMajor(true); setMajorForm({ major: '', major_type: 'green', college: '' }); }}>
                <FiPlus size={13}/> 다중전공 추가
              </button>
            )}
          </div>

          {/* ③ 졸업 목표 학점 */}
          <div className="settings-section">
            <div className="section-label">졸업 요건 목표 학점 설정</div>
            <p className="credits-desc">
              기본값: 총 130학점 · 교양 30학점 · 전공 60학점
              <span className="credits-desc-sub">기타 학점은 태그 설정에서 관리됩니다</span>
            </p>
            <div className="credits-grid">
              {[
                { key: 'total_credits',   label: '전체 총 목표', sub: '최소 이수 총학점' },
                { key: 'general_credits', label: '교양 이수',     sub: '교양 합계' },
                { key: 'major_credits',   label: '전공 필수/선택', sub: '전공 합계' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="credit-item">
                  <label className="credit-label">{label}</label>
                  <span className="credit-sub">{sub}</span>
                  <input className="zol-input credit-input" type="number" min="0"
                    value={credits[key]}
                    onChange={e => setCredits(p => ({ ...p, [key]: e.target.value }))}/>
                </div>
              ))}
            </div>

          </div>

          {/* ④ 로그아웃 */}
          <div className="settings-section">
            <button className="logout-btn" onClick={handleLogout}><FiLogOut size={15}/> 로그아웃</button>
          </div>

          {/* ⑤ 탈퇴 */}
          <div className="settings-section">
            <div className="danger-zone">
              <div className="danger-label"><FiAlertTriangle size={15}/> 회원 탈퇴</div>
              <p className="danger-text">탈퇴 시 모든 시뮬레이션 및 학적 정보가 영구 삭제됩니다.</p>
              <button className="danger-btn" onClick={async () => {
                if (window.confirm('정말 탈퇴하시겠어요? 복구할 수 없어요.')) {
                  try {
                    await deleteMyAccount();
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                  } catch (err) { alert('탈퇴 실패: ' + (err.response?.data?.detail || err.message)); }
                }
              }}>서비스 탈퇴하기</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>닫기</button>
          <button className="btn-save-credits" style={{ width: 'auto', padding: '8px 24px' }}
            onClick={handleSaveAll} disabled={creditsLoading}>
            {creditsSaved ? '✓ 저장됨' : creditsLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
