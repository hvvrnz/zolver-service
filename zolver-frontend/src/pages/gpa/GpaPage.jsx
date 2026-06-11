import { useState, useEffect, useCallback } from 'react';
import { getMyCourses } from '../../api/courses';
import { getMyInfo, updateGpaTargets } from '../../api/user';
import { INVALID_GRADES } from '../../utils/constants';
import './GpaPage.css';

const GPA_MAP = {
  'A+': 4.5, 'A': 4.0,
  'B+': 3.5, 'B': 3.0,
  'C+': 2.5, 'C': 2.0,
  'D+': 1.5, 'D': 1.0,
  'F':  0.0,
};
const SEM_ORDER = ['1학기', '하계 계절학기', '2학기', '동계 계절학기'];

function floorGPA(val) {
  if (val === null || val === undefined) return null;
  return Math.floor(val * 100) / 100;
}

function roundGPA(val) {
  if (val === null || val === undefined) return null;
  // 소수점 셋째 자리에서 반올림하여 둘째 자리까지 표시
  return Math.round(val * 100) / 100;
}

function fmtGPA(val) {
  const f = floorGPA(val);
  return f !== null ? f.toFixed(2) : '-';
}

// 학기별 GPA 표시 - 반올림
function fmtGPAround(val) {
  const r = roundGPA(val);
  return r !== null ? r.toFixed(2) : '-';
}
function isGradable(course) {
  if (course.delete_type) return false;
  if (!course.course_grade) return false;
  if (['N', 'NP'].includes(course.course_grade)) return false; // F는 여기서 안 걸러냄
  return Object.prototype.hasOwnProperty.call(GPA_MAP, course.course_grade);
}
function calcGPA(courses) {
  const valid = courses.filter(isGradable);
  const pts = valid.reduce((s, c) => s + GPA_MAP[c.course_grade] * c.lecture_credit, 0);
  const crd = valid.reduce((s, c) => s + c.lecture_credit, 0);
  // 반올림하지 말고 원본값을 반환
  return { gpa: crd === 0 ? null : pts / crd, credits: crd, count: valid.length, points: pts };
}
function calcByTerm(courses) {
  const terms = {};
  courses.forEach(c => {
    if (!isGradable(c)) return;
    const key = `${c.completion_year}__${c.completion_semester}`;
    if (!terms[key]) terms[key] = { year: c.completion_year, sem: c.completion_semester, pts: 0, crd: 0 };
    terms[key].pts += GPA_MAP[c.course_grade] * c.lecture_credit;
    terms[key].crd += c.lecture_credit;
  });
  return Object.values(terms)
    .map(t => ({ ...t, gpa: t.pts / t.crd }))
    .sort((a, b) => a.year !== b.year ? a.year - b.year : SEM_ORDER.indexOf(a.sem) - SEM_ORDER.indexOf(b.sem));
}
function getLatestTermKey(courses) {
  const keys = [...new Set(courses.map(c => `${c.completion_year}__${c.completion_semester}`))];
  return keys.sort((a, b) => {
    const [ay, as_] = a.split('__');
    const [by, bs]  = b.split('__');
    return ay !== by ? by - ay : SEM_ORDER.indexOf(bs) - SEM_ORDER.indexOf(as_);
  })[0] || null;
}
function calcExplain(currentPoints, currentCredits, targetGPA, remainCredits) {
  if (!remainCredits || remainCredits <= 0) return null;
  const required = (targetGPA * (currentCredits + remainCredits) - currentPoints) / remainCredits;
  const impossible = required > 4.5;
  const done = required <= 0;
  const maxReachable = (currentPoints + 4.5 * remainCredits) / (currentCredits + remainCredits);
  let hint = '';
  if (impossible) {
    hint = `앞으로 ${remainCredits}학점의 성적을 모두 A+로 받아도 최대 ${fmtGPA(maxReachable)}점까지만 올라가요. 목표를 낮추거나 더 많은 학점을 이수해야 해요.`;
  } else if (done) {
    hint = '이미 목표 GPA를 달성했어요! 🎉';
  } else if (required >= 4.3) {
    hint = `앞으로 ${remainCredits}학점의 성적을 거의 모두 4.5 (A+)로 받아야 해요. 매우 도전적인 목표예요.🔥`;
  } else if (required >= 4.0) {
    hint = `앞으로 ${remainCredits}학점의 성적을 4.0 (A) 이상으로 유지해야 해요.🔥`;
  } else if (required >= 3.5) {
    hint = `앞으로 ${remainCredits}학점의 성적을 3.5 (B+) 이상으로 유지하면 달성할 수 있어요.🔥`;
  } else if (required >= 3.0) {
    hint = `앞으로 ${remainCredits}학점의 성적을 3.0 (B) 이상으로 유지하면 달성할 수 있어요.🔥`;
  } else {
    hint = `현재 페이스로도 충분히 달성 가능해요.`;
  }
  return { required, impossible, done, hint };
}
function calcMinCredits(currentPoints, currentCredits, targetGPA) {
  if (targetGPA >= 4.5) return null;
  const x = (targetGPA * currentCredits - currentPoints) / (4.5 - targetGPA);
  if (x <= 0) return 0;
  return Math.ceil(x);
}

// 2학점 기준 보수적 과목 조합 계산
// required: 필요 평균 평점, totalCredits: 입력한 학점 수
function calcCourseCombo(required, totalCredits) {
  if (required <= 0 || required > 4.5) return null;
  const creditPerCourse = 2; // 보수적 기준
  const numCourses = Math.ceil(totalCredits / creditPerCourse);

  // GPA 등급 목록 (높은 순)
  const grades = [
    { label: 'A+', point: 4.5 },
    { label: 'A',  point: 4.0 },
    { label: 'B+', point: 3.5 },
    { label: 'B',  point: 3.0 },
    { label: 'C+', point: 2.5 },
    { label: 'C',  point: 2.0 },
  ];

  // 필요 총 점수
  const neededTotal = required * totalCredits;

  // 두 인접 등급 조합으로 표현
  for (let i = 0; i < grades.length - 1; i++) {
    const high = grades[i];
    const low  = grades[i + 1];
    // high * x + low * (numCourses - x) = neededTotal / creditPerCourse
    // x = (neededTotal/creditPerCourse - low.point * numCourses) / (high.point - low.point)
    const x = (neededTotal / creditPerCourse - low.point * numCourses) / (high.point - low.point);
    if (x >= 0 && x <= numCourses) {
      const highCount = Math.ceil(x);
      const lowCount  = numCourses - highCount;
      if (highCount >= 0 && lowCount >= 0) {
        return { highLabel: high.label, highCount, lowLabel: low.label, lowCount, numCourses };
      }
    }
  }
  return null;
}

// ── 꺾은선 그래프
function LineChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = 700, H = 120, PL = 12, PR = 12, PT = 20;
  const gpas = data.map(d => d.gpa);
  const minG = Math.max(0, Math.min(...gpas) - 0.3);
  const maxG = Math.min(4.5, Math.max(...gpas) + 0.3);
  const xStep = data.length < 2 ? 0 : (W - PL - PR) / (data.length - 1);
  const toX = i => PL + i * xStep;
  const toY = g => PT + (H - PT) * (1 - (g - minG) / (maxG - minG));
  const polyline = data.map((d, i) => `${toX(i)},${toY(d.gpa)}`).join(' ');
  const area = [`${toX(0)},${H}`, ...data.map((d, i) => `${toX(i)},${toY(d.gpa)}`), `${toX(data.length - 1)},${H}`].join(' ');
  const semShort = s => s === '1학기' ? '1학기' : s === '2학기' ? '2학기' : s === '하계 계절학기' ? '하계계절' : '동계계절';
  return (
    <div className="gpa-linechart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="gpa-linechart-svg">
        <polygon points={area} className="gpa-line-area" />
        <polyline points={polyline} className="gpa-line-path" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.gpa)} r="4" className="gpa-line-dot" />
            <text x={toX(i)} y={toY(d.gpa) - 9} textAnchor="middle" className="gpa-line-val">{fmtGPAround(d.gpa)}</text>
          </g>
        ))}
      </svg>
      <div className="gpa-linechart-labels">
        {data.map((d, i) => (
          <div key={i} className="gpa-linechart-label">
            <span>{d.year}년</span><span>{semShort(d.sem)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 목표 설정 아이템 (인라인 수정)
function TargetItem({ label, desc, value, currentGPA, onSave }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const diff = value != null && currentGPA != null
    ? roundGPA(value) - roundGPA(currentGPA) : null;
  const achieved = diff !== null && diff <= 0;

  function handleEdit() {
    setLocal(value != null ? String(value) : '');
    setError('');
    setEditing(true);
  }
  function handleClose() { setEditing(false); setError(''); }

  async function handleSave() {
    const num = local.trim() === '' ? null : parseFloat(local);
    if (num !== null && (isNaN(num) || num < 0 || num > 4.5)) {
      setError('0.00 ~ 4.5 사이로 입력해주세요.');
      return;
    }
    setSaving(true); setError('');
    try {
      await onSave(num);
      setEditing(false);
    } catch {
      setError('저장 실패. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gpa-target-item">
      <div className="gpa-target-info">
        <span className="gpa-target-label">{label}</span>
        <span className="gpa-target-desc">{desc}</span>
      </div>
      <div className="gpa-target-right">
        {editing ? (
          <div className="gpa-target-edit-col">
            <div className="gpa-target-edit-row">
              <input
                className={`gpa-input gpa-input-sm ${error ? 'error' : ''}`}
                type="number" min="0" max="4.5" step="0.01"
                placeholder="예: 3.80"
                value={local}
                onChange={e => { setLocal(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <span className="gpa-calc-unit">/ 4.5</span>
              <button className="gpa-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
              {value != null && (
                <button className="gpa-btn-delete" onClick={() => { onSave(null).catch(() => {}); setEditing(false); }}>
                  삭제
                </button>
              )}
              <button className="gpa-btn-cancel" onClick={handleClose}>취소</button>
            </div>
            {error && <span className="gpa-target-error">{error}</span>}
          </div>
        ) : (
          <div className="gpa-target-val-row">
            {value != null ? (
              <span className={`gpa-target-badge ${achieved ? 'achieved' : ''}`}>
                {roundGPA(value).toFixed(2)}점
                {diff !== null && (
                  <span className="gpa-target-diff">
                    {achieved ? ' ✓' : ` (목표까지 ${fmtGPA(diff)} 남음)`}
                  </span>
                )}
              </span>
            ) : (
              <span className="gpa-target-badge unset">미설정</span>
            )}
            <button className="gpa-btn-edit" onClick={handleEdit} title={value != null ? '수정' : '설정'}>
              {value != null ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GpaPage() {
  const [courses,  setCourses]  = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [remainCredits, setRemainCredits] = useState('');
  const [simTab, setSimTab] = useState('total'); // 'total' | 'major'
  const [remainMajorCredits, setRemainMajorCredits] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [courseRes, userRes] = await Promise.all([getMyCourses(), getMyInfo()]);
      setCourses(courseRes.data.courses || []);
      setUserInfo(userRes.data.user || null);
    } catch (err) { console.error('조회 실패:', err); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 각 목표를 개별 PATCH (다른 값 안 건드림)
  async function handleSaveTarget(field, value) {
    await updateGpaTargets({ [field]: value });
    setUserInfo(prev => ({ ...prev, [field]: value }));
  }

  const { gpa: totalGPA, credits: totalCredits, count: gradableCount, points: totalPoints } = calcGPA(courses);
  const majorCourses = courses.filter(c => c.system_category === 'major');
  const majorGPA     = calcGPA(majorCourses).gpa;
  const majorCredits = calcGPA(majorCourses).credits;
  const termData     = calcByTerm(courses);
  const latestKey    = getLatestTermKey(courses);
  const [latestYear, latestSem] = latestKey ? latestKey.split('__') : [null, null];
  const latestTermGPA = calcGPA(courses.filter(c => `${c.completion_year}__${c.completion_semester}` === latestKey)).gpa;
  const bestTerm  = termData.length ? termData.reduce((a, b) => a.gpa > b.gpa ? a : b) : null;
  const worstTerm = termData.length > 1 ? termData.reduce((a, b) => a.gpa < b.gpa ? a : b) : null;

  const targetGPA      = userInfo?.target_gpa;
  const targetMajorGPA = userInfo?.target_gpa_major;
  const { points: majorPoints } = calcGPA(majorCourses);

  const remain     = parseFloat(remainCredits);
  const calcResult = (!isNaN(remain) && remain > 0 && targetGPA)
    ? calcExplain(totalPoints, totalCredits, targetGPA, remain) : null;
  const minCredits = targetGPA ? calcMinCredits(totalPoints, totalCredits, targetGPA) : null;

  const remainMajor     = parseFloat(remainMajorCredits);
  const calcMajorResult = (!isNaN(remainMajor) && remainMajor > 0 && targetMajorGPA)
    ? calcExplain(majorPoints, majorCredits, targetMajorGPA, remainMajor) : null;
  const minMajorCredits = targetMajorGPA ? calcMinCredits(majorPoints, majorCredits, targetMajorGPA) : null;

  const distCourses  = courses.filter(c => !c.delete_type);
  const totalDistCnt = distCourses.length;

  const cardSub = (current, target) => {
    if (target == null) return { text: '목표 미설정', cls: 'dim' };
    const d = roundGPA(target) - roundGPA(current);
    if (d <= 0) return { text: `목표 ${roundGPA(target).toFixed(2)} · ✓ 달성`, cls: 'achieved' };
    return { text: `목표 ${roundGPA(target).toFixed(2)}`, cls: '' };
  };
  const totalSub  = cardSub(totalGPA, userInfo?.target_gpa);
  const majorSub  = cardSub(majorGPA, userInfo?.target_gpa_major);

  if (loading) return (
    <div className="gpa-page"><div className="gpa-loading"><div className="loading-spinner" /><span>불러오는 중...</span></div></div>
  );
  if (!courses.length) return (
    <div className="gpa-page">
      <div className="gpa-header">
        <h2 className="gpa-title">평점 분석</h2>
        <p className="gpa-subtitle">4.5점 만점 기준 · P/NP·취득포기 과목은 제외하고 계산했어요.</p>
      </div>
      <div className="gpa-empty"><span>이수과목 등록 페이지에서 이수 과목을 먼저 등록해주세요. </span></div>
    </div>
  );

  return (
    <div className="gpa-page">
      <div className="gpa-header">
        <h2 className="gpa-title">평점(GPA) 분석</h2>
        <p className="gpa-subtitle">
          4.5점 만점기준 ·{' '}
          <span className="gpa-subtitle-rule"> P/NP·취득포기 과목은 제외하고 계산했어요.</span>
        </p>
      </div>

      {/* ── 1. 카드 */}
      <div className="gpa-summary-row">
        <div className="gpa-card main">
          <span className="gpa-card-label">전체 평균 평점</span>
          <div className="gpa-card-value-row">
            <strong className="gpa-card-value">{fmtGPA(totalGPA)}</strong>
            <span className="gpa-card-max">/ 4.5</span>
          </div>
          <span className={`gpa-card-sub ${totalSub.cls}`}>{totalSub.text}</span>
        </div>
        <div className="gpa-card">
          <span className="gpa-card-label">전공 평균 평점</span>
          <div className="gpa-card-value-row">
            <strong className="gpa-card-value">{fmtGPA(majorGPA)}</strong>
            <span className="gpa-card-max">/ 4.5</span>
          </div>
          <span className={`gpa-card-sub dark ${majorSub.cls}`}>{majorSub.text}</span>
        </div>
        <div className="gpa-card">
          <span className="gpa-card-label">
            직전 학기 평점
            {latestSem && <span className="gpa-card-label-sub"></span>}
          </span>
          <div className="gpa-card-value-row">
            <strong className="gpa-card-value">{fmtGPAround(latestTermGPA)}</strong>
            <span className="gpa-card-max"></span>
          </div>
          <span className = "gpa-card-sub dark"> {latestYear} {latestSem} 성적이에요.</span>
        </div>
      </div>

      {/* ── 3. 꺾은선 그래프 */}
      {termData.length > 0 && (
        <div className="gpa-section">
          <p className="gpa-section-title">학기별 GPA 추이</p>
          <LineChart data={termData} />
        </div>
      )}

      {/* ── 4. 목표 GPA 설정 */}
      <div className="gpa-section">
        <p className="gpa-section-title">목표 GPA 설정</p>
        <p className="gpa-section-desc">
          목표를 설정하면 카드에 달성 여부가 표시돼요. 각 항목을 눌러 설정하거나 수정할 수 있어요.
        </p>
        <div className="gpa-target-list">
          <TargetItem
            label="최종 목표 GPA"
            desc="졸업까지 전체 평균 목표"
            value={userInfo?.target_gpa}
            currentGPA={totalGPA}
            onSave={v => handleSaveTarget('target_gpa', v)}
          />
          <TargetItem
            label="전공 목표 GPA"
            desc="전공 과목만 계산한 평균 목표"
            value={userInfo?.target_gpa_major}
            currentGPA={majorGPA}
            onSave={v => handleSaveTarget('target_gpa_major', v)}
          />
        </div>
      </div>

      {/* ── 5. 역산 */}
      <div className="gpa-section">
        <div className="gpa-calc-wrap">
          <p className="gpa-calc-title">목표 평점, 달성 가능할까?</p>

          {/* 탭 */}
          <div className="gpa-sim-tabs">
            <button className={`gpa-sim-tab ${simTab === 'total' ? 'active' : ''}`} onClick={() => setSimTab('total')}>전체 평점</button>
            <button className={`gpa-sim-tab ${simTab === 'major' ? 'active' : ''}`} onClick={() => setSimTab('major')}>전공 평점</button>
          </div>

          {simTab === 'total' ? (
            !targetGPA ? (
              <p className="gpa-calc-empty">최종 목표 성적(GPA)을 설정하면 여기서 시뮬레이션할 수 있어요.</p>
            ) : (
              <>
                <div className="gpa-min-credits-box">
                  {minCredits === null ? (
                    <p className="gpa-min-credits-impossible">
                      목표 {roundGPA(targetGPA).toFixed(2)}점은 현재 {totalCredits}학점이 쌓인 상태에서 수학적으로 달성이 불가능해요.<br/>
                      앞으로 A+만 받아도 4.5점에 수렴할 뿐, 정확히 4.5를 넘을 수는 없어요. 목표를 4.49 이하로 낮춰보세요.
                    </p>
                  ) : minCredits === 0 ? (
                    <p className="gpa-min-credits-done">이미 목표 평점을 달성했어요.🎉</p>
                  ) : (
                    <p className="gpa-min-credits-text">
                      지금부터 <strong>A+만 받는다면</strong>, 최소{' '}
                      <strong className="gpa-min-credits-num">{minCredits}학점</strong>을
                      더 이수해야 목표 <strong>{roundGPA(targetGPA).toFixed(2)}</strong>점에 도달할 수 있어요.
                    </p>
                  )}
                </div>
                <p className="gpa-calc-desc">
                  현재 <strong>{fmtGPA(totalGPA)}</strong>, 목표 <strong>{roundGPA(targetGPA).toFixed(2)}</strong> —
                  앞으로 들을 학점 수를 입력하면, 그 학점을 평균 몇 점으로 받아야 목표에 도달하는지 알려줘요.
                </p>
                {userInfo && (() => {
                  const totalCurrent = courses.filter(c => !c.delete_type).reduce((s, c) => s + c.lecture_credit, 0);
                  const totalRemain  = userInfo.total_credits - totalCurrent;
                  return totalRemain > 0 ? (
                    <p className="gpa-credit-hint">
                      🎓 전체 취득학점 <strong>{totalCurrent} / {userInfo.total_credits}학점</strong> · 졸업까지 <strong>{totalRemain}학점</strong> 남았어요.
                    </p>
                  ) : (
                    <p className="gpa-credit-hint"> 🎓 전체 취득학점 <strong>{totalCurrent} / {userInfo.total_credits}학점</strong> · 졸업 학점 달성 ✓</p>
                  );
                })()}
                <div className="gpa-calc-row">
                  <div className="gpa-calc-field">
                    <label>앞으로 들을 학점 수</label>
                    <div className="gpa-calc-input-wrap">
                      <input className="gpa-input" type="number" min="1" max="200" placeholder="예: 18"
                        value={remainCredits} onChange={e => setRemainCredits(e.target.value)} />
                      <span className="gpa-calc-unit">학점</span>
                    </div>
                  </div>
                </div>
                {calcResult && (
                  <div className={`gpa-result-box ${calcResult.impossible ? 'impossible' : calcResult.done ? 'done' : ''}`}>
                    <div className="gpa-result-top">
                      <span className="gpa-result-label">필요 평균 평점</span>
                      <strong className="gpa-result-val">
                        {calcResult.impossible ? '달성 불가' : calcResult.done ? '이미 달성!' : floorGPA(calcResult.required).toFixed(2)}
                      </strong>
                    </div>
                    <p className="gpa-result-hint">{calcResult.hint}</p>
                    {!calcResult.impossible && !calcResult.done && (() => {
                      const combo = calcCourseCombo(calcResult.required, remain);
                      return combo ? (
                        <div className="gpa-combo-box">
                          <p className="gpa-combo-title">2학점짜리 과목들로만 채운다고 가정 (보수적 추정)</p>
                          <p className="gpa-combo-text">
                            {combo.highLabel} {combo.highCount}과목
                            {combo.lowCount > 0 && <><br/>{combo.lowLabel} {combo.lowCount}과목</>}
                            <span className="gpa-combo-note"> (총 {combo.numCourses}과목)</span>
                          </p>
                          <p className="gpa-combo-disclaimer">※ 실제 과목의 학점에 따라 필요 과목 수는 달라질 수 있어요.</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )
          ) : (
            !targetMajorGPA ? (
              <p className="gpa-calc-empty">전공 목표 성적(GPA)을 설정하면 여기서 시뮬레이션할 수 있어요.</p>
            ) : (
              <>
                <div className="gpa-min-credits-box">
                  {minMajorCredits === null ? (
                    <p className="gpa-min-credits-impossible">
                      목표 {roundGPA(targetMajorGPA).toFixed(2)}점은 현재 전공 {majorCredits}학점이 쌓인 상태에서 수학적으로 달성이 불가능해요.<br/>
                      목표를 4.49 이하로 낮춰보세요.
                    </p>
                  ) : minMajorCredits === 0 ? (
                    <p className="gpa-min-credits-done">이미 전공 목표 평점을 달성했어요.🎉</p>
                  ) : (
                    <p className="gpa-min-credits-text">
                      지금부터 전공 과목을 <strong>A+만 받는다면</strong>, 최소{' '}
                      <strong className="gpa-min-credits-num">{minMajorCredits}학점</strong>을
                      더 이수해야 전공 목표 <strong>{roundGPA(targetMajorGPA).toFixed(2)}</strong>점에 도달할 수 있어요.
                    </p>
                  )}
                </div>
                <p className="gpa-calc-desc">
                  현재 전공 평점 <strong>{fmtGPA(majorGPA)}</strong>, 목표 <strong>{roundGPA(targetMajorGPA).toFixed(2)}</strong> —
                  앞으로 들을 전공 학점 수를 입력해주세요.
                </p>
                {userInfo && (() => {
                  const majorCurrent = majorCourses.filter(c => !c.delete_type).reduce((s, c) => s + c.lecture_credit, 0);
                  const majorRemain  = userInfo.major_credits - majorCurrent;
                  return majorRemain > 0 ? (
                    <p className="gpa-credit-hint">
                      🎓 전공 취득학점 <strong>{majorCurrent} / {userInfo.major_credits}학점</strong> · 졸업 전공 학점까지 <strong>{majorRemain}학점</strong> 남았어요.
                    </p>
                  ) : (
                    <p className="gpa-credit-hint"> 🎓 전공 취득학점 <strong>{majorCurrent} / {userInfo.major_credits}학점</strong> · 졸업 전공 학점 달성 ✓</p>
                  );
                })()}
                <div className="gpa-calc-row">
                  <div className="gpa-calc-field">
                    <label>앞으로 들을 전공 학점 수</label>
                    <div className="gpa-calc-input-wrap">
                      <input className="gpa-input" type="number" min="1" max="200" placeholder="예: 15"
                        value={remainMajorCredits} onChange={e => setRemainMajorCredits(e.target.value)} />
                      <span className="gpa-calc-unit">학점</span>
                    </div>
                  </div>
                </div>
                {calcMajorResult && (
                  <div className={`gpa-result-box ${calcMajorResult.impossible ? 'impossible' : calcMajorResult.done ? 'done' : ''}`}>
                    <div className="gpa-result-top">
                      <span className="gpa-result-label">필요 전공 평균 평점</span>
                      <strong className="gpa-result-val">
                        {calcMajorResult.impossible ? '달성 불가' : calcMajorResult.done ? '이미 달성!' : floorGPA(calcMajorResult.required).toFixed(2)}
                      </strong>
                    </div>
                    <p className="gpa-result-hint">{calcMajorResult.hint}</p>
                    {!calcMajorResult.impossible && !calcMajorResult.done && (() => {
                      const combo = calcCourseCombo(calcMajorResult.required, remainMajor);
                      return combo ? (
                        <div className="gpa-combo-box">
                          <p className="gpa-combo-title">2학점짜리 과목들로만 채운다고 가정 (보수적 추정)</p>
                          <p className="gpa-combo-text">
                            {combo.highLabel} {combo.highCount}과목
                            {combo.lowCount > 0 && <><br/>{combo.lowLabel} {combo.lowCount}과목</>}
                            <span className="gpa-combo-note"> (총 {combo.numCourses}과목)</span>
                          </p>
                          <p className="gpa-combo-disclaimer">※ 실제 과목의 학점에 따라 필요 과목 수는 달라질 수 있어요.</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* ── 6. 성적 분포 테이블 */}
      <div className="gpa-section">
        <p className="gpa-section-title">성적 분포</p>
        <p className="gpa-section-desc">취득학점 포기 과목은 제외해요.</p>
        <table className="gpa-dist-table">
          <thead>
            <tr><th>등급</th><th>평점</th><th>과목 수</th><th>총 학점</th><th>비율</th></tr>
          </thead>
          <tbody>
            {Object.entries(GPA_MAP).map(([grade, point]) => {
              const cnt = distCourses.filter(c => c.course_grade === grade).length;
              const crd = distCourses.filter(c => c.course_grade === grade).reduce((s, c) => s + c.lecture_credit, 0);
              const pct = totalDistCnt > 0 ? ((cnt / totalDistCnt) * 100).toFixed(1) : '0.0';
              return (
                <tr key={grade} className={cnt === 0 ? 'empty' : ''}>
                  <td className="grade">{grade}</td>
                  <td className="right muted">{point.toFixed(1)}</td>
                  <td className="right">{cnt > 0 ? `${cnt}과목` : '-'}</td>
                  <td className="right">{crd > 0 ? `${crd}학점` : '-'}</td>
                  <td className="right">
                    {cnt > 0 ? (
                      <div className="gpa-dist-pct-wrap">
                        <div className="gpa-dist-pct-bar" style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} />
                        <span>{pct}%</span>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
