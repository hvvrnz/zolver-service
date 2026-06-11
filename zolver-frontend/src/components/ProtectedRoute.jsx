// src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children, allowGuest = false }) {  // ✅ allowGuest 추가
  const location = useLocation();
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    isGuest: false
  });
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  async function checkAuth() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.log('❌ 토큰 없음 → 로그인');
      setAuthState({ isChecking: false, isAuthenticated: false, isGuest: false });
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/users/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'guest') {
          console.log('👤 Guest 유저');
          setAuthState({ isChecking: false, isAuthenticated: true, isGuest: true });
        } else {
          console.log('✅ Member 유저');
          setAuthState({ isChecking: false, isAuthenticated: true, isGuest: false });
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuthState({ isChecking: false, isAuthenticated: false, isGuest: false });
      }
      
    } catch (error) {
      console.error('❌ 네트워크 에러:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAuthState({ isChecking: false, isAuthenticated: false, isGuest: false });
    }
  }
  
  if (authState.isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        로딩 중...
      </div>
    );
  }
  
  // ✅ 토큰 없으면 로그인
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // ✅ Guest이고 allowGuest가 false면 Welcome으로
  if (authState.isGuest && !allowGuest) {
    return <Navigate to="/welcome" replace />;
  }
  
  // ✅ 나머지는 통과
  return children;
}