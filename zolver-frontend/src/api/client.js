//   - axios = fetch보다 편한 HTTP 요청 라이브러리

import axios from 'axios';
const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// ── axios 인스턴스 생성
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초 안에 응답 없으면 에러
  headers: {
    'Content-Type': 'application/json',
  },
});


// ── 요청 인터셉터: 모든 요청에 access_token 자동 첨부
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// ── 응답 인터셉터: 401 에러 시 토큰 재발급 후 재시도
// 401 = "인증 실패" (토큰 만료 or 없음)
let isRefreshing = false; // 재발급 중복 방지 플래그
let failedQueue = [];     // 재발급 대기 중인 요청들

// 대기 중인 요청들을 한번에 처리하는 함수
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response, // 성공이면 그냥 통과

  async (error) => {
    const originalRequest = error.config;

    // 401이고 아직 재시도 안 한 요청이면
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 재발급 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true; // 재시도 표시
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('refresh_token 없음');

        // 토큰 재발급 요청
        const res = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = res.data.access_token;
        localStorage.setItem('access_token', newAccessToken);

        // 대기 중이던 요청들 모두 재시도
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);

      } catch (refreshError) {
        // 재발급도 실패 → 로그아웃 처리
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;