import { FiX, FiCalendar, FiBookOpen, FiUsers } from 'react-icons/fi';

export default function CourseDetailModal({ isOpen, course, onClose, onAdd, addBtnLabel }) {
  if (!isOpen || !course) return null;

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const hasLastCompleted = course.last_completed_year && course.last_completed_year !== 0;
  const isVerified = course.standard_type === 'verified';

  function parseCurriculumYear(ver) {
    if (!ver) return null;
    return String(ver).replace(/[^0-9]/g, '').slice(0, 4) || null;
  }

  function formatCurriculumLabel(ver) {
    const year = parseCurriculumYear(ver);
    if (!year || year.length < 4) return null;
    return `${year.slice(2, 4)}학번 이후 요람 기준`;
  }

  function getMetadataEntries(metadata) {
    if (!metadata || typeof metadata !== 'object') return null;
    const entries = Object.entries(metadata).filter(([, v]) => v != null && v !== '');
    return entries.length > 0 ? entries : null;
  }

  function parseAdmissionStats(stats) {
    if (!stats || typeof stats !== 'object') return null;
    const entries = Object.entries(stats)
      .map(([k, v]) => ({ label: `${k}학번`, count: Number(v) }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count);
    return entries.length > 0 ? entries : null;
  }

  function formatSemester(sem) {
  if (!sem) return '-';
  const map = {
    '1': '1학기',
    '2': '2학기',
    'summer': '하계 계절학기',
    'winter': '동계 계절학기',
  };
  return map[sem] || sem;
}

  function formatUpdatedAt(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm   = pad(d.getMonth() + 1);
    const dd   = pad(d.getDate());
    const hh   = pad(d.getHours());
    const min  = pad(d.getMinutes());
    const ss   = pad(d.getSeconds());
    return `${yyyy}.${mm}.${dd}. ${hh}:${min}:${ss}`;
  }

  const curriculumYear  = parseCurriculumYear(course.curriculum_ver);
  const curriculumLabel = formatCurriculumLabel(course.curriculum_ver);
  const metadataEntries = getMetadataEntries(course.metadata);
  const admissionStats  = parseAdmissionStats(course.admission_stats);
  const totalCount      = admissionStats ? admissionStats.reduce((s, e) => s + e.count, 0) : 0;
  const maxCount        = admissionStats ? admissionStats[0].count : 1;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-box detail-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="detail-modal-title">
            <button className="btn-back" onClick={onClose}>← 목록</button>
            <h4>{course.lecture_name}</h4>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX size={18}/>
          </button>
        </div>

        {/* 네모 박스 — 4가지 */}
        <div className="detail-info-grid">

          <div className="detail-info-item">
            <span className="detail-label">최근 마지막 이수년도</span>
            <span className="detail-value">
              {hasLastCompleted ? `${course.last_completed_year}년` : '-'}
            </span>
          </div>

          <div className="detail-info-item">
            <span className="detail-label">최근 마지막 이수학기</span>
            <span className="detail-value">
              {hasLastCompleted ? formatSemester(course.last_completed_semester) : '-'}
            </span>
          </div>

          {/* 3번 칸 — curriculum: 요람 버전 / verified: 데이터 갱신일 */}
          <div className="detail-info-item">
            {isVerified ? (
              <>
                <span className="detail-label">데이터 갱신일</span>
                <span className="detail-value">{formatUpdatedAt(course.updated_at)}</span>
              </>
            ) : (
              <>
                <span className="detail-label">데이터 갱신일</span>
                <span className="detail-value">{formatUpdatedAt(course.updated_at)}</span>
              </>
            )}
          </div>

          <div className="detail-info-item">
            <span className="detail-label">신뢰도 점수</span>
            {metadataEntries ? (
              <ul className="detail-meta-inline">
                {metadataEntries.map(([k, v]) => (
                  <li key={k}>· {isNaN(k) ? `${k}: ${v}` : String(v)}</li>
                ))}
              </ul>
            ) : (
              <span className="detail-value detail-notice-sub">없음</span>
            )}
          </div>

        </div>

        {/* 학번별 이수 통계 */}
        {admissionStats ? (
          <div className="detail-stats-box">
            <div className="detail-stats-header">
              <FiUsers size={12} className="detail-notice-icon"/>
              <span className="detail-stats-title">학번별 이수 현황</span>
              <span className="detail-stats-total">총 {totalCount}건</span>
            </div>
            <ul className="detail-stats-list">
              {admissionStats.map(({ label, count }) => (
                <li key={label} className="detail-stats-row">
                  <span className="detail-stats-label">{label}</span>
                  <div className="detail-stats-bar-wrap">
                    <div
                      className="detail-stats-bar"
                      style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="detail-stats-count">{count}건</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="detail-stats-box detail-stats-empty">
            <FiUsers size={12} className="detail-notice-icon"/>
            <span>아직 학번별 이수 데이터가 없어요</span>
          </div>
        )}

        {/* 하단 안내 문구 */}
        <div className="detail-info-notice">
          <div className="detail-notice-row">
            <FiCalendar size={12} className="detail-notice-icon"/>
            <span>
              {hasLastCompleted
                ? `서비스 이용자 중 최근 ${course.last_completed_year}년 ${formatSemester(course.last_completed_semester)}에 이수한 학생이 있어요`
                : '아직 서비스 이용자의 이수 정보가 없어요'}
            </span>
          </div>

          {/* standard_type별 안내 문구 */}
          {isVerified ? (
            <div className="detail-notice-row">
              <FiBookOpen size={12} className="detail-notice-icon"/>
              <span>실제 이수 데이터를 기반으로 시스템이 검증한 과목이에요.</span>
            </div>
          ) : (
            curriculumLabel && (
              <div className="detail-notice-row">
                <FiBookOpen size={12} className="detail-notice-icon"/>
                <span>학번별 이수 현황은 참고용으로만 활용해주세요.</span>
              </div>
            )
          )}
        </div>

        <button className="btn-save detail-add-btn" onClick={() => onAdd(course)}>
          {addBtnLabel || '이 과목 추가하기'}
        </button>

      </div>
    </div>
  );
}
