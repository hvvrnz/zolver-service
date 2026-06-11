import client from './client';
 
// 내 정보 조회
export const getMyInfo = () =>
  client.get('/api/v1/users/me');
 
// 이름 변경
export const updateMyName = (data) =>
  client.patch('/api/v1/users/me/name', data);
 
// 졸업 목표 학점 수정
export const updateMyCredits = (data) =>
  client.patch('/api/v1/users/me/credits', data);
 
// 회원 탈퇴
export const deleteMyAccount = () =>
  client.delete('/api/v1/users/me');

// GPA 목표 설정
export const updateGpaTargets = (data) =>
  client.patch('/api/v1/users/me/gpa-targets', data);