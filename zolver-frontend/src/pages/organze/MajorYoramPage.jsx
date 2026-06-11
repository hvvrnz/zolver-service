import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiBookOpen, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { getMyCourses, updateCourse } from '../../api/courses';
import { EMPTY_FORM, FORCE_INVALID } from '../../utils/constants';
import EditCourseModal from '../../components/modals/EditCourseModal';
import { getTags } from '../../api/tags';
import { getMyInfo } from '../../api/user';
import './MajorYoramPage.css';

const INVALID_GRADES = ['F', 'N', 'NP'];

function isInvalid(course) {
  return INVALID_GRADES.includes((course.course_grade || '').toUpperCase()) || !!course.delete_type;
}

// 원형 진행률
function CircleProgress({ pct, size = 96, stroke = 'var(--color-primary)' }) {
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

// 가로 바
function BarProgress({ completed, required, stroke = 'var(--color-primary)' }) {
  const pct = required > 0 ? Math.min((completed / required) * 100, 100) : 0;
  const done = pct >= 100;
  return (
    <div className="bar-wrap">
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: done ? '#22c55e' : stroke }}/>
      </div>
      <span className="bar-label" style={{ color: done ? '#22c55e' : stroke }}>
        {done ? '충족!' : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

function GradeChip({ grade }) {
  if (!grade) return <span className="grade-chip none">-</span>;
  const g = grade.toUpperCase();
  const cls = g.startsWith('A') ? 'A' : g.startsWith('B') ? 'B'
    : g.startsWith('C') ? 'C' : g.startsWith('D') ? 'D'
    : g === 'P' ? 'P' : 'F';
  return <span className={`grade-chip ${cls}`}>{grade}</span>;
}

// 과목 카드 — EditCourseModal 방식
function MiniCourseCard({ c, onEdit }) {
  const invalid = ['F','N','NP'].includes((c.course_grade||'').toUpperCase()) || !!c.delete_type;
  return (
    <div className={`yoram-mini-card${invalid ? ' invalid' : ''}`}>
      <div className="yoram-mini-name-row">
        <span className={`yoram-mini-name${invalid ? ' strikethrough' : ''}`}>{c.lecture_name}</span>
        {c.lecture_category && (
          <div className="yoram-mini-name-chips">
            <span className="yoram-mini-tag major-chip">{c.lecture_category}</span>
          </div>
        )}
        <button className="yoram-mini-edit-btn" onClick={() => onEdit(c)} title="수정">
          <FiEdit2 size={11}/>
        </button>
      </div>
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


export default function MajorYoramPage() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [userInfo, setUserInfo]     = useState(null);
  const [tags, setTags]             = useState([]);
  const [courses, setCourses]       = useState([]);
  const [expanded, setExpanded]     = useState({});
  const [editCourse, setEditCourse] = useState(null);
  const [editForm, setEditForm]     = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [allTags, setAllTags]       = useState({ major:[], general:[], etc:[], general_groups:[] });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [courseRes, tagRes, userRes] = await Promise.all([
        getMyCourses(), getTags(), getMyInfo()
      ]);
      const allCourses = courseRes.data.courses || [];
      // 유효한 전공 과목만
      const majorCourses = allCourses.filter(c =>
        c.system_category === 'major' && !isInvalid(c)
      );
      const majorTags = tagRes.data.major || [];
      const { general_groups, ...tagData } = tagRes.data;
      setCourses(majorCourses);
      setTags(majorTags);
      setUserInfo(userRes.data?.user ?? userRes.data ?? null);
      setAllTags({ ...tagData, general_groups: general_groups || [] });
      const init = {};
      majorTags.forEach(t => { init[t.tag_id] = false; });
      init['untagged'] = false;
      setExpanded(init);
    } catch (err) {
      console.error('전공 이수 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 태그별 매핑 (lecture_category === tag_group)
  const tagData = tags.map(tag => {
    const matched = courses.filter(c => c.lecture_category === tag.tag_group);
    const completed = matched.reduce((s, c) => s + (c.lecture_credit || 0), 0);
    return { ...tag, courses: matched, completed_credits: completed };
  });

  const mappedIds = new Set(tagData.flatMap(t => t.courses.map(c => c.evidence_lec_id)));
  const untagged  = courses.filter(c => !mappedIds.has(c.evidence_lec_id));

  // users 테이블 기준 전체 이수율
  const totalRequired  = userInfo?.major_credits || 0;
  const totalCompleted = courses.reduce((s, c) => s + (c.lecture_credit || 0), 0);
  const overallPct     = totalRequired > 0 ? Math.min(Math.round((totalCompleted / totalRequired) * 100), 100) : 0;

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

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
      <div className="yoram-loading"><div className="yoram-spinner major-spin"/></div>
    </div>
  );

  return (
    <>
    <div className="yoram-page">

      {/* 헤더 + 전체 이수율 */}
      <div className="yoram-hero major-hero">
        <div className="yoram-hero-left">
          <h1 className="yoram-title">전공 이수 현황</h1>
          <p className="yoram-subtitle">전공과 관련된 이수학점과 달성도를 확인해요.</p>
          <div className="yoram-stats-row">
            <div className="yoram-stat">
              <span className="yoram-stat-label">취득</span>
              <strong className="yoram-stat-val major-color">{totalCompleted}<em>학점</em></strong>
            </div>
            <div className="yoram-stat-div"/>
            <div className="yoram-stat">
              <span className="yoram-stat-label">목표</span>
              <strong className="yoram-stat-val">{totalRequired}<em>학점</em></strong>
            </div>
            <div className="yoram-stat-div"/>
            <div className="yoram-stat">
              <span className="yoram-stat-label">남은</span>
              <strong className="yoram-stat-val">{Math.max(0, totalRequired - totalCompleted)}<em>학점</em></strong>
            </div>
            <div className="yoram-stat-div"/>
            <div className="yoram-stat">
              <span className="yoram-stat-label">이수 과목</span>
              <strong className="yoram-stat-val major-color">{courses.length}<em>개</em></strong>
            </div>
          </div>
          {/* 총 목표학점이 0이면 홈 설정 안내 */}
          {totalRequired === 0 && (
            <p className="yoram-notice">
              ⚙️ 전공 목표학점이 설정되지 않았어요. 홈 화면의 <strong>설정(톱니바퀴)</strong>에서 변경할 수 있어요.
            </p>
          )}
        </div>
        <div className="yoram-circle-wrap">
          <CircleProgress pct={overallPct} size={100} stroke="var(--color-primary)"/>
          <div className="yoram-circle-label">
            <strong className="major-color">{overallPct}%</strong>
            <span>달성</span>
          </div>
        </div>
      </div>

      {/* 태그별 이수 현황 */}
      {tags.length === 0 ? (
        <div className="yoram-empty">
          <FiBookOpen size={36}/>
          <p>등록된 전공 태그가 없어요</p>
          <p className="yoram-empty-sub">태그 관리에서 전필·전선 등 태그를 추가하면 이수율을 확인할 수 있어요</p>
        </div>
      ) : (
        <div className="yoram-card">
          <div className="yoram-card-header">
            <h2 className="yoram-card-title">태그별 이수 현황</h2>
            <span className="yoram-card-meta">총 <strong>{tags.length}개</strong> 태그</span>
          </div>

          <div className="tag-list">
            {tagData.map(tag => (
              <div key={tag.tag_id} className="tag-block">
                <button className="tag-block-header" onClick={() => toggle(tag.tag_id)}>
                  <div className="tag-block-left">
                    {expanded[tag.tag_id] ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
                    <span className="tag-name major-chip">{tag.tag_group}</span>
                    <span className="tag-meta"><strong style={{color:'var(--color-primary)'}}>{tag.completed_credits}</strong>{tag.min_credits > 0 ? <span> / {tag.min_credits}학점</span> : <span className="tag-meta-noreq"> 학점 취득</span>}</span>
                    {!expanded[tag.tag_id] && tag.courses?.length > 0 && (
                      <span className="tag-hint">이수한 과목 목록 보기</span>
                    )}
                  </div>
                  {tag.min_credits > 0
                    ? <BarProgress completed={tag.completed_credits} required={tag.min_credits}/>
                    : <span className="tag-zero-notice">목표학점 미설정</span>
                  }
                </button>
                {tag.min_credits === 0 && (
                  <div className="tag-zero-guide">
                    목표학점이 0학점으로 설정되어 있어요. <strong>태그 관리</strong>에서 최소 이수학점을 설정해주세요.
                  </div>
                )}
                {expanded[tag.tag_id] && (
                  <div className="tag-courses">
                    {tag.courses.length === 0
                      ? <p className="no-courses">이수한 과목이 없어요</p>
                      : <div className="yoram-mini-grid">{tag.courses.map(c => <MiniCourseCard key={c.evidence_lec_id} c={c} onEdit={handleEditOpen}/>)}</div>
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
                      {untagged.map(c => (
                        <MiniCourseCard key={c.evidence_lec_id} c={c} onEdit={handleEditOpen}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

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
    </>
  );
}
