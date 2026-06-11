import client from './client';

// 수기 요람
export const getCurriculum  = ()       => client.get('/api/v1/curriculum');
export const saveCurriculum = (content) => client.post('/api/v1/curriculum', { content });

// 공지사항
export const getNotices = () => client.get('/api/v1/notices');