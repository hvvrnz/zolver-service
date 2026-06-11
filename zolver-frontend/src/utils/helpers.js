import { INVALID_GRADES } from "./constants";

// 성적이 무효한지 체크
/**
 * @param {Object} course - 강의 정보 객체
 * @returns {boolean} - 무효면 true
 */

export function isInvalidCourse(course) {
     // F, N, NP 성적이거나 취득포기한 과목
    return INVALID_GRADES.includes(course.course_grade) || course.delete_type !== null;
}

/**
 * 전체 학점 계산
 * @param {Array} courses - 과목 목록
 * @returns {number} - 총 학점
 */
export function calculateTotalCredits(courses) {
  // 유효한 과목들만 필터링
  const validCourses = courses.filter(c => !isInvalidCourse(c));
  
  // reduce = 배열을 하나의 값으로 줄임
  // (누적값, 현재값) => 새로운 누적값
  return validCourses.reduce((sum, course) => {
    return sum + (course.lecture_credit || 0);
  }, 0); // 0부터 시작
}

/**
 * 카테고리별 학점 계산
 * @param {Array} courses - 과목 목록
 * @param {string} category - 'major', 'general', 'etc'
 * @returns {number} - 해당 카테고리 학점
 */
export function calculateCreditsByCategory(courses, category) {
  const validCourses = courses.filter(c => !isInvalidCourse(c));
  
  // 해당 카테고리만 필터 → 학점 합산
  return validCourses
    .filter(c => c.system_category === category)
    .reduce((sum, c) => sum + (c.lecture_credit || 0), 0);
}

/**
 * 년도/학기별로 그룹핑
 * @param {Array} courses - 과목 목록
 * @returns {Object} - { "2024": { "1학기": [...], "2학기": [...] } }
 */
export function groupCoursesByYearAndSemester(courses) {
  return courses.reduce((acc, course) => {
    const year = course.completion_year || '미정';
    const sem = course.completion_semester || '-';
    
    // 년도 키가 없으면 생성
    if (!acc[year]) acc[year] = {};
    // 학기 키가 없으면 빈 배열 생성
    if (!acc[year][sem]) acc[year][sem] = [];
    
    // 과목 추가
    acc[year][sem].push(course);
    return acc;
  }, {});
}
