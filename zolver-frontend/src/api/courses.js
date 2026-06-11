import client from './client';

// 내 과목 전체 조회
export const getMyCourses = () =>
  client.get('/api/v1/courses/me');

// 검증된 과목 검색
export const getVerifiedCourses = (keyword = '') =>
  client.get('/api/v1/courses/verified', { params: { keyword } });

// 과목 수동 추가
export const addCourse = (data) =>
  client.post('/api/v1/courses/me', data);

// 과목 수정
export const updateCourse = (lectureId, data) =>
  client.put(`/api/v1/courses/me/${lectureId}`, data);

// 과목 삭제
export const deleteCourse = (lectureId) =>
  client.delete(`/api/v1/courses/me/${lectureId}`);

// 성적표 업로드
export const uploadTranscript = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/api/v1/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};