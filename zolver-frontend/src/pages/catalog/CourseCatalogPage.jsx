import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiInfo, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { MdAdminPanelSettings, MdVerified } from 'react-icons/md';
import { getVerifiedCourses } from '../../api/courses';
import { SYS_CATEGORY_OPTIONS, BADGE_OPTIONS } from '../../utils/constants';
import CourseDetailModal from '../../components/modals/CourseDetailModal';
import './CourseCatalogPage.css';

const SORT_OPTIONS = [
  { key: 'lecture_name',    label: '과목명' },
  { key: 'last_completed',  label: '최근 이수' },
  { key: 'popular',         label: '이수 많은 순' },
];

const SEM_ORDER = { '2학기': 4, '1학기': 3, 'winter': 2, 'summer': 1 };

export default function CourseCatalogPage() {
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [badgeFilter, setBadgeFilter]       = useState('all');
  const [creditFilter, setCreditFilter]     = useState('all');
  const [sortKey, setSortKey]               = useState('last_completed');
  const [sortDir, setSortDir]               = useState('desc');
  const [detailCourse, setDetailCourse]     = useState(null);
  const [page, setPage]                     = useState(1);
  const PAGE_SIZE = 20;

  const fetchCourses = useCallback(async (keyword = '') => {
    setLoading(true);
    try {
      const res = await getVerifiedCourses(keyword);
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('과목 조회 실패:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(''); }, [fetchCourses]);

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => fetchCourses(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchCourses]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // 검색/필터 변경시 페이지 초기화
  useEffect(() => { setPage(1); }, [searchQuery, categoryFilter, badgeFilter, creditFilter]);

  const CREDIT_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: '1',   label: '1학점' },
    { value: '2',   label: '2학점' },
    { value: '3',   label: '3학점' },
    { value: '4+',  label: '4학점 이상' },
  ];

  const filtered = courses
    .filter(c => {
      const catMatch = categoryFilter === 'all' || c.system_category === categoryFilter;
      const badgeMatch = badgeFilter === 'all'
        || (badgeFilter === 'curriculum' && c.standard_type === 'curriculum')
        || (badgeFilter === 'verified'   && c.standard_type === 'verified');
      const cr = Number(c.credits || c.lecture_credit || 0);
      const creditMatch = creditFilter === 'all'
        || (creditFilter === '4+' && cr >= 4)
        || String(cr) === creditFilter;
      return catMatch && badgeMatch && creditMatch;
    })
    .sort((a, b) => {
      if (sortKey === 'last_completed') {
        const ay = a.last_completed_year || 0, by = b.last_completed_year || 0;
        if (ay !== by) return sortDir === 'desc' ? by - ay : ay - by;
        const as = SEM_ORDER[a.last_completed_semester] || 0;
        const bs = SEM_ORDER[b.last_completed_semester] || 0;
        return sortDir === 'desc' ? bs - as : as - bs;
      }
      if (sortKey === 'popular') {
        const sum = c => c.admission_stats
          ? Object.values(c.admission_stats).reduce((s, v) => s + Number(v), 0) : 0;
        const av = sum(a), bv = sum(b);
        return sortDir === 'desc' ? bv - av : av - bv;
      }
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'credits') { av = Number(av); bv = Number(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  function formatSemester(sem) {
    if (!sem) return '-';
    const map = { '1': '1학기', '2': '2학기', 'summer': '하계계절', 'winter': '동계계절' };
    return map[sem] || sem;
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <span className="catalog-sort-icon neutral">↕</span>;
    return <span className="catalog-sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  function renderBadge(course) {
    if (course.standard_type === 'verified')
      return <span className="badge badge-verified"><MdVerified size={11}/> 시스템 검증완료</span>;
    if (course.standard_type === 'curriculum')
      return <span className="badge badge-curriculum"><MdAdminPanelSettings size={11}/> 관리자 등록</span>;
    return null;
  }

  const catLabel = (val) => SYS_CATEGORY_OPTIONS.find(o => o.value === val)?.label ?? val;

  return (
    <div className="catalog-page">

      <div className="catalog-header">
        <div>
          <h1 className="catalog-title">과목 모아보기</h1>
          <p className="catalog-subtitle">관리자가 등록한 과목과 실제 이수 이력 기반의 신뢰도 알고리즘을 통해 시스템이 검증한 과목도 함께 확인할 수 있어요.</p>
        </div>
        <span className="catalog-total">{filtered.length}개 과목</span>
      </div>

      {/* 검색 + 필터 */}
      <div className="catalog-toolbar">
        <div className="catalog-search-row">
          <div className="catalog-search-bar">
            <FiSearch size={14}/>
            <input
              placeholder="과목명으로 검색하세요"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="catalog-sort-select"
            value={sortKey}
            onChange={e => { setSortKey(e.target.value); setSortDir('desc'); }}>
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="catalog-filters">
          <FiFilter size={12} style={{ flexShrink: 0, color: 'var(--color-text-disabled)' }}/>
          {SYS_CATEGORY_OPTIONS.map(o => (
            <button key={o.value}
              className={`filter-tab ${categoryFilter === o.value ? 'active' : ''}`}
              onClick={() => setCategoryFilter(o.value)}>
              {o.label}
            </button>
          ))}
          <span className="catalog-filter-divider"/>
          {CREDIT_OPTIONS.map(o => (
            <button key={o.value}
              className={`filter-tab ${creditFilter === o.value ? 'active' : ''}`}
              onClick={() => setCreditFilter(o.value)}>
              {o.label}
            </button>
          ))}
          <span className="catalog-filter-divider"/>
          {BADGE_OPTIONS.filter(o => o.value !== 'all').map(o => (
            <button key={o.value}
              className={`filter-tab ${badgeFilter === o.value ? `active ${o.value}` : ''}`}
              onClick={() => setBadgeFilter(badgeFilter === o.value ? 'all' : o.value)}>
              {o.value === 'curriculum' && <MdAdminPanelSettings size={11}/>}
              {o.value === 'verified'   && <MdVerified size={11}/>}
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="catalog-table-wrap">
        {loading ? (
          <div className="catalog-loading"><div className="loading-spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="catalog-empty">
            <FiSearch size={24}/>
            <p>검색 결과가 없어요</p>
          </div>
        ) : (
          <table className="catalog-table">
            <thead>
              <tr>
                <th className="col-name" onClick={() => handleSort('lecture_name')}>
                  과목명 <SortIcon k="lecture_name"/>
                </th>
                <th className="col-code">과목코드</th>
                <th className="col-cat" onClick={() => handleSort('system_category')}>
                  구분 <SortIcon k="system_category"/>
                </th>
                <th className="col-type">이수구분</th>
                <th className="col-credit" onClick={() => handleSort('credits')}>
                  학점 <SortIcon k="credits"/>
                </th>
                <th className="col-badge">검증</th>
                <th className="col-completed" onClick={() => handleSort('last_completed')} style={{cursor:'pointer'}}>
                  최근 이수 <SortIcon k="last_completed"/>
                </th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr key={i} onClick={() => setDetailCourse(c)} className="catalog-row">
                  <td className="col-name">
                    <span className="catalog-course-name">{c.lecture_name}</span>
                  </td>
                  <td className="col-code">
                    <span className="catalog-code">{c.lecture_code}</span>
                  </td>
                  <td className="col-cat">
                    <span className={`cat-badge ${c.system_category}`}>
                      {catLabel(c.system_category)}
                    </span>
                  </td>
                  <td className="col-type">
                    <span className="catalog-type">{c.lecture_category || '-'}</span>
                  </td>
                  <td className="col-credit">
                    <span className="catalog-credit">{c.credits || c.lecture_credit}학점</span>
                  </td>
                  <td className="col-badge">{renderBadge(c)}</td>
                  <td className="col-completed">
                    <span className="catalog-completed">
                      {c.last_completed_year && c.last_completed_year !== 0
                        ? `${c.last_completed_year}년 ${formatSemester(c.last_completed_semester)}`
                        : '-'}
                    </span>
                  </td>
                  <td className="col-action">
                    <button className="btn-detail-sm" onClick={e => { e.stopPropagation(); setDetailCourse(c); }}>
                      <FiInfo size={13}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="catalog-pagination">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) => p === '...'
              ? <span key={i} className="page-ellipsis">...</span>
              : <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      )}

      <CourseDetailModal
        isOpen={!!detailCourse}
        course={detailCourse}
        onClose={() => setDetailCourse(null)}
        onAdd={() => setDetailCourse(null)}
        addBtnLabel="닫기"
      />
    </div>
  );
}
