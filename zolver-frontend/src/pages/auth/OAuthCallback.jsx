import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OAuthCallback.css';
import client from '../../api/client';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    handleCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCallback = async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    // 백엔드가 에러 반환한 경우
    if (error) {
      navigate('/', { replace: true });
      return;
    }

    // 백엔드가 토큰을 쿼리스트링으로 넘겨주는 경우
    if (accessToken && refreshToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      redirectByStatus();
      return;
    }

    // 백엔드가 code를 다시 넘겨주는 경우
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const res = await client.get(
        `/api/v1/auth/kakao/callback?code=${code}`
      );

      const data = res.data;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      redirectByStatus(data.status);

    } catch (err) {
      console.error('[OAuthCallback] 실패:', err);
      setStatus('error');
      setErrorMsg('로그인 중 오류가 발생했습니다.');
    }
  };

  const redirectByStatus = (status) => {
  if (status === 'guest') {  
    console.log('guest → /welcome');
    window.location.href = '/welcome';
  } else {
    console.log('member → 홈');
    window.location.href = '/';
  }
};

  if (status === 'error') {
    return (
      <div className="oauth-page">
        <div className="oauth-card">
          <div className="oauth-error-icon">⚠️</div>
          <h2 className="oauth-error-title">로그인에 실패했습니다</h2>
          <p className="oauth-error-desc">{errorMsg}</p>
          <button className="zol-btn zol-btn-primary" onClick={() => navigate('/login')}>
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-page">
      <div className="oauth-card">
        <div className="oauth-spinner" />
        <p className="oauth-loading-text">로그인 처리 중...</p>
      </div>
    </div>
  );
}