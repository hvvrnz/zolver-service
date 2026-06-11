import { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import './CourseRecordPage.css';

import {
  getMyCourses, getVerifiedCourses,
  addCourse, updateCourse, deleteCourse, uploadTranscript,
} from '../../api/courses';
import { getTags } from '../../api/tags';
import { ERROR_MESSAGES, EMPTY_FORM, FORCE_INVALID } from '../../utils/constants';

import RecordHeader      from '../../components/RecordHeader';
import Statistics        from '../../components/Statistics';
import UserCourseList    from '../../components/UserCourseList';
import AddCourseModal    from '../../components/modals/AddCourseModal';
import EditCourseModal   from '../../components/modals/EditCourseModal';
import SearchCourseModal from '../../components/modals/SearchCourseModal';
import CourseDetailModal from '../../components/modals/CourseDetailModal';

export default function CourseRecordPage() {
  const [courses, setCourses] = useState([]);
  const [tags, setTags]       = useState({ major: [], general: [], etc: [], general_groups: [] });
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  // 수기 추가 모달
  const [showForm, setShowForm]   = useState(false);
  const [formYear, setFormYear]   = useState(null);
  const [formSem, setFormSem]     = useState(null);
  const [selectedCourseForAdd, setSelectedCourseForAdd] = useState(null);

  // 검색 모달
  const [showAddSearch, setShowAddSearch]       = useState(false);
  const [addSearchQuery, setAddSearchQuery]     = useState('');
  const [addSearchResults, setAddSearchResults] = useState([]);
  const [addSearchLoading, setAddSearchLoading] = useState(false);
  const [addCategoryFilter, setAddCategoryFilter] = useState('all');
  const [addBadgeFilter, setAddBadgeFilter]     = useState('all');
  const [searchSaving, setSearchSaving]         = useState(false); // 검색 즉시 저장 로딩
  const [detailCourse, setDetailCourse]         = useState(null);

  // 수정 모달
  const [editCourse, setEditCourse]   = useState(null);
  const [editForm, setEditForm]       = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [courseRes, tagRes] = await Promise.all([getMyCourses(), getTags()]);
      setCourses(courseRes.data.courses || []);
      const { general_groups, ...tagData } = tagRes.data;
      setTags({ ...tagData, general_groups: general_groups || [] });
    } catch (err) {
      console.error('조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // 성적표 업로드
  const handleUpload = async (file) => {
    if (!file.name.endsWith('.xlsx')) { alert('xlsx 파일만 업로드 가능합니다!'); return; }
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await uploadTranscript(file);
      if (res.data?.access_token) {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
      }
      setUploadMsg({ type: 'success', text: '업로드 완료! 과목이 추가됐어요.' });
      await fetchAll();
    } catch (err) {
      const raw  = err.response?.data?.detail || '';
      let text   = '업로드 실패. 다시 시도해주세요.';
      if (raw.startsWith('VALIDATION_FAILED:')) {
        const codes = raw.replace('VALIDATION_FAILED:', '').split(',');
        text = ERROR_MESSAGES[codes[0]] || `검증 실패 (${codes[0]})`;
      } else {
        text = ERROR_MESSAGES[raw] || raw || text;
      }
      setUploadMsg({ type: 'error', text });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(null), 6000);
    }
  };

  // 수기 추가 모달 열기
  const handleOpenAddModal = (year, semester) => {
    setFormYear(Number(year));
    setFormSem(semester);
    setSelectedCourseForAdd(null);
    setShowForm(true);
  };

  const closeAddForm = () => {
    setShowForm(false);
    setFormYear(null);
    setFormSem(null);
    setSelectedCourseForAdd(null);
  };

  // 수기 추가 저장
  const handleAddSave = async (formData) => {
    try {
      await addCourse(formData);
      await fetchAll();
      closeAddForm();
    } catch (err) {
      console.error('과목 직접 추가 실패:', err);
      // 에러를 다시 throw해서 모달 안의 catch에서 alert 보여줌
      throw err;
    }
  };

  // 검색 모달 열기 — 열리자마자 기본 과목 목록 로드
  const handleOpenSearchModal = async (year, semester) => {
    setFormYear(Number(year));
    setFormSem(semester);
    setAddBadgeFilter('all');
    setAddCategoryFilter('all');
    setAddSearchQuery('');
    setAddSearchResults([]);
    // 검색어 없이 전체 목록 미리 로드
    setAddSearchLoading(true);
    try {
      const res = await getVerifiedCourses('');
      setAddSearchResults(res.data.courses || []);
    } catch (err) {
      setAddSearchResults([]);
    } finally {
      setAddSearchLoading(false);
    }
    setShowAddSearch(true);  // ✅ 데이터 다 준비된 후 모달 오픈
  };

  const closeAddSearch = () => {
    setShowAddSearch(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
    setAddCategoryFilter('all');
    setAddBadgeFilter('all');
  };

  // 검색어 입력 — 빈 문자열이면 전체 목록 유지
  const handleAddSearch = async (keyword) => {
    setAddSearchQuery(keyword);
    setAddSearchLoading(true);
    try {
      const res = await getVerifiedCourses(keyword);
      setAddSearchResults(res.data.courses || []);
    } catch (err) {
      if (err.response?.status === 403) setAddSearchResults([]);
    } finally {
      setAddSearchLoading(false);
    }
  };

  // ✅ 검색 결과에서 과목 선택 → 확인 없이 바로 DB 저장
  // lecture_master의 데이터를 그대로 addCourse 형식으로 변환해서 전송
  const handleDirectSave = async (course) => {
    setSearchSaving(true);
    try {
      await addCourse({
        lecture_name:        course.lecture_name,
        lecture_credit:      course.credits || course.lecture_credit || 3,
        system_category:     course.system_category,
        lecture_code:        course.lecture_code    || 'MANUAL',
        lecture_category:    course.category_type   || '',
        area:           course.area            || '',
        completion_year:     formYear,
        completion_semester: formSem,
        course_grade:        '',
        delete_type:         null,
      });
      await fetchAll();
      closeAddSearch();
      setUploadMsg({ type: 'success', text: `'${course.lecture_name}' 과목이 추가됐어요.` });
      setTimeout(() => setUploadMsg(null), 4000);
    } catch (err) {
      console.error('검색 과목 추가 실패:', err);
      alert(`과목 추가 실패: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSearchSaving(false);
    }
  };

  // 카테고리 변경
  const handleCategoryChange = async (lectureId, newCategory) => {
    try {
      await updateCourse(lectureId, { system_category: newCategory });
      setCourses(prev => prev.map(c =>
        c.evidence_lec_id === lectureId ? { ...c, system_category: newCategory } : c
      ));
    } catch (err) { console.error('카테고리 변경 실패:', err); }
  };

  // 과목 삭제
  const handleDelete = async (lectureId) => {
    if (!window.confirm('과목을 삭제할까요?')) return;
    try {
      await deleteCourse(lectureId);
      setCourses(prev => prev.filter(c => c.evidence_lec_id !== lectureId));
    } catch (err) {
      console.error('삭제 실패:', err);
      alert(`삭제 실패: ${err.response?.data?.detail || err.message}`);
    }
  };

  // 수정 모달 열기
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
      area:           course.area || '',
      delete_type:         course.delete_type        || null,
    });
  };

  const handleEditFormChange = (field, value) => {
    if (field === 'course_grade') {
      const forceInvalid = FORCE_INVALID.includes(value.toUpperCase());
      setEditForm(prev => ({ ...prev, course_grade: value, delete_type: forceInvalid ? '취득학점포기' : prev.delete_type }));
    } else if (field === 'system_category') {
      setEditForm(prev => ({ ...prev, system_category: value, area: '' }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // 수정 저장
  const handleEditSave = async () => {
    if (!editForm.lecture_name) return alert('과목명을 입력해주세요.');
    setEditLoading(true);
    try {
      await updateCourse(editCourse.evidence_lec_id, { ...editForm, delete_type: editForm.delete_type || null });
      await fetchAll();
      setEditCourse(null);
    } catch (err) {
      console.error('수정 실패:', err);
      alert(`수정 실패: ${err.response?.data?.detail || err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  // 데이터 가공
  // manualSemesters: 사용자가 직접 추가한 빈 학기 목록
  const [manualSemesters, setManualSemesters] = useState([]);

  const grouped = courses.reduce((acc, c) => {
    const year = c.completion_year     || '미정';
    const sem  = c.completion_semester || '-';
    if (!acc[year])      acc[year] = {};
    if (!acc[year][sem]) acc[year][sem] = [];
    acc[year][sem].push(c);
    return acc;
  }, {});

  // 수동 추가 학기도 grouped에 포함
  manualSemesters.forEach(({ year, semester }) => {
    if (!grouped[year])            grouped[year] = {};
    if (!grouped[year][semester])  grouped[year][semester] = [];
  });

  const allYears    = [...new Set([
    ...courses.map(c => c.completion_year || '미정'),
    ...manualSemesters.map(s => s.year),
  ])].sort((a, b) => b - a);

  const years     = allYears;
  const hasUploaded = courses.length > 0;

  const handleAddSemester = (year, semester) => {
    const exists = grouped[year]?.[semester] !== undefined;
    if (exists) return;
    setManualSemesters(prev => [...prev, { year, semester }]);
  };

  const handleRemoveSemester = (year, semester) => {
    setManualSemesters(prev =>
      prev.filter(s => !(String(s.year) === String(year) && s.semester === semester))
    );
  };

  const addFilteredResults = addSearchResults.filter(c => {
    const catMatch   = addCategoryFilter === 'all' || c.system_category === addCategoryFilter;
    const badgeMatch = addBadgeFilter === 'all'
      || (addBadgeFilter === 'curriculum' && c.standard_type === 'curriculum')
      || (addBadgeFilter === 'verified'   && c.standard_type === 'verified');
    return catMatch && badgeMatch;
  });

  return (
    <div className="record-page">
      <RecordHeader onUpload={handleUpload} uploading={uploading}/>

      {uploadMsg && (
        <div className={`upload-msg-bar ${uploadMsg.type}`}>
          {uploadMsg.type === 'success'
            ? <><FiCheck size={15}/> {uploadMsg.text}</>
            : <><FiAlertCircle size={15}/> {uploadMsg.text}</>}
        </div>
      )}

      <Statistics courses={courses}/>

      <UserCourseList
        courses={courses}
        loading={loading}
        grouped={grouped}
        years={years}
        tags={tags}
        onCategoryChange={handleCategoryChange}
        onEdit={handleEditOpen}
        onDelete={handleDelete}
        onAddCourse={handleOpenAddModal}
        onSearchCourse={handleOpenSearchModal}
        onAddSemester={handleAddSemester}
        onRemoveSemester={handleRemoveSemester}
        manualSemesters={manualSemesters}
      />

      {/* 수기 추가 모달 */}
      <AddCourseModal
        isOpen={showForm}
        onClose={closeAddForm}
        onSave={handleAddSave}
        formYear={formYear}
        formSem={formSem}
        tags={tags}
        selectedCourse={selectedCourseForAdd}
      />

      {/* 수정 모달 */}
      <EditCourseModal
        isOpen={!!editCourse}
        course={editCourse}
        formData={editForm}
        onFormChange={handleEditFormChange}
        onClose={() => setEditCourse(null)}
        onSave={handleEditSave}
        loading={editLoading}
        tags={tags}
      />

      {/* 검색 모달 - onDirectSave로 바로 저장 */}
      <SearchCourseModal
        isOpen={showAddSearch}
        onClose={closeAddSearch}
        onDirectSave={handleDirectSave}   // ✅ 바로 저장
        onSelect={null}                   // 이제 사용 안 함
        formYear={formYear}
        formSem={formSem}
        hasUploaded={hasUploaded}
        searchQuery={addSearchQuery}
        onSearchChange={handleAddSearch}
        searchResults={addFilteredResults}
        searchLoading={addSearchLoading}
        categoryFilter={addCategoryFilter}
        onCategoryChange={setAddCategoryFilter}
        badgeFilter={addBadgeFilter}
        onBadgeChange={setAddBadgeFilter}
        onDetailClick={setDetailCourse}
        saving={searchSaving}
      />

      {/* 상세 모달 */}
      <CourseDetailModal
        isOpen={!!detailCourse}
        course={detailCourse}
        onClose={() => setDetailCourse(null)}
        onAdd={handleDirectSave}          // 상세에서 추가해도 바로 저장
      />
    </div>
  );
}
