import client from './client';

// 카카오 로그인 URL 받아오기
export const getKakaoLoginUrl = () =>
  client.get('/api/v1/auth/kakao/login');

// 토큰 재발급
export const refreshToken = (refresh_token) =>
  client.post('/api/v1/auth/refresh', { refresh_token });

// 로그아웃
export const logout = () =>
  client.post('/api/v1/auth/logout');