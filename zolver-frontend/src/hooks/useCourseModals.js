import { useState } from 'react';
import { EMPTY_FORM, FORCE_INVALID } from '../utils/constants';

export function useCourseModals() {

  const [showForm, setShowForm] = useState(false);
  const [formYear, setFormYear] = useState(null);
  const [formSem, setFormSem] = useState(null);
  const [selectedCourseForAdd, setSelectedCourseForAdd] = useState(null);

  const [editCourse, setEditCourse] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [showAddSearch, setShowAddSearch] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState([]);
  const [addSearchLoading, setAddSearchLoading] = useState(false);
  const [addCategoryFilter, setAddCategoryFilter] = useState('all');
  const [addBadgeFilter, setAddBadgeFilter] = useState('all');
  const [detailCourse, setDetailCourse] = useState(null);

  // 핸들러 함수 
  
  // 검색 창 열기
  const handleOpenSearchModal = (year, semester) => {
    setFormYear(Number(year));
    setFormSem(semester);
    setShowAddSearch(true);
  };

  // 수동 과목 추가 창 열기 담당
  const handleOpenAddModal = (year, semester) => {
    setFormYear(Number(year));
    setFormSem(semester);
    setSelectedCourseForAdd(null);
    setShowForm(true);
  };

  // 직접 추가 창 닫기
  const closeAddForm = () => {
    setShowForm(false);
    setFormYear(null);
    setFormSem(null);
    setSelectedCourseForAdd(null);
  };

  // 검색 창 닫기
  const closeAddSearch = () => {
    setShowAddSearch(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
    setAddCategoryFilter('all');
    setAddBadgeFilter('all');
  };

  // 검색 목록에서 과목 하나를 콕 집어 선택했을 때 연동 담당
  const handleAddSearchSelect = (course) => {
    setSelectedCourseForAdd(course);
    setShowAddSearch(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
    setAddCategoryFilter('all');
    setAddBadgeFilter('all');
    setShowForm(true); // 검색창 닫으면서 자동으로 입력 폼 창 열기
  };

  // 수정 창 열기
  const handleEditOpen = (course) => {
    setEditCourse(course);
    setEditForm({
      lecture_name: course.lecture_name,
      lecture_credit: course.lecture_credit,
      system_category: course.system_category,
      lecture_category: course.lecture_category || '',
      lecture_code: course.lecture_code || 'MANUAL',
      completion_year: course.completion_year,
      completion_semester: course.completion_semester,
      course_grade: course.course_grade || '',
      area: course.area || '',
      delete_type: course.delete_type || null,
    });
  };

  // 수정 창에서 사용자가 키보드 칠 때 실시간 폼 데이터 매핑 
  const handleEditFormChange = (field, value) => {
    if (field === 'course_grade') {
      const forceInvalid = FORCE_INVALID.includes(value.toUpperCase());
      setEditForm(prev => ({
        ...prev,
        course_grade: value,
        delete_type: forceInvalid ? '취득학점포기' : prev.delete_type,
      }));
    } else if (field === 'system_category') {
      setEditForm(prev => ({ ...prev, system_category: value, area: '' }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // 메인 컴포넌트가 가져다 쓸 내용 패키징 포장
  return {
    // 상태 변수들
    showForm, formYear, formSem, selectedCourseForAdd,
    editCourse, editForm, editLoading, setEditLoading, setEditCourse,
    showAddSearch, addSearchQuery, setAddSearchQuery, addSearchResults, setAddSearchResults,
    addSearchLoading, setAddSearchLoading, addCategoryFilter, setAddCategoryFilter,
    addBadgeFilter, setAddBadgeFilter, detailCourse, setDetailCourse,
    
    // 조립 완료된 통합 핸들러 함수들
    handleOpenSearchModal,
    handleOpenAddModal,
    closeAddForm,
    closeAddSearch,
    handleAddSearchSelect,
    handleEditOpen,
    handleEditFormChange
  };
}