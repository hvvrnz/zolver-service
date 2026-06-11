import { useState, useEffect, useCallback } from 'react';
import { FiSettings, FiPlus, FiX, FiCalendar, FiBell, FiFileText, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { FaUserGraduate } from 'react-icons/fa';
import { getMyInfo } from '../../api/user';
import { getMyMajors } from '../../api/majors';
import { getMyCourses } from '../../api/courses';
import { getSimulation } from '../../api/simulation';
import { getCurriculum, saveCurriculum, getNotices } from '../../api/curriculum';
import { getTags } from '../../api/tags';
import SettingsModal from './SettingsModal';
import './HomePage.css';

const INVALID_GRADES = ['F', 'N', 'NP'];
const isInvalid = c => INVALID_GRADES.includes((c.course_grade || '').toUpperCase()) || !!c.delete_type;

// color key → CSS 클래스
const MAJOR_CHIP = {
  'green':    'chip-major-green',
  'mint':     'chip-major-mint',
  'pink':     'chip-major-pink',
  'lavender': 'chip-major-lavender',
  'mustard':  'chip-major-mustard',
};

// 성적표 자동 파싱값 → color key fallback
const AUTO_COLOR_MAP = {
  '주전공':   'green',
  '복수전공': 'mint',
  '다전공':   'mint',
  '부전공':   'pink',
  '연계전공': 'lavender',
  '기타':     'mustard',
};
const resolveChipClass = (majorType) => {
  // color key면 그대로, 아니면 fallback 매핑
  if (MAJOR_CHIP[majorType]) return MAJOR_CHIP[majorType];
  const mapped = AUTO_COLOR_MAP[majorType];
  return MAJOR_CHIP[mapped] || 'chip-major-green';
};

function CircleProgress({ pct, size = 110 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const done = pct >= 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede8df" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={done ? '#7aaa5a' : 'var(--color-primary)'}
        strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}/>
    </svg>
  );
}

function BarProgress({ pct, color }) {
  return (
    <div className="home-bar-track">
      <div className="home-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }}/>
    </div>
  );
}

export default function HomePage() {
  const [userInfo, setUserInfo]             = useState(null);
  const [majors, setMajors]                 = useState([]);
  const [courses, setCourses]               = useState([]);
  const [simPlans, setSimPlans]             = useState([]);
  const [etcTags, setEtcTags]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [settingsOpen, setSettingsOpen]     = useState(false);
  const [curriculum, setCurriculum]         = useState([]);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [curriculumForm, setCurriculumForm] = useState({ title: '' });
  const [notices, setNotices]               = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, majorRes, courseRes, simRes, currRes, noticeRes, tagRes] = await Promise.all([
        getMyInfo(),
        getMyMajors(),
        getMyCourses(),
        getSimulation(),
        getCurriculum().catch(() => ({ data: null })),
        getNotices().catch(() => ({ data: null })),
        getTags().catch(() => ({ data: null })),
      ]);

      const ud = userRes.data?.user ?? userRes.data ?? null;
      setUserInfo(ud);
      setMajors(majorRes.data?.majors ?? (Array.isArray(majorRes.data) ? majorRes.data : []));
      setCourses(courseRes.data?.courses ?? courseRes.data?.items ?? (Array.isArray(courseRes.data) ? courseRes.data : []));
      setSimPlans(Array.isArray(simRes.data) ? simRes.data : (simRes.data?.plans ?? []));

      const ci = currRes.data?.content?.items ?? currRes.data?.items ?? [];
      setCurriculum(Array.isArray(ci) ? ci : []);
      setNotices(noticeRes.data?.notices ?? (Array.isArray(noticeRes.data) ? noticeRes.data : []));

      const et = tagRes?.data?.etc
        ?? tagRes?.data?.tags?.filter(t => t.system_category === 'etc')
        ?? (Array.isArray(tagRes?.data) ? tagRes.data.filter(t => t.system_category === 'etc') : []);
      setEtcTags(et);
    } catch (err) {
      console.error('[fetchAll]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 학점 계산
  const valid        = courses.filter(c => !isInvalid(c));
  const totalEarned  = valid.reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const majorEarned  = valid.filter(c => c.system_category === 'major').reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const genEarned    = valid.filter(c => c.system_category === 'general').reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const etcEarned    = valid.filter(c => c.system_category === 'etc').reduce((s, c) => s + (c.lecture_credit || 0), 0);

  const totalReq   = userInfo?.total_credits   || 130;
  const majorReq   = userInfo?.major_credits   || 60;
  const genReq     = userInfo?.general_credits || 30;
  const etcReq     = etcTags.reduce((s, t) => s + (t.min_credits || 0), 0);
  const overallPct = totalReq > 0 ? Math.min(Math.round((totalEarned / totalReq) * 100), 100) : 0;

  const admYear  = userInfo?.admission_year;
  const admLabel = admYear ? `${String(admYear)}학번` : '';
  // college: users.college 컬럼 (users_router.py 에서 명시적 SELECT)
  const college  = userInfo?.college || '';

  const primaryMajor = majors.find(m => m.major_type === '주전공');
  const subMajors    = majors.filter(m => m.major_type !== '주전공');

  const simMemos = simPlans
    .map(p => ({ label: `${p.year}년 ${p.semester}`, memos: (p.courses||[]).filter(c=>c.is_active!==false&&c.memo).map(c=>c.memo) }))
    .filter(p => p.memos.length > 0);

  const saveCurrItem = async () => {
    if (!curriculumForm.title.trim()) return;
    const updated = [...curriculum, { id: Date.now(), title: curriculumForm.title.trim(), checked: false, createdAt: new Date().toLocaleDateString('ko-KR') }];
    try {
      await saveCurriculum({ items: updated });
      setCurriculum(updated);
      setCurriculumForm({ title: '' });
      setCurriculumOpen(false);
    } catch (err) { alert('저장 실패: ' + (err.response?.data?.detail || err.message)); }
  };

  const toggleCheck = async (id) => {
    const updated = curriculum.map(c => c.id === id ? { ...c, checked: !c.checked } : c);
    setCurriculum(updated);
    try { await saveCurriculum({ items: updated }); } catch {}
  };

  const deleteItem = async (id) => {
    if (!window.confirm('삭제할까요?')) return;
    const updated = curriculum.filter(c => c.id !== id);
    try { await saveCurriculum({ items: updated }); setCurriculum(updated); }
    catch (err) { alert('삭제 실패: ' + (err.response?.data?.detail || err.message)); }
  };

  const getNoticeTitle   = c => (!c ? '' : typeof c === 'string' ? c : c.title || c.text || '(제목 없음)');
  const getNoticeContent = c => (!c ? '' : typeof c === 'string' ? c : c.content || c.body || c.text || '');

  if (loading) return (
    <div className="home-page"><div className="home-loading"><div className="home-spinner"/>
      <p style={{color:'var(--color-text-muted)',fontSize:'14px'}}>학적 정보를 불러오는 중입니다...</p>
    </div></div>
  );

  const checkedCount = curriculum.filter(c => c.checked).length;
  const sortedCurr   = [...curriculum].sort((a,b)=>(a.checked?1:0)-(b.checked?1:0));

  // 기타: 목표학점 설정 태그 하나라도 있으면 그래프, 없으면 취득학점만
  const etcHasReq = etcTags.some(t => (t.min_credits || 0) > 0);

  const PROGRESS = [
    { label:'전공 학점', earned:majorEarned, req:majorReq, color:'var(--color-primary)', bg:'#f3f6ee' },
    { label:'교양 학점', earned:genEarned,   req:genReq,   color:'#4a7fb5',             bg:'#edf4fc' },
    { label:'기타 학점', earned:etcEarned,   req:etcReq,   color:'#c47c2b',             bg:'#fdf4e7', noReq: !etcHasReq },
  ];

  return (
    <div className="home-page">
      <div className="home-container">

        {/* ── 히어로 */}
        <div className="home-hero">
          <div className="home-hero-profile">
            <div className="home-avatar"><FaUserGraduate size={24}/></div>
            <div className="home-profile-text">

              {/* 1행: 뱃지들 */}
              <div className="home-badge-row">
                {college  && <span className="home-chip chip-college">{college}</span>}
                {admLabel && <span className="home-chip chip-adm">{admLabel}</span>}
                {primaryMajor && (
                  <span className={`home-chip ${resolveChipClass(primaryMajor.major_type)}`}>
                    {primaryMajor.major}
                  </span>
                )}
                {subMajors.map(m => (
                  <span key={m.user_major_id} className={`home-chip ${resolveChipClass(m.major_type)}`}>
                    {m.major}
                  </span>
                ))}
              </div>

              {/* 2행: 이름 */}
              <h1 className="home-user-name">
                {userInfo?.name || userInfo?.nickname || '사용자'} 님
              </h1>

              {/* 3행: 이수율 */}
              <p className="home-user-sub">
                졸업 시뮬레이션 기반 전체 이수율: <strong className="home-pct-text">{overallPct}%</strong>
              </p>
            </div>
          </div>

          <div className="home-circle-wrap">
            <CircleProgress pct={overallPct} size={110}/>
            <div className="home-circle-label">
              <strong>{overallPct}%</strong><span>달성률</span>
            </div>
          </div>

          <div className="home-stats">
            <div className="home-stat">
              <span className="home-stat-label">현재 취득학점</span>
              <strong className="home-stat-val primary">{totalEarned}<em>학점</em></strong>
            </div>
            <div className="home-stat-div"/>
            <div className="home-stat">
              <span className="home-stat-label">졸업 목표학점</span>
              <strong className="home-stat-val">{totalReq}<em>학점</em></strong>
            </div>
            <div className="home-stat-div"/>
            <div className="home-stat">
              <span className="home-stat-label">남은 학점</span>
              <strong className="home-stat-val" style={{color: totalReq-totalEarned>0?'#c0392b':'var(--color-primary)'}}>
                {Math.max(0,totalReq-totalEarned)}<em>학점</em>
              </strong>
            </div>
          </div>

          <button className="home-settings-btn" onClick={()=>setSettingsOpen(true)}><FiSettings size={19}/></button>
        </div>

        {/* ── 프로그레스 3컬럼 */}
        <div className="home-progress-row">
          {PROGRESS.map(({ label, earned, req, color, bg, noReq }) => {
            const pct = req > 0 ? Math.min(Math.round((earned/req)*100),100) : 0;
            return (
              <div key={label} className="home-progress-card" style={{ background: bg }}>
                <div className="home-progress-card-top">
                  <span className="home-progress-label" style={{ color }}>{label}</span>
                  <span className="home-progress-pct" style={{ color }}>{noReq ? '—' : `${pct}%`}</span>
                </div>
                <div className="home-progress-nums">
                  <strong style={{ color }}>{earned}</strong>
                  {noReq
                    ? <span className="home-progress-noreq">학점 취득</span>
                    : <span> / {req} 학점</span>}
                </div>
                {!noReq && <BarProgress pct={pct} color={color}/>}
                <p className="home-progress-rest">
                  {noReq ? '목표학점이 1학점 이상 설정되어야 달성률과 그래프가 표시돼요.\n태그관리에서 설정할 수 있어요.' : `졸업 요건까지 남은 학점: ${Math.max(0,req-earned)}학점`}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── 메인 그리드 */}
        <div className="home-grid">

          <div className="home-card">
            <div className="home-card-header">
              <div className="home-card-title"><FiCalendar size={15} color="var(--color-primary)"/><span>수강 예정 과목 (학기별 계획 시뮬레이션)</span></div>
              <span className="home-card-meta">총 {simPlans.length}개 학기 수립됨</span>
            </div>
            {simMemos.length === 0
              ? <div className="home-card-empty"><p>수강 시뮬레이션 메뉴에서 학기별 과목을 계획해보세요.</p></div>
              : <div className="home-sim-list">{simMemos.map((p,i)=>(
                  <div key={i} className="home-sim-item">
                    <div className="home-sim-label">{p.label}</div>
                    <div className="home-sim-memos">{p.memos.map((m,j)=><span key={j} className="home-sim-memo-chip">{m}</span>)}</div>
                  </div>
                ))}</div>
            }
          </div>

          <div className="home-card">
            <div className="home-card-header">
              <div className="home-card-title"><FiFileText size={15} color="#c47c2b"/><span>나의 졸업요건 메모</span></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {curriculum.length > 0 && <span className="home-card-meta">{checkedCount}/{curriculum.length}</span>}
                <button className="home-card-add-btn" onClick={()=>setCurriculumOpen(true)}><FiPlus size={13}/> 추가하기</button>
              </div>
            </div>
            {curriculum.length === 0
              ? <div className="home-card-empty"><p>토익, 졸업논문 등 졸업 요건 항목을<br/>체크리스트로 관리해보세요.</p></div>
              : <div className="home-checklist">
                  {sortedCurr.map(item=>(
                    <div key={item.id} className={`home-check-item${item.checked?' checked':''}`} onClick={()=>toggleCheck(item.id)}>
                      <span className="home-check-icon">{item.checked?<FiCheckSquare size={15} color="var(--color-primary)"/>:<FiSquare size={15} color="var(--color-text-disabled)"/>}</span>
                      <span className="home-check-title">{item.title}</span>
                      <button className="home-check-del" onClick={e=>{e.stopPropagation();deleteItem(item.id);}}><FiX size={11}/></button>
                    </div>
                  ))}
                </div>
            }
          </div>

          <div className="home-card home-card-full">
            <div className="home-card-header">
              <div className="home-card-title"><FiBell size={15} color="#b05c5c"/><span>공지사항</span></div>
            </div>
            {notices.length === 0
              ? <div className="home-card-empty"><p>등록된 공지사항이 없습니다.</p></div>
              : <div className="home-notice-list">{notices.map(n => {const displayDate = n.updated_at ? new Date(n.updated_at) : new Date(n.created_at);
                return (
                <div key={n.notice_id} className="home-notice-item" onClick={() => setSelectedNotice(n)}>
                  <p className="home-notice-content">{getNoticeTitle(n.content)}</p>
                  <span className="home-notice-date">
                    {n.updated_at ? '수정 ' : ''}{displayDate.toLocaleDateString('ko-KR')}
                  </span>
                </div>
              );
            })}</div>
            }
          </div>
        </div>
      </div>

      {/* 공지 상세 모달 */}
      {selectedNotice && (
        <div className="home-modal-backdrop" onClick={()=>setSelectedNotice(null)}>
          <div className="home-modal" onClick={e=>e.stopPropagation()}>
            <div className="home-modal-header">
              <h3>{getNoticeTitle(selectedNotice.content)}</h3>
              <button onClick={()=>setSelectedNotice(null)}><FiX size={16}/></button>
            </div>
            <div className="home-modal-body">
              <div className="home-modal-field">
                <label>내용</label>
                <p style={{fontSize:'14px',color:'#374151',whiteSpace:'pre-line',lineHeight:'1.75',background:'#f9fafb',padding:'16px',borderRadius:'8px',border:'1px solid #e5e7eb',minHeight:'80px'}}>
                  {getNoticeContent(selectedNotice.content)}
                </p>
              </div>
              <div className="home-modal-field">
            <label>게시일</label>
            <p style={{fontSize:'12px',color:'#9ca3af'}}>
              {selectedNotice.created_at ? new Date(selectedNotice.created_at).toLocaleString('ko-KR') : '-'}
            </p>
          </div>
            </div>
            <div className="home-modal-footer"><button className="btn-cancel" onClick={()=>setSelectedNotice(null)}>닫기</button></div>
          </div>
        </div>
      )}

      {/* 체크리스트 추가 모달 */}
      {curriculumOpen && (
        <div className="home-modal-backdrop" onClick={()=>setCurriculumOpen(false)}>
          <div className="home-modal home-modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="home-modal-header"><h3>항목 추가</h3><button onClick={()=>setCurriculumOpen(false)}><FiX size={16}/></button></div>
            <div className="home-modal-body">
              <div className="home-modal-field">
                <label>내용 *</label>
                <input className="zol-input" placeholder="예: 졸업논문 제출, 졸업작품 유형 확인, 토익 800점 이상..."
                  value={curriculumForm.title}
                  onChange={e=>setCurriculumForm({title:e.target.value})}
                  onKeyDown={e=>e.key==='Enter'&&saveCurrItem()} autoFocus/>
              </div>
            </div>
            <div className="home-modal-footer">
              <button className="btn-cancel" onClick={()=>setCurriculumOpen(false)}>취소</button>
              <button className="btn-save" onClick={saveCurrItem}>추가</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={()=>setSettingsOpen(false)} userInfo={userInfo} majors={majors} onSaved={fetchAll}/>
    </div>
  );
}
