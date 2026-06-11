import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiBookOpen, FiEdit2 } from 'react-icons/fi';
import { getMyCourses, updateCourse } from '../../api/courses';
import { getTags } from '../../api/tags';
import { EMPTY_FORM, FORCE_INVALID } from '../../utils/constants';
import EditCourseModal from '../../components/modals/EditCourseModal';
import './EtcYoramPage.css';

const INVALID_GRADES = ['F', 'N', 'NP'];
const isInvalid = c => INVALID_GRADES.includes((c.course_grade||'').toUpperCase()) || !!c.delete_type;
const ETC_STROKE = '#c47c2b';

function CircleProgress({ pct, size = 96 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const done = pct >= 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--zol-beige-200)" strokeWidth={7}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={done ? '#22c55e' : ETC_STROKE} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }}/>
    </svg>
  );
}

function BarProgress({ completed, required }) {
  const pct = required > 0
    ? Math.min((completed / required) * 100, 100)
    : completed > 0 ? 100 : 0;
  const done = required > 0 && pct >= 100;
  const noReq = required === 0;
  return (
    <div className="bar-wrap">
      <div className="bar-track">
        <div className="bar-fill" style={{ width:`${pct}%`, background: done ? '#22c55e' : noReq ? `${ETC_STROKE}88` : ETC_STROKE }}/>
      </div>
      <span className="bar-label" style={{ color: done ? '#22c55e' : ETC_STROKE }}>
        {done ? '충족!' : noReq ? `${completed}학점` : `${Math.round(pct)}%`}
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

function MiniCourseCard({ c, onEdit }) {
  const isInvalid = ['F','N','NP'].includes((c.course_grade||'').toUpperCase()) || !!c.delete_type;
  return (
    <div className={`yoram-mini-card${isInvalid ? ' invalid' : ''}`}>
      {/* 과목명 + 태그칩 + 수정버튼 */}
      <div className="yoram-mini-name-row">
        <span className={`yoram-mini-name${isInvalid ? ' strikethrough' : ''}`}>{c.lecture_name}</span>
        {c.lecture_category && (
          <div className="yoram-mini-name-chips">
            <span className="yoram-mini-tag etc-chip">{c.lecture_category}</span>
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

export default function EtcYoramPage() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
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
      const [courseRes, tagRes] = await Promise.all([getMyCourses(), getTags()]);
      const allCourses = courseRes.data?.courses ?? courseRes.data?.items ?? (Array.isArray(courseRes.data) ? courseRes.data : []);
      const etcCourses = allCourses.filter(c => c.system_category === 'etc' && !isInvalid(c));
      const etcTags = tagRes.data?.etc ?? tagRes.data?.tags?.filter(t => t.system_category === 'etc') ?? [];
      const { general_groups, ...tagData } = tagRes.data;
      setCourses(etcCourses);
      setTags(etcTags);
      setAllTags({ ...tagData, general_groups: general_groups || [] });
      const init = {};
      etcTags.forEach(t => { init[t.tag_id] = false; });
      init['untagged'] = false;
      setExpanded(init);
    } catch (err) { console.error('기타 이수 조회 실패:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tagData = tags.map(tag => {
    const matched = courses.filter(c => c.lecture_category === tag.tag_group || c.tag_group === tag.tag_group);
    const completed = matched.reduce((s, c) => s + (c.lecture_credit || 0), 0);
    return { ...tag, courses: matched, completed_credits: completed };
  });
  const mappedIds = new Set(tagData.flatMap(t => t.courses.map(c => c.evidence_lec_id)));
  const untagged  = courses.filter(c => !mappedIds.has(c.evidence_lec_id));

  const totalRequired  = tags.reduce((s, t) => s + (t.min_credits || 0), 0);
  const totalCompleted = courses.reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const noReq = totalRequired === 0;
  const overallPct = totalRequired > 0
    ? Math.min(Math.round((totalCompleted / totalRequired) * 100), 100)
    : totalCompleted > 0 ? 100 : 0;

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
      <div className="yoram-loading"><div className="yoram-spinner etc-spin"/></div>
    </div>
  );

  return (
    <div className="yoram-page">
      <div className="yoram-hero etc-hero">
        <div className="yoram-hero-left">
          <h1 className="yoram-title">기타 이수 현황</h1>
          <p className="yoram-subtitle">일반선택·교류학점 등 기타 이수 내역을 확인해요.</p>
          <div className="yoram-stats-row">
            <div className="yoram-stat"><span className="yoram-stat-label">취득</span>
              <strong className="yoram-stat-val etc-color">{totalCompleted}<em>학점</em></strong></div>
            <div className="yoram-stat-div"/>
            <div className="yoram-stat"><span className="yoram-stat-label">태그 목표합계</span>
              <strong className="yoram-stat-val">
                {noReq ? <em style={{fontSize:'var(--text-sm)',color:'var(--color-text-disabled)'}}>미설정</em> : <>{totalRequired}<em>학점</em></>}
              </strong></div>
            {!noReq && <><div className="yoram-stat-div"/>
            <div className="yoram-stat"><span className="yoram-stat-label">남은</span>
              <strong className="yoram-stat-val">{Math.max(0, totalRequired - totalCompleted)}<em>학점</em></strong></div></>}
            <div className="yoram-stat-div"/>
            <div className="yoram-stat"><span className="yoram-stat-label">이수 과목</span>
              <strong className="yoram-stat-val etc-color">{courses.length}<em>개</em></strong></div>
          </div>
          {noReq && totalCompleted > 0 && (
            <p className="yoram-notice">⚙️ 기타 태그의 목표학점이 설정되지 않았어요. <strong>태그 관리</strong>에서 최소 이수학점을 설정할 수 있어요.</p>
          )}
        </div>
        <div className="yoram-circle-wrap">
          <CircleProgress pct={overallPct} size={100}/>
          <div className="yoram-circle-label">
            <strong className="etc-color">{noReq && totalCompleted > 0 ? `${totalCompleted}학점` : `${overallPct}%`}</strong>
            <span>{noReq ? '취득' : '달성'}</span>
          </div>
        </div>
      </div>

      {tags.length === 0 && courses.length === 0 ? (
        <div className="yoram-empty">
          <FiBookOpen size={36}/>
          <p>등록된 기타 과목이 없어요</p>
          <p className="yoram-empty-sub">일반선택·교류 과목을 이수 과목 등록에서 추가해보세요</p>
        </div>
      ) : (
        <div className="yoram-card">
          <div className="yoram-card-header">
            <h2 className="yoram-card-title">태그별 이수 현황</h2>
            <span className="yoram-card-meta">총 <strong>{tags.length}개</strong> 태그 · {courses.length}개 과목</span>
          </div>
          <div className="tag-list">
            {tagData.map(tag => (
              <div key={tag.tag_id} className="tag-block">
                <button className="tag-block-header" onClick={() => toggle(tag.tag_id)}>
                  <div className="tag-block-left">
                    {expanded[tag.tag_id] ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                    <span className="tag-name etc-chip">{tag.tag_group}</span>
                    <span className="tag-meta"><strong style={{color:'#c47c2b'}}>{tag.completed_credits}</strong>{tag.min_credits > 0 ? <span> / {tag.min_credits}학점</span> : <span style={{color:'var(--color-text-disabled)',fontSize:'11px'}}> 학점 취득</span>}</span>
                    {!expanded[tag.tag_id] && tag.courses?.length > 0 && <span className="tag-hint">{tag.courses.length}개 과목</span>}
                  </div>
                  <BarProgress completed={tag.completed_credits} required={tag.min_credits}/>
                </button>
                {tag.min_credits === 0 && <div className="tag-zero-guide">목표학점이 0학점으로 설정되어 있어요. <strong>태그 관리</strong>에서 최소 이수학점을 설정해주세요.</div>}
                {expanded[tag.tag_id] && (
                  <div className="tag-courses">
                    {tag.courses.length === 0
                      ? <p className="no-courses">이수한 과목이 없어요</p>
                      : <div className="yoram-mini-grid">
                          {tag.courses.map(c => <MiniCourseCard key={c.evidence_lec_id} c={c} onEdit={handleEditOpen}/>)}
                        </div>
                    }
                  </div>
                )}
              </div>
            ))}

            {(tags.length === 0 || untagged.length > 0) && (
              <div className="tag-block untagged-block">
                <button className="tag-block-header" onClick={() => toggle('untagged')}>
                  <div className="tag-block-left">
                    {expanded['untagged'] ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                    <span className="tag-name untagged-chip">{tags.length === 0 ? '전체 과목' : '미분류'}</span>
                    <span className="tag-meta">{untagged.length}개 · {untagged.reduce((s,c)=>s+(c.lecture_credit||0),0)}학점</span>
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
