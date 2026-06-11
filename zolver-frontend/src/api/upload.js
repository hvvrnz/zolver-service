import client from './client';

// 성적표 업로드
export const uploadTranscript = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return client.post('/api/v1/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};