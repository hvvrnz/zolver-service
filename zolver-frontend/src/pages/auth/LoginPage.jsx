import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import loginLogo from '../../assets/loginlogo.png';
import { getKakaoLoginUrl } from '../../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const res = await getKakaoLoginUrl();
      window.location.href = res.data.url;
    } catch (err) {
      console.error('카카오 로그인 URL 요청 실패:', err);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card zol-animate-fade-up">

        <div className="login-hero">
          <img src={loginLogo} alt="Zolver" className="login-logo-img" />
          <h1 className="login-guide-title">카카오로 3초만에 로그인</h1>
          <p className="login-guide-desc">
            성적표 하나로 나의 졸업 현황을<br />
            한눈에 확인할 수 있어요.🎓
          </p>
        </div>

        <div className="login-divider" />

        <button
          className="kakao-login-btn"
          onClick={handleKakaoLogin}
          disabled={loading}
          aria-label="카카오 계정으로 로그인"
        >
          {loading ? (
            <span className="kakao-loading" />
          ) : (
            <svg className="kakao-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.7 1.7 5.07 4.27 6.44-.19.69-.69 2.51-.78 2.89-.12.5.18.49.37.36.15-.1 2.37-1.6 3.32-2.25.6.09 1.22.13 1.82.13 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
            </svg>
          )}
          {loading ? '연결 중...' : '카카오로 로그인'}
        </button>

        <p className="login-notice">
          로그인 시{' '}
          <button className="login-text-link" onClick={() => window.location.href = '/terms'}>
            이용약관
          </button>
          {' '}및{' '}
          <button className="login-text-link" onClick={() => window.location.href = '/privacy'}>
            개인정보 처리방침
          </button>
          에 동의한 것으로 간주됩니다. <br/> 스크롤하여 하단의 약관을 확인하여주세요.
        </p>

      </div>

      <p className="login-tagline zol-animate-fade-up zol-delay-1">
        건국대학교 학생을 위한 신뢰도 기반 졸업 가이드
      </p>
    </div>
  );
}