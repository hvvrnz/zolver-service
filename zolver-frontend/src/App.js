// src/App.js - 전체 교체

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';  
import './App.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/welcome/WelcomePage';

import { 
  NotFoundPage,
  ServerErrorPage,
  ServiceUnavailablePage 
} from './pages/error/ErrorPage';

import LandingPage      from './pages/home/LandingPage';
import LoginPage        from './pages/auth/LoginPage';
import OAuthCallback    from './pages/auth/OAuthCallback';
import HomePage         from './pages/home/HomePage';
import CourseRecordPage from './pages/record/CourseRecordPage';
import CourseCatalogPage from './pages/catalog/CourseCatalogPage';
import LiberalYoramPage from './pages/organze/LiberalYoramPage';
import MajorYoramPage   from './pages/organze/MajorYoramPage';
import EtcYoramPage     from './pages/organze/EtcYoramPage';
import TagPage          from './pages/tags/TagPage';
import SimulationPage   from './pages/simulation/SimulationPage';
import GuidePage        from './pages/guide/GuidePage';
import ReportPage       from './pages/support/ReportPage';
import TermsPage        from './pages/policy/TermsPage';
import PrivacyPage      from './pages/policy/PrivacyPage';
import FAQPage          from './pages/support/FAQPage';
import GpaPage from './pages/gpa/GpaPage';

const HIDE_HEADER_PATHS = new Set(['/login', '/landing', '/auth/callback']);
const HIDE_FOOTER_PATHS = new Set(['/landing', '/auth/callback']);

const VALID_PATHS = [
  '/',
  '/landing',
  '/login',
  '/auth/callback',
  '/terms',
  '/privacy',
  '/record/courserecord',
  '/organize/liberal',
  '/organize/major',
  '/organize/etc',
  '/tags',
  '/simulation',
  '/guide',
  '/support/report',
  '/faq',
  '/welcome',
  '/catalog',
  '/gpa'
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const { pathname } = location;

  // ✅ Hook들을 early return 전에 먼저 선언
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      console.log('🚨 에러 이벤트 받음:', event.detail.type);
      setErrorState(event.detail.type);
    };
    
    window.addEventListener('showError', handleError);
    
    return () => {
      window.removeEventListener('showError', handleError);
    };
  }, []);

  const isMaintenance = process.env.REACT_APP_MAINTENANCE === 'true';
  if (isMaintenance) {
    return <ServiceUnavailablePage />;
  }

  const is404Page = !VALID_PATHS.includes(pathname);
  const isErrorPage = errorState !== null || is404Page;
  
  const showHeader = !HIDE_HEADER_PATHS.has(pathname) && !isErrorPage;
  const showFooter = !HIDE_FOOTER_PATHS.has(pathname) && !isErrorPage;

  // 에러 페이지 렌더링 (URL은 그대로)
  if (errorState === '500') {
    return <ServerErrorPage />;
  }
  
  if (errorState === '503') {
    return <ServiceUnavailablePage />;
  }

  return (
    <div className="app-layout">
      {showHeader && <Header />}
      <main className="app-main">
        <Routes>
          {/* 로그인 불필요 */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/welcome" element={<WelcomePage />} />

          {/* Member만 (Guest 접근 불가) */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          
          {/* 로그인 필요 + guest, member 둘 다 가능 */}
          <Route 
            path="/record/courserecord" 
            element={
              <ProtectedRoute allowGuest={true}>
                <CourseRecordPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/gpa"
            element={
              <ProtectedRoute allowGuest={false}>
                <GpaPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/guide" 
            element={
              <ProtectedRoute allowGuest={true}>
                <GuidePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/support/report" 
            element={
              <ProtectedRoute allowGuest={true}>
                <ReportPage />
              </ProtectedRoute>
            } 
          />

          {/* 로그인 필요 + member만 */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/record/courserecord" element={<ProtectedRoute><CourseRecordPage /></ProtectedRoute>} />
          <Route path="/organize/liberal" element={<ProtectedRoute><LiberalYoramPage /></ProtectedRoute>} />
          <Route path="/organize/major" element={<ProtectedRoute><MajorYoramPage /></ProtectedRoute>} />
          <Route path="/organize/etc" element={<ProtectedRoute><EtcYoramPage /></ProtectedRoute>} />
          <Route path="/tags" element={<ProtectedRoute><TagPage /></ProtectedRoute>} />
          <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute><CourseCatalogPage /></ProtectedRoute>} />
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
}