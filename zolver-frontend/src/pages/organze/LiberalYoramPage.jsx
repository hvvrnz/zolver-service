import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiBookOpen, FiEdit2 } from 'react-icons/fi';
import { getMyCourses, updateCourse } from '../../api/courses';
import { getTags } from '../../api/tags';
import { getMyInfo } from '../../api/user';
import { EMPTY_FORM, FORCE_INVALID } from '../../utils/constants';
import EditCourseModal from '../../components/modals/EditCourseModal';
import './LiberalYoramPage.css';

const INVALID_GRADES = ['F', 'N', 'NP'];
const isInvalid = c => INVALID_GRADES.includes((c.course_grade||'').toUpperCase()) || !!c.delete_type;

function CircleProgress({ pct, size = 96, stroke = '#3b82f6' }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const done = pct >= 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--zol-beige-200)" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={done ? '#22c55e' : stroke} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }}/>
    </svg>
  );
}

function BarProgress({ completed, required, stroke = '#3b82f6' }) {
  const pct = required > 0
    ? Math.min((completed / required) * 100, 100)
    : completed > 0 ? 100 : 0;
  const done = required > 0 && pct >= 100;
  const noReq = required === 0;
  return (
    <div className="bar-wrap">
      <div className="bar-track">
        <div className="bar-fill" style={{ width:`${pct}%`, background: done ? '#22c55e' : noReq ? `${stroke}88` : stroke }}/>
      </div>
      <span className="bar-label" style={{ color: done ? '#22c55e' : stroke }}>
        {done ? '충족!' : noReq ? `${completed}학점` : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

// 소분류 미니 그래프 바 (가로 배치)
function SubBar({ label, completed, required, stroke = '#5b21b6' }) {
  const pct = required > 0 ? Math.min((completed / required) * 100, 100) : completed > 0 ? 100 : 0;
  const done = required > 0 && pct >= 100;
  return (
    <div className="yoram-sub-bar-row">
      {/* 라벤더 소분류 칩 */}
      <span className="yoram-sub-bar-label liberal-chip-sub">{label}</span>
      {/* 미니 바 */}
      <div className="bar-track" style={{ width: 80, flex: 'none' }}>
        <div className="bar-fill" style={{ width:`${pct}%`, background: done ? '#22c55e' : stroke }}/>
      </div>
      {/* 학점/충족 텍스트 */}
      <span className="yoram-sub-bar-stat" style={{ color: done ? '#22c55e' : stroke }}>
        {done ? `${completed}/${required}학점 충족!` : required > 0 ? `${completed}/${required}학점` : `${completed}학점`}
      </span>
    </div>
  );
}

function GradeChip({ grade }) {
  if (!grade) return <span className="grade-chip none">-</span>;
  const g = grade.toUpperCase();
  const cls = g.startsWith('A')?'A':g.startsWith('B')?'B':g.startsWith('C')?'C':g.startsWith('D')?'D':g==='P'?'P':'F';
  return <span className={`grade-chip ${cls}`}>{grade}</span>;
}

// 작은 과목 카드 — 등록 페이지 스타일
function MiniCourseCard({ c, onEdit }) {
  const invalid = ['F','N','NP'].includes((c.course_grade||'').toUpperCase()) || !!c.delete_type;
  return (
    <div className={`yoram-mini-card${invalid ? ' invalid' : ''}`}>
      {/* 과목명 + 태그칩 + 수정버튼 — EtcYoramPage 동일 */}
      <div className="yoram-mini-name-row">
        <span className={`yoram-mini-name${invalid ? ' strikethrough' : ''}`}>{c.lecture_name}</span>
        {(c.lecture_category || c.area) && (
          <div className="yoram-mini-name-chips">
            {c.lecture_category && <span className="yoram-mini-tag liberal-chip">{c.lecture_category}</span>}
            {c.area && c.area !== c.lecture_category && (
              <span className="yoram-mini-tag yoram-sub-chip">{c.area}</span>
            )}
          </div>
        )}
        <button className="yoram-mini-edit-btn" onClick={() => onEdit(c)} title="수정">
          <FiEdit2 size={11}/>
        </button>
      </div>
      {/* 성적 · 학점 · 학수번호 한 줄 */}
      <div className="yoram-mini-meta-row">
        <GradeChip grade={c.course_grade}/>
        <span className="yoram-mini-dot">·</span>
        <span className="yoram-mini-credit">{c.lecture_credit}학점</span>
        {c.lecture_code && c.lecture_code !== 'MANUAL' && (
          <><span className="yoram-mini-dot">·</span>
          <span className="yoram-mini-code">{c.lecture_code}</span></>
        )}
        {c.source_type === 'manual' && <span className="yoram-manual-badge">수기</span>}
        {c.delete_type && <span className="yoram-badge-invalid">취득포기</span>}
      </div>
    </div>
  );
}

export default function GeneralYoramPage() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [userInfo, setUserInfo]     = useState(null);
  const [tags, setTags]             = useState([]);
  const [courses, setCourses]       = useState([]);
  const [expanded, setExpanded]     = useState({});
  const [editCourse, setEditCourse]     = useState(null);
  const [editForm,   setEditForm]       = useState(EMPTY_FORM);
  const [editLoading, setEditLoading]   = useState(false);
  const [allTags, setAllTags]           = useState({ major:[], general:[], etc:[], general_groups:[] });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [courseRes, tagRes, userRes] = await Promise.all([getMyCourses(), getTags(), getMyInfo()]);
      const allCourses = courseRes.data?.courses ?? courseRes.data?.items ?? (Array.isArray(courseRes.data) ? courseRes.data : []);
      const generalCourses = allCourses.filter(c => c.system_category === 'general' && !isInvalid(c));
      const generalTags = tagRes.data?.general ?? [];
      const userData = userRes.data?.user ?? userRes.data ?? null;
      const { general_groups, ...tagData } = tagRes.data;
      setCourses(generalCourses);
      setTags(generalTags);
      setUserInfo(userData);
      setAllTags({ ...tagData, general_groups: general_groups || [] });
      const init = {};
      generalTags.forEach(t => { init[t.tag_id] = false; });
      init['untagged'] = false;
      setExpanded(init);
    } catch (err) { console.error('교양 이수 조회 실패:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── 매핑: lecture_category === tag_group 기준
  // 그룹별로 묶고, 소분류(tag_name != tag_group)는 area 기준으로 추가 분류
  const groups = [...new Set(tags.map(t => t.tag_group).filter(Boolean))];

  // 그룹별 소분류 태그 (tag_name 있고 tag_group과 다른 것)
  const subTagsByGroup = groups.reduce((acc, g) => {
    acc[g] = tags.filter(t => t.tag_group === g && t.tag_name && t.tag_name !== t.tag_group);
    return acc;
  }, {});

  // 그룹 루트 태그 (tag_name 없거나 tag_group과 같음)
  const rootTagByGroup = groups.reduce((acc, g) => {
    acc[g] = tags.find(t => t.tag_group === g && (!t.tag_name || t.tag_name === t.tag_group));
    return acc;
  }, {});

  // 그룹별 과목 계산
  const groupData = groups.map(group => {
    const groupCourses = courses.filter(c => c.lecture_category === group);
    const subTags = subTagsByGroup[group] || [];
    const rootTag = rootTagByGroup[group];

    // 소분류별 과목
    const subData = subTags.map(st => {
      const matched = groupCourses.filter(c => c.area === st.tag_name);
      return { ...st, courses: matched, completed_credits: matched.reduce((s,c)=>s+c.lecture_credit,0) };
    });

    // 소분류에 속하지 않은 과목 (그룹 전체 과목)
    const subAreaNames = subTags.map(t => t.tag_name);
    const ungroupedCourses = groupCourses.filter(c => !c.area || !subAreaNames.includes(c.area));
    const groupCompleted = groupCourses.reduce((s,c)=>s+c.lecture_credit,0);
    // 그룹 전체 min_credits: rootTag 있으면 그 값, 없으면 subTags min_credits 합산
    const rootMin = rootTag?.min_credits != null
      ? rootTag.min_credits
      : subTags.reduce((s, t) => s + (t.min_credits || 0), 0);

    return { group, rootTag, subData, ungroupedCourses, groupCourses, groupCompleted, rootMin };
  });

  const mappedIds = new Set(courses.filter(c => c.lecture_category).map(c => c.evidence_lec_id));
  const untagged  = courses.filter(c => !mappedIds.has(c.evidence_lec_id));

  const totalRequired  = userInfo?.general_credits || 0;
  const totalCompleted = courses.reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const overallPct = totalRequired > 0
    ? Math.min(Math.round((totalCompleted / totalRequired) * 100), 100)
    : totalCompleted > 0 ? 100 : 0;
  const noReq = totalRequired === 0;

  const toggle = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleEditOpen = (course) => {
    setEditCourse(course);
    setEditForm({
      lecture_name:        course.lecture_name,
      lecture_credit:      course.lecture_credit,
      system_category:     course.system_category,
      lecture_category:    course.lecture_category    || '',
      lecture_code:        course.lecture_code        || 'MANUAL',
      completion_year:     course.completion_year,
      completion_semester: course.completion_semester,
      course_grade:        course.course_grade        || '',
      area:                course.area                || '',
      delete_type:         course.delete_type         || null,
    });
  };

  const handleEditFormChange = (field, value) => {
    if (field === 'course_grade') {
      const forceInvalid = FORCE_INVALID.includes(value.toUpperCase());
      setEditForm(prev => ({ ...prev, course_grade: value, delete_type: forceInvalid ? '취득학점포기' : prev.delete_type }));
    } else if (field === 'system_category') {
      setEditForm(prev => ({ ...prev, system_category: value, area: '', lecture_category: '' }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleEditSave = async () => {
    if (!editForm.lecture_name) return alert('과목명을 입력해주세요.');
    setEditLoading(true);
    try {
      await updateCourse(editCourse.evidence_lec_id, { ...editForm, delete_type: editForm.delete_type || null });
      setCourses(prev => prev.map(c =>
        c.evidence_lec_id === editCourse.evidence_lec_id ? { ...c, ...editForm } : c
      ));
      setEditCourse(null);
    } catch (err) {
      alert(`수정 실패: ${err.response?.data?.detail || err.message}`);
    } finally { setEditLoading(false); }
  };

  if (loading) return (
    <div className="yoram-page">
      <div className="yoram-loading"><div className="yoram-spinner liberal-spin"/></div>
    </div>
  );

  return (
    <div className="yoram-page">
      <div className="yoram-hero liberal-hero">
        <div className="yoram-hero-left">
          <h1 className="yoram-title">교양 이수 현황</h1>
          <p className="yoram-subtitle">교양과 관련된 이수 학점과 달성도를 확인해요.</p>
          <div className="yoram-stats-row">
            <div className="yoram-stat"><span className="yoram-stat-label">취득</span>
              <strong className="yoram-stat-val liberal-color">{totalCompleted}<em>학점</em></strong></div>
            <div className="yoram-stat-div"/>
            <div className="yoram-stat"><span className="yoram-stat-label">목표</span>
              <strong className="yoram-stat-val">
                {noReq ? <em style={{fontSize:'var(--text-sm)',color:'var(--color-text-disabled)'}}>미설정</em> : <>{totalRequired}<em>학점</em></>}
              </strong></div>
            {!noReq && <><div className="yoram-stat-div"/>
            <div className="yoram-stat"><span className="yoram-stat-label">남은</span>
              <strong className="yoram-stat-val">{Math.max(0, totalRequired - totalCompleted)}<em>학점</em></strong></div></>}
            <div className="yoram-stat-div"/>
            <div className="yoram-stat"><span className="yoram-stat-label">이수 과목</span>
              <strong className="yoram-stat-val liberal-color">{courses.length}<em>개</em></strong></div>
          </div>
          {noReq && totalCompleted > 0 && (
            <p className="yoram-notice">⚙️ 교양 목표학점이 설정되지 않았어요. 홈 화면의 <strong>설정(톱니바퀴)</strong>에서 변경할 수 있어요.</p>
          )}
        </div>
        <div className="yoram-circle-wrap">
          <CircleProgress pct={overallPct} size={100} stroke="#3b82f6"/>
          <div className="yoram-circle-label">
            <strong className="liberal-color">{noReq && totalCompleted > 0 ? `${totalCompleted}학점` : `${overallPct}%`}</strong>
            <span>{noReq ? '취득' : '달성'}</span>
          </div>
        </div>
      </div>

      {tags.length === 0 && courses.length === 0 ? (
        <div className="yoram-empty">
          <FiBookOpen size={36}/>
          <p>등록된 교양 과목이 없어요</p>
          <p className="yoram-empty-sub">교양 과목을 이수 과목 등록에서 추가해보세요</p>
        </div>
      ) : (
        <div className="yoram-card">
          <div className="yoram-card-header">
            <h2 className="yoram-card-title">태그별 이수 현황</h2>
            <span className="yoram-card-meta">총 <strong>{tags.length}개</strong> 태그 · {courses.length}개 과목</span>
          </div>

          <div className="tag-list">
            {groupData.map(({ group, rootTag, subData, ungroupedCourses, groupCourses, groupCompleted, rootMin }) => (
              <div key={group} className="tag-block">
                {/* 그룹 헤더 */}
                <button className="tag-block-header" onClick={() => toggle(group)}>
                  <div className="tag-block-left">
                    {expanded[group] ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                    <span className="tag-name liberal-chip">{group}</span>
                    <span className="tag-meta">
                      <strong style={{color:'#3b82f6'}}>{groupCompleted}</strong>
                      {rootMin > 0 ? <span> / {rootMin}학점</span> : <span className="tag-meta-noreq"> 학점 취득</span>}
                    </span>
                    {!expanded[group] && groupCourses.length > 0 && <span className="tag-hint">{groupCourses.length}개 과목</span>}
                  </div>
                  <BarProgress completed={groupCompleted} required={rootMin} stroke="#3b82f6"/>
                </button>

                {expanded[group] && (
                  <div className="tag-courses">
                    {/* 소분류 미니 그래프 — 소분류 있을 때만 */}
                    {subData.length > 0 && (
                      <div className="yoram-sub-bars">
                        {subData.map(st => (
                          <SubBar key={st.tag_id}
                            label={st.tag_name}
                            completed={st.completed_credits}
                            required={st.min_credits}
                            stroke="#3b82f6"
                          />
                        ))}
                      </div>
                    )}

                    {/* 과목 그리드 */}
                    {groupCourses.length === 0
                      ? <p className="no-courses">이수한 과목이 없어요</p>
                      : <div className="yoram-mini-grid">
                          {groupCourses.map(c => <MiniCourseCard key={c.evidence_lec_id} c={c} onEdit={handleEditOpen}/>)}
                        </div>
                    }
                  </div>
                )}
              </div>
            ))}

            {untagged.length > 0 && (
              <div className="tag-block untagged-block">
                <button className="tag-block-header" onClick={() => toggle('untagged')}>
                  <div className="tag-block-left">
                    {expanded['untagged'] ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                    <span className="tag-name untagged-chip">미분류</span>
                    <span className="tag-meta">{untagged.length}개 · {untagged.reduce((s,c)=>s+c.lecture_credit,0)}학점</span>
                  </div>
                </button>
                {expanded['untagged'] && (
                  <div className="tag-courses">
                    <div className="yoram-mini-grid">
                      {untagged.map(c => <MiniCourseCard key={c.evidence_lec_id} c={c} onEdit={handleEditOpen}/>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <EditCourseModal
        isOpen={!!editCourse}
        course={editCourse}
        formData={editForm}
        onFormChange={handleEditFormChange}
        onClose={() => setEditCourse(null)}
        onSave={handleEditSave}
        loading={editLoading}
        tags={allTags}
      />
    </div>
  );
}
