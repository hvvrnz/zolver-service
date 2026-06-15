import { useState, useEffect, useCallback,  useRef  } from 'react';
import {
  FiPlus, FiTrash2, FiEdit2, FiCheck, FiX,
  FiChevronDown, FiChevronUp, FiCalendar, FiBookOpen
} from 'react-icons/fi';
import {
  getSimulation, createPlan, deletePlan,
  createSimCourse, updateSimCourse, deleteSimCourse
} from '../../api/simulation';
import { getTags } from '../../api/tags';
import { getMyCourses, getVerifiedCourses } from '../../api/courses';
import { getMyInfo } from '../../api/user';
import './SimulationPage.css';

const SEM_OPTIONS = ['1학기', '2학기', '하계 계절학기', '동계 계절학기'];
const CAT_OPTIONS = [{ value: 'major', label: '전공' }, { value: 'general', label: '교양' }, { value: 'etc', label: '기타' }];
const CAT_LABEL   = { major: '전공', general: '교양', etc: '기타' };
const CAT_COLOR   = { major: 'var(--color-primary)', general: '#3b82f6', etc: '#c47c2b' };
const EMPTY_PLAN   = { year: new Date().getFullYear(), semester: '1학기', grade: 1, max_credits: 18 };
const EMPTY_COURSE = { system_category: 'major', tag_id: '', lecture_credit: 3, memo: '' };

// ── 커스텀 드롭다운 (fixed 포지션으로 잘림 방지)
function CustomSelect({ value, onChange, options, placeholder = '선택' }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 220) {
      setPanelStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, top: 'auto' });
    } else {
      setPanelStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left });
    }
  };

  // 스크롤할 때 위치 재계산
  useEffect(() => {
    if (!open) return;
    const onScroll = () => calcPos();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  const handleOpen = () => {
    calcPos();
    setOpen(o => !o);
  };

  return (
    <div className="sim-custom-select" tabIndex={0}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button ref={triggerRef} type="button" className="sim-cs-trigger" onClick={handleOpen}>
        <span className="sim-cs-label">{selected ? selected.label : <span className="sim-cs-placeholder">{placeholder}</span>}</span>
        <span className="sim-cs-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="sim-cs-backdrop" onMouseDown={() => setOpen(false)}/>
          <div className="sim-cs-panel" style={panelStyle}>
            {options.map(o => (
              <button key={o.value} type="button"
                className={`sim-cs-option${String(value) === String(o.value) ? ' selected' : ''}`}
                onMouseDown={e => { e.preventDefault(); onChange(o.value); setOpen(false); }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── 원형 진행률
function DonutChart({ earned, planned, goal, color, size = 80 }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r;
  const pctE = goal > 0 ? Math.min(earned / goal * 100, 100) : (earned > 0 ? 100 : 0);
  const pctP = goal > 0 ? Math.min(planned / goal * 100, 100 - pctE) : 0;
  const offE  = circ - pctE / 100 * circ;
  const offEP = circ - (pctE + pctP) / 100 * circ;
  const met   = goal > 0 && earned >= goal;
  const will  = goal > 0 && !met && earned + planned >= goal;
  const stroke = met ? '#22c55e' : color;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--zol-beige-200)" strokeWidth={7}/>
      {pctP > 0 && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#93c5fd" strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offEP} strokeLinecap="round"/>
      )}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={stroke} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offE} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
    </svg>
  );
}

// ── 가로 바
function SimBar({ earned, planned, goal, color }) {
  const pctE = goal > 0 ? Math.min(earned / goal * 100, 100) : 0;
  const pctP = goal > 0 ? Math.min(planned / goal * 100, 100 - pctE) : 0;
  if (goal <= 0) return null;
  return (
    <div className="sim-bar">
      <div className="sim-bar-earned" style={{ width: `${pctE}%`, background: earned >= goal ? '#22c55e' : color }}/>
      {pctP > 0 && <div className="sim-bar-planned" style={{ width: `${pctP}%`, left: `${pctE}%` }}/>}
    </div>
  );
}

// ── 상단 요약 카드
function SummaryCard({ label, cat, earned, planned, goal, color, status }) {
  const met   = status === 'met';
  const will  = status === 'will';
  const borderColor = met ? '#22c55e' : will ? '#93c5fd' : 'var(--color-border)';
  const pct = goal > 0 ? Math.min(Math.round(earned / goal * 100), 100) : null;
  return (
    <div className="sim-summary-card" style={{ borderColor }}>
      <div className="sim-summary-card-top">
        <span className={`sim-cat-chip ${cat}`}>{label}</span>
        <span className="sim-summary-status-icon">
          {met ? '✓' : will ? '◎' : goal > 0 ? '!' : ''}
        </span>
      </div>
      <div className="sim-summary-donut-wrap">
        <DonutChart earned={earned} planned={planned} goal={goal} color={color} size={76}/>
        <div className="sim-summary-donut-label" style={{ color: met ? '#22c55e' : color }}>
          {pct !== null ? `${pct}%` : `${earned}학점`}
        </div>
      </div>
      <div className="sim-summary-footer">
        <strong style={{ color: met ? '#22c55e' : color }}>{earned}</strong>
        {planned > 0 && <span className="sim-planned-txt"> +{planned}</span>}
        {goal > 0 && <span className="sim-summary-goal"> / {goal}학점</span>}
        {goal === 0 && <span className="sim-summary-goal"> 학점</span>}
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const [plans, setPlans]       = useState([]);
  const [tags, setTags]         = useState({ major: [], general: [], etc: [] });
  const [courses, setCourses]   = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showPlanForm, setShowPlanForm]             = useState(false);
  const [planForm, setPlanForm]                     = useState(EMPTY_PLAN);
  const [planLoading, setPlanLoading]               = useState(false);
  const [expandedPlan, setExpandedPlan]             = useState(null);
  const [showCourseForm, setShowCourseForm]         = useState(null);
  const [courseForm, setCourseForm]                 = useState(EMPTY_COURSE);
  const [courseLoading, setCourseLoading]           = useState(false);
  const [editId, setEditId]                         = useState(null);
  const [editForm, setEditForm]                     = useState(EMPTY_COURSE);
  const [collapsed, setCollapsed]                   = useState({ major: true, general: true, etc: true });
  const [collapsedGroups, setCollapsedGroups]       = useState({});
  const toggleGroup = (grp) => setCollapsedGroups(p => ({ ...p, [grp]: !p[grp] }));

  // 자동완성 (추가 폼)
  const [suggestions, setSuggestions]   = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const searchTimerRef                  = useRef(null);
  const searchInputRef                  = useRef(null);
  const [suggPanelStyle, setSuggPanelStyle] = useState({});

  // 자동완성 (수정 폼)
  const [editSuggestions, setEditSuggestions]   = useState([]);
  const [editSearchQuery, setEditSearchQuery]   = useState('');
  const editSearchTimerRef                      = useRef(null);
  const editSearchInputRef                      = useRef(null);
  const [editSuggPanelStyle, setEditSuggPanelStyle] = useState({});

  const calcSuggPos = (inputRef, setStyle) => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 220) {
      setStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 2, left: rect.left, width: rect.width, top: 'auto' });
    } else {
      setStyle({ position: 'fixed', top: rect.bottom + 2, left: rect.left, width: rect.width });
    }
  };

  const searchCourses = (query) => {
    setSearchQuery(query);
    setCourseForm(f => ({ ...f, memo: query }));
    clearTimeout(searchTimerRef.current);
    if (!query) { setSuggestions([]); return; }
    calcSuggPos(searchInputRef, setSuggPanelStyle);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await getVerifiedCourses(query);
        const seen = new Set();
        const deduped = (res.data.courses || []).filter(c => {
          const key = c.lecture_name + c.system_category;
          if (seen.has(key)) return false;
          seen.add(key); return true;
        });
        setSuggestions(deduped);
        calcSuggPos(searchInputRef, setSuggPanelStyle);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const selectSuggestion = (course) => {
    setCourseForm(f => ({ ...f, memo: course.lecture_name, system_category: course.system_category,
      lecture_category: course.lecture_category, lecture_credit: course.lecture_credit, tag_id: '' }));
    setSearchQuery(course.lecture_name);
    setSuggestions([]);
  };

  const searchEditCourses = (query) => {
    setEditSearchQuery(query);
    setEditForm(f => ({ ...f, memo: query }));
    clearTimeout(editSearchTimerRef.current);
    if (!query) { setEditSuggestions([]); return; }
    calcSuggPos(editSearchInputRef, setEditSuggPanelStyle);
    editSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await getVerifiedCourses(query);
        const seen = new Set();
        const deduped = (res.data.courses || []).filter(s => {
          const key = s.lecture_name + s.system_category;
          if (seen.has(key)) return false;
          seen.add(key); return true;
        });
        setEditSuggestions(deduped);
        calcSuggPos(editSearchInputRef, setEditSuggPanelStyle);
      } catch { setEditSuggestions([]); }
    }, 300);
  };

  const selectEditSuggestion = (course) => {
    setEditForm(f => ({ ...f, memo: course.lecture_name, system_category: course.system_category,
      lecture_credit: course.lecture_credit, tag_id: '' }));
    setEditSearchQuery(course.lecture_name);
    setEditSuggestions([]);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [simRes, tagRes, courseRes, userRes] = await Promise.all([
        getSimulation(), getTags(), getMyCourses(), getMyInfo(),
      ]);
      setPlans(simRes.data);
      setTags(tagRes.data);
      setCourses(courseRes.data.courses || []);
      setUserInfo(userRes.data?.user ?? userRes.data ?? null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const validCourses = courses.filter(c =>
    !['N', 'NP', 'F'].includes((c.course_grade || '').toUpperCase()) && !c.delete_type
  );

  const earnedByGroup = validCourses.reduce((acc, c) => {
    if (c.lecture_category) acc[c.lecture_category] = (acc[c.lecture_category] || 0) + (c.lecture_credit || 0);
    return acc;
  }, {});
  const earnedByName = validCourses.reduce((acc, c) => {
    if (c.area) acc[c.area] = (acc[c.area] || 0) + (c.lecture_credit || 0);
    return acc;
  }, {});
  const earnedByCat = validCourses.reduce((acc, c) => {
    acc[c.system_category] = (acc[c.system_category] || 0) + (c.lecture_credit || 0);
    return acc;
  }, {});

  const plannedByTagId = {};
  const plannedByCat   = {};
  plans.forEach(plan => {
    (plan.courses || []).filter(c => c.is_active).forEach(c => {
      if (c.tag_id)          plannedByTagId[c.tag_id] = (plannedByTagId[c.tag_id] || 0) + (c.lecture_credit || 0);
      if (c.system_category) plannedByCat[c.system_category] = (plannedByCat[c.system_category] || 0) + (c.lecture_credit || 0);
    });
  });

  const allTags = [...(tags.major || []), ...(tags.general || []), ...(tags.etc || [])];

  const getEarned = (tag) =>
    (tag.tag_name && tag.tag_name !== tag.tag_group)
      ? (earnedByName[tag.tag_name] || 0)
      : (earnedByGroup[tag.tag_group] || 0);

  const getCourseTagLabel = (c) => {
    const tag = allTags.find(t => t.tag_id === c.tag_id);
    if (!tag) return null;
    return (tag.tag_name && tag.tag_name !== tag.tag_group)
      ? `${tag.tag_group} · ${tag.tag_name}` : tag.tag_group;
  };

  // 카테고리별 goal
  const getCatGoal = (cat) => {
    if (cat === 'major')   return userInfo?.major_credits || 0;
    if (cat === 'general') return userInfo?.general_credits || 0;
    // 기타: 태그 min 합산
    return (tags.etc || []).reduce((s, t) => s + (t.min_credits || 0), 0);
  };

  const getCatStatus = (cat) => {
    const goal    = getCatGoal(cat);
    const earned  = earnedByCat[cat] || 0;
    const planned = plannedByCat[cat] || 0;
    if (goal <= 0) return 'none';
    if (earned >= goal) return 'met';
    if (earned + planned >= goal) return 'will';
    return 'unmet';
  };

  // 핸들러
  const handleCreatePlan = async () => {
    setPlanLoading(true);
    try { await createPlan(planForm); await fetchAll(); setShowPlanForm(false); setPlanForm(EMPTY_PLAN); }
    catch { alert('학기 추가 실패'); } finally { setPlanLoading(false); }
  };
  const handleDeletePlan = async (id) => {
    if (!window.confirm('학기 플랜을 삭제할까요?')) return;
    try { await deletePlan(id); await fetchAll(); } catch (err) { console.error(err); }
  };
  const handleCreateCourse = async (planId) => {
    setCourseLoading(true);
    try {
      await createSimCourse({ plan_id: planId, system_category: courseForm.system_category,
        tag_id: courseForm.tag_id && courseForm.tag_id !== '' ? Number(courseForm.tag_id) : null,
        lecture_credit: Number(courseForm.lecture_credit) || 3, memo: courseForm.memo || null });
      await fetchAll(); setShowCourseForm(null); setCourseForm(EMPTY_COURSE); setSearchQuery(''); setSuggestions([]);
    } catch (err) { console.error(err); } finally { setCourseLoading(false); }
  };
  const handleUpdateCourse = async (id) => {
    try {
      await updateSimCourse(id, { system_category: editForm.system_category,
        tag_id: editForm.tag_id && editForm.tag_id !== '' ? Number(editForm.tag_id) : null,
        lecture_credit: Number(editForm.lecture_credit) || 3, memo: editForm.memo || null, is_active: true });
      await fetchAll(); setEditId(null);
    } catch (err) { console.error(err); }
  };
  const handleToggle = async (c) => {
    setPlans(prev => prev.map(plan => ({
      ...plan,
      courses: (plan.courses || []).map(course =>
        course.sim_course_id === c.sim_course_id ? { ...course, is_active: !c.is_active } : course
      )
    })));
    try {
      await updateSimCourse(c.sim_course_id, { system_category: c.system_category,
        tag_id: c.tag_id || null, lecture_credit: c.lecture_credit, memo: c.memo || null, is_active: !c.is_active });
    } catch (err) {
      console.error(err);
      setPlans(prev => prev.map(plan => ({
        ...plan,
        courses: (plan.courses || []).map(course =>
          course.sim_course_id === c.sim_course_id ? { ...course, is_active: c.is_active } : course
        )
      })));
    }
  };
  const handleDeleteCourse = async (id) => {
    try { await deleteSimCourse(id); await fetchAll(); } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="sim-page"><div className="sim-loading"><div className="sim-spinner"/><p>불러오는 중...</p></div></div>
  );

  const totalEarned  = validCourses.reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const totalPlanned = Object.values(plannedByCat).reduce((s, v) => s + v, 0);
  const totalGoal    = userInfo?.total_credits || 130;

  return (
    <div className="sim-page">
      <div className="sim-header">
        <h1 className="sim-title">수강 시뮬레이션</h1>
        <p className="sim-subtitle">학기별 수강 계획을 세우고 이수 현황을 실시간으로 확인해요. <br/> 좌측에 그래프가 보이지 않는다면? → 태그관리에 가서 목표 학점을 설정해주세요.</p>
      </div>

      {/* ── 상단 요약 카드 (졸업 + 전공 + 교양 + 기타) */}
      {userInfo && (
        <div className="sim-summary-row">
          {/* 전체 졸업 */}
          <SummaryCard label="졸업" cat="major" earned={totalEarned} planned={totalPlanned}
            goal={totalGoal} color="var(--color-primary)"
            status={totalEarned >= totalGoal ? 'met' : totalEarned + totalPlanned >= totalGoal ? 'will' : 'unmet'}/>
          {['major','general','etc'].map(cat => (
            <SummaryCard key={cat} label={CAT_LABEL[cat]} cat={cat}
              earned={earnedByCat[cat]||0} planned={plannedByCat[cat]||0}
              goal={getCatGoal(cat)} color={CAT_COLOR[cat]}
              status={getCatStatus(cat)}/>
          ))}
        </div>
      )}

      {/* ── 2단 레이아웃 */}
      <div className="sim-layout">

        {/* ── 사이드바 */}
        <aside className="sim-sidebar">
          <div className="sim-sidebar-header"><FiBookOpen size={14}/><span>태그별 이수 현황</span></div>

          {allTags.length === 0 ? (
            <div className="sim-sidebar-empty"><p>태그 관리에서 태그를 먼저 설정해주세요</p></div>
          ) : (
            <div className="sim-cats">
              {['major','general','etc'].map(cat => {
                const catTags = tags[cat] || [];
                if (catTags.length === 0) return null;
                const color      = CAT_COLOR[cat];
                const catEarned  = earnedByCat[cat] || 0;
                const catPlanned = plannedByCat[cat] || 0;
                const catGoal    = getCatGoal(cat);
                const status     = getCatStatus(cat);
                const statusColor = status === 'met' ? '#22c55e' : status === 'will' ? '#3b82f6' : color;

                return (
                  <div key={cat} className="sim-cat-block">
                    <button className="sim-cat-header"
                      onClick={() => setCollapsed(p => ({ ...p, [cat]: !p[cat] }))}>
                      <div className="sim-cat-header-left">
                        <span className={`sim-cat-chip ${cat}`}>{CAT_LABEL[cat]}</span>
                        <div className="sim-cat-info">
                          <span className="sim-cat-credits">
                            <strong style={{ color: statusColor }}>{catEarned}</strong>
                            {catPlanned > 0 && <span className="sim-planned-txt"> +{catPlanned}예정</span>}
                            {catGoal > 0 && <span className="sim-cat-min"> / {catGoal}학점</span>}
                          </span>
                          {catGoal > 0 && <SimBar earned={catEarned} planned={catPlanned} goal={catGoal} color={statusColor}/>}
                        </div>
                      </div>
                      <div className="sim-cat-header-right">
                        <span className="sim-cat-status" style={{ color: statusColor }}>
                          {status === 'met' ? '✓' : status === 'will' ? '◎' : catGoal > 0 ? '!' : ''}
                        </span>
                        {collapsed[cat] ? <FiChevronDown size={13}/> : <FiChevronUp size={13}/>}
                      </div>
                    </button>

                    {!collapsed[cat] && (
                      <div className="sim-tag-list">
                        {cat === 'general' ? (() => {
                          const roots = catTags.filter(t => !t.tag_name || t.tag_name === t.tag_group);
                          const subs  = catTags.filter(t => t.tag_name && t.tag_name !== t.tag_group);
                          const allGroups = [...new Set(catTags.map(t => t.tag_group))];
                          return allGroups.map(grp => {
                            const rootTag   = roots.find(t => t.tag_group === grp);
                            const subTags   = subs.filter(t => t.tag_group === grp);
                            const grpEarned = earnedByGroup[grp] || 0;
                            const grpPlanned= subTags.reduce((s,t)=>s+(plannedByTagId[t.tag_id]||0),0)
                                            + (rootTag ? (plannedByTagId[rootTag.tag_id]||0) : 0);
                            const grpMin    = rootTag?.min_credits || 0;
                            const grpMet    = grpMin > 0 && grpEarned >= grpMin;
                            const grpWill   = grpMin > 0 && !grpMet && grpEarned + grpPlanned >= grpMin;
                            const grpStatus = grpMet ? 'met' : grpWill ? 'will' : grpMin > 0 ? 'unmet' : 'none';
                            const grpSColor = grpStatus==='met'?'#22c55e':grpStatus==='will'?'#3b82f6':color;
                            const isGrpCollapsed = collapsedGroups[grp] ?? (subTags.length > 3);
                            return (
                              <div key={grp} className="sim-tag-group-block">
                                <button className="sim-tag-group-header"
                                  onClick={() => subTags.length > 0 && toggleGroup(grp)}>
                                  <div className="sim-cat-header-left">
                                    <span className="sim-cat-chip general" style={{fontSize:11}}>{grp}</span>
                                    <div className="sim-cat-info">
                                      <span className="sim-cat-credits">
                                        <strong style={{color:grpSColor}}>{grpEarned}</strong>
                                        {grpPlanned > 0 && <span className="sim-planned-txt"> +{grpPlanned}예정</span>}
                                        {grpMin > 0 ? <span className="sim-cat-min"> / {grpMin}학점</span>
                                                    : <span className="sim-tag-noreq-val"> 학점 이수</span>}
                                      </span>
                                      {grpMin > 0 && <SimBar earned={grpEarned} planned={grpPlanned} goal={grpMin} color={grpSColor}/>}
                                    </div>
                                  </div>
                                  <div className="sim-cat-header-right">
                                    {grpMin > 0 && <span className="sim-cat-status" style={{color:grpSColor}}>{grpStatus==='met'?'✓':grpStatus==='will'?'◎':'!'}</span>}
                                    {subTags.length > 0 && (isGrpCollapsed ? <FiChevronDown size={13}/> : <FiChevronUp size={13}/>)}
                                  </div>
                                </button>
                                {!isGrpCollapsed && subTags.map(tag => {
                                  const e = getEarned(tag), p = plannedByTagId[tag.tag_id]||0, m = tag.min_credits||0;
                                  const s = m>0&&e>=m?'met':m>0&&e+p>=m?'will':m>0?'unmet':'none';
                                  const sc = s==='met'?'#22c55e':s==='will'?'#3b82f6':'#7c6fb0';
                                  return (
                                    <div key={tag.tag_id} className="sim-tag-group-header sim-tag-sub-row">
                                      <div className="sim-cat-header-left">
                                        <span className="sim-tag-indent">└</span>
                                        <span className="sim-cat-chip sub" style={{fontSize:11}}>{tag.tag_name}</span>
                                        <div className="sim-cat-info">
                                          <span className="sim-cat-credits">
                                            {m === 0 ? <span className="sim-tag-noreq-val">{e}학점 이수</span> : (
                                              <><strong style={{color:sc}}>{e}</strong>
                                              {p>0&&<span className="sim-planned-txt"> +{p}예정</span>}
                                              <span className="sim-cat-min"> / {m}학점</span></>
                                            )}
                                          </span>
                                          {m > 0 && <SimBar earned={e} planned={p} goal={m} color={sc}/>}
                                        </div>
                                      </div>
                                      <div className="sim-cat-header-right">
                                        {m > 0 && <span className="sim-cat-status" style={{color:sc}}>{s==='met'?'✓':s==='will'?'◎':'!'}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          });
                        })() : catTags.map(tag => {
                          const e = getEarned(tag), p = plannedByTagId[tag.tag_id]||0, m = tag.min_credits||0;
                          const s = m>0&&e>=m?'met':m>0&&e+p>=m?'will':m>0?'unmet':'none';
                          const sc = s==='met'?'#22c55e':s==='will'?'#3b82f6':color;
                          return (
                            <div key={tag.tag_id} className="sim-tag-row sim-tag-root">
                              <div className="sim-tag-row-top">
                                <div className="sim-tag-label-row">
                                  {m > 0 && <span className="sim-tag-status-icon" style={{color:sc}}>{s==='met'?'✓':s==='will'?'◎':'!'}</span>}
                                  <span className={`sim-cat-chip sm ${cat}`}>{tag.tag_group}</span>
                                </div>
                                <span className="sim-tag-credits">
                                  {m === 0 ? <span className="sim-tag-noreq-val">{e}학점 이수</span> : (
                                    <><strong style={{color:sc}}>{e}</strong>
                                    {p>0&&<span className="sim-planned-txt"> +{p}</span>}
                                    <span className="sim-tag-min"> / {m}학점</span></>
                                  )}
                                </span>
                              </div>
                              {m > 0 && <SimBar earned={e} planned={p} goal={m} color={sc}/>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── 우측: 학기 플랜 */}
        <main className="sim-main">
          <div className="sim-plan-add-row">
            {!showPlanForm ? (
              <button className="btn-add-plan" onClick={() => setShowPlanForm(true)}>
                <FiCalendar size={14}/> 학기 추가
              </button>
            ) : (
              <div className="sim-plan-form">
                <div className="sim-plan-form-grid">
                  <div className="form-group"><label>년도</label>
                    <input className="zol-input" type="number" min="2000" value={planForm.year}
                      onChange={e => setPlanForm({...planForm, year: Number(e.target.value)})}/>
                  </div>
                  <div className="form-group"><label>학기</label>
                    <select className="zol-input" value={planForm.semester}
                      onChange={e => setPlanForm({...planForm, semester: e.target.value})}>
                      {SEM_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>학년</label>
                    <select className="zol-input" value={planForm.grade}
                      onChange={e => setPlanForm({...planForm, grade: Number(e.target.value)})}>
                      {[1,2,3,4,5].map(g => <option key={g} value={g}>{g}학년</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>최대 학점</label>
                    <input className="zol-input" type="number" min="1" max="24" value={planForm.max_credits}
                      onChange={e => setPlanForm({...planForm, max_credits: Number(e.target.value)})}/>
                  </div>
                </div>
                <div className="sim-plan-form-actions">
                  <button className="btn-cancel" onClick={() => { setShowPlanForm(false); setPlanForm(EMPTY_PLAN); }}>취소</button>
                  <button className="btn-save" onClick={handleCreatePlan} disabled={planLoading}>
                    {planLoading ? '저장 중...' : '학기 추가'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {plans.length === 0 ? (
            <div className="sim-empty"><FiCalendar size={32}/><p>학기를 추가해서 수강 계획을 세워보세요!</p></div>
          ) : (
            <div className="sim-plans">
              {plans.map(plan => {
                const isExpanded  = expandedPlan === plan.plan_id;
                const planCourses = plan.courses || [];
                const active      = planCourses.filter(c => c.is_active);
                const total       = active.reduce((s, c) => s + (c.lecture_credit || 0), 0);
                const pct         = plan.max_credits > 0 ? Math.min(total / plan.max_credits * 100, 100) : 0;
                const isFull      = total >= plan.max_credits;
                const r = 17, circ = 2 * Math.PI * r;
                const off = circ - pct / 100 * circ;

                return (
                  <div key={plan.plan_id} className={`sim-plan-card ${isExpanded ? 'expanded' : ''}`}>
                    <div className="sim-plan-header">
                      <button className="sim-plan-header-left"
                        onClick={() => setExpandedPlan(isExpanded ? null : plan.plan_id)}>
                        <div className="sim-plan-header-info">
                          <div className="sim-plan-circle-wrap">
                            <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx={22} cy={22} r={r} fill="none" stroke="var(--zol-beige-200)" strokeWidth={4}/>
                              <circle cx={22} cy={22} r={r} fill="none"
                                stroke={isFull ? '#22c55e' : 'var(--color-primary)'} strokeWidth={4}
                                strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.5s ease' }}/>
                            </svg>
                            <span className="sim-plan-pct">{Math.round(pct)}%</span>
                          </div>
                          <div>
                            <p className="sim-plan-title">{plan.year}년 {plan.semester}</p>
                            <p className="sim-plan-sub">
                              {plan.grade}학년 ·{' '}
                              <strong style={{ color: isFull ? '#22c55e' : 'var(--color-primary)' }}>{total}</strong>
                              {' '}/ {plan.max_credits}학점
                              {isFull
                                ? <span className="sim-full-badge"> 꽉참!</span>
                                : <span style={{ color: 'var(--color-text-disabled)', fontSize: 11 }}> ({plan.max_credits - total}학점 여유)</span>}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                      </button>
                      <button className="btn-icon-danger" onClick={() => handleDeletePlan(plan.plan_id)}>
                        <FiTrash2 size={13}/>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="sim-plan-body">
                        {planCourses.length > 0 && (
                          <div className="sim-course-list">
                            {planCourses.map(c => {
                              const tagLabel = getCourseTagLabel(c);
                              return (
                                <div key={c.sim_course_id} className={`sim-course-item ${!c.is_active ? 'inactive' : ''}`}>
                                  {editId === c.sim_course_id ? (
                                    <div className="sim-course-edit-row">
                                      <CustomSelect
                                        value={editForm.system_category}
                                        onChange={v => setEditForm({...editForm, system_category: v, tag_id: ''})}
                                        options={CAT_OPTIONS}/>
                                      <CustomSelect
                                        value={editForm.tag_id}
                                        onChange={v => setEditForm({...editForm, tag_id: v})}
                                        placeholder="태그 없음"
                                        options={[
                                          { value: '', label: '태그 없음' },
                                          ...(tags[editForm.system_category]||[]).map(t => ({
                                            value: String(t.tag_id),
                                            label: t.tag_name && t.tag_name !== t.tag_group
                                              ? `${t.tag_group} · ${t.tag_name}` : t.tag_group
                                          }))
                                        ]}/>
                                      <input className="zol-input sim-input-credit" type="number" min="1"
                                        value={editForm.lecture_credit}
                                        onChange={e => setEditForm({...editForm, lecture_credit: e.target.value})}/>
                                      <div style={{ position: 'relative', flex: 1 }}>
                                        <input
                                          ref={editSearchInputRef}
                                          className="zol-input sim-input-memo"
                                          placeholder="과목명 검색 또는 직접 입력"
                                          value={editSearchQuery}
                                          onChange={e => searchEditCourses(e.target.value)}
                                          onKeyDown={e => e.key === 'Enter' && handleUpdateCourse(c.sim_course_id)}
                                        />
                                        {editSuggestions.length > 0 && (
                                          <div style={{
                                            ...editSuggPanelStyle,
                                            background: '#fff',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 8, zIndex: 99999,
                                            maxHeight: 200, overflowY: 'auto',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
                                          }}>
                                            {editSuggestions.slice(0, 8).map(s => (
                                              <div key={s.std_lecture_id}
                                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--zol-beige-50)'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}
                                                onMouseDown={() => selectEditSuggestion(s)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                                  <span className={`sim-cat-chip sm ${s.system_category}`}>{CAT_LABEL[s.system_category]}</span>
                                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.lecture_name}</span>
                                                </div>
                                                <span style={{ color: 'var(--color-text-disabled)', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>{s.lecture_credit}학점</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <button className="btn-icon-confirm" onClick={() => handleUpdateCourse(c.sim_course_id)}><FiCheck size={13}/></button>
                                      <button className="btn-icon-cancel" onClick={() => { setEditId(null); setEditSuggestions([]); setEditSearchQuery(''); }}><FiX size={13}/></button>
                                    </div>
                                  ) : (
                                    <div className="sim-course-view-row">
                                      <div className="sim-course-left">
                                        {c.memo && <span className="sim-course-name">{c.memo}</span>}
                                        <div className="sim-course-meta">
                                          <span className={`sim-cat-chip sm ${c.system_category}`}>{CAT_LABEL[c.system_category]}</span>
                                          {tagLabel && <span className="sim-course-tag">{tagLabel}</span>}
                                          <span className="sim-course-credit">{c.lecture_credit}학점</span>
                                        </div>
                                      </div>
                                      <div className="sim-course-actions">
                                        <button className={`btn-toggle ${c.is_active ? 'active' : 'inactive'}`}
                                          onClick={() => handleToggle(c)}>
                                          {c.is_active ? '활성' : '비활성'}
                                        </button>
                                        <button className="btn-icon-sm" onClick={() => {
                                          setEditId(c.sim_course_id);
                                          setEditForm({ system_category: c.system_category, tag_id: c.tag_id||'', lecture_credit: c.lecture_credit, memo: c.memo||'' });
                                          setEditSearchQuery(c.memo || '');
                                          setEditSuggestions([]);
                                        }}><FiEdit2 size={12}/></button>
                                        <button className="btn-icon-sm danger" onClick={() => handleDeleteCourse(c.sim_course_id)}>
                                          <FiTrash2 size={12}/>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {showCourseForm === plan.plan_id ? (
                          <div className="sim-course-add-form">
                            <CustomSelect
                              value={courseForm.system_category}
                              onChange={v => setCourseForm({...courseForm, system_category: v, tag_id: ''})}
                              options={CAT_OPTIONS}/>
                            <CustomSelect
                              value={courseForm.tag_id}
                              onChange={v => setCourseForm({...courseForm, tag_id: v})}
                              placeholder="태그 없음"
                              options={[
                                { value: '', label: '태그 없음' },
                                ...(tags[courseForm.system_category]||[]).map(t => ({
                                  value: String(t.tag_id),
                                  label: t.tag_name && t.tag_name !== t.tag_group
                                    ? `${t.tag_group} · ${t.tag_name}` : t.tag_group
                                }))
                              ]}/>
                            <input className="zol-input sim-input-credit" type="number" min="1" placeholder="학점"
                              value={courseForm.lecture_credit}
                              onChange={e => setCourseForm({...courseForm, lecture_credit: e.target.value})}/>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                ref={searchInputRef}
                                className="zol-input sim-input-memo"
                                placeholder="과목명 검색 또는 직접 입력"
                                value={searchQuery}
                                onChange={e => searchCourses(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateCourse(plan.plan_id)}
                              />
                              {suggestions.length > 0 && (
                                <div style={{
                                  ...suggPanelStyle,
                                  background: '#fff',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 8, zIndex: 99999,
                                  maxHeight: 200, overflowY: 'auto',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
                                }}>
                                  {suggestions.slice(0, 8).map(c => (
                                    <div key={c.std_lecture_id}
                                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                      onMouseEnter={e => e.currentTarget.style.background = 'var(--zol-beige-50)'}
                                      onMouseLeave={e => e.currentTarget.style.background = ''}
                                      onMouseDown={() => selectSuggestion(c)}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                        <span className={`sim-cat-chip sm ${c.system_category}`}>{CAT_LABEL[c.system_category]}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lecture_name}</span>
                                      </div>
                                      <span style={{ color: 'var(--color-text-disabled)', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>{c.lecture_credit}학점</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button className="btn-icon-confirm" onClick={() => handleCreateCourse(plan.plan_id)} disabled={courseLoading}>
                              <FiCheck size={13}/>
                            </button>
                            <button className="btn-icon-cancel" onClick={() => {
                              setShowCourseForm(null);
                              setCourseForm(EMPTY_COURSE);
                              setSearchQuery('');
                              setSuggestions([]);
                            }}>
                              <FiX size={13}/>
                            </button>
                          </div>
                        ) : (
                          <button className="btn-add-course"
                            onClick={() => { setShowCourseForm(plan.plan_id); setCourseForm(EMPTY_COURSE); }}>
                            <FiPlus size={13}/> 과목 추가
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
