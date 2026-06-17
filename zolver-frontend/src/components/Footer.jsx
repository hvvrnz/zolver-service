import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa'; // GitHub 아이콘
import './Footer.css';
import PolicyModal from './modals/PolicyModal';

// 페이지 컴포넌트 import
import TermsPage from '../pages/policy/TermsPage';
import PrivacyPage from '../pages/policy/PrivacyPage';
import FAQPage from '../pages/support/FAQPage';

const FOOTER_LINKS = [
  { label: '이용약관',         path: '/terms', modalType: 'terms' },
  { label: '개인정보 처리방침', path: '/privacy', modalType: 'privacy' },
  { label: '문의하기',         path: '/faq', modalType: 'faq' },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeModal, setActiveModal] = useState(null);

  // Login 페이지인지 확인
  const isLoginPage = location.pathname === '/login';

  // 링크 클릭 핸들러
  const handleLinkClick = (path, modalType) => {
    if (isLoginPage) {
      // Login 페이지에서는 모달 오픈
      setActiveModal(modalType);
    } else {
      // 다른 페이지에서는 페이지 이동
      navigate(path);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <footer className="zol-footer">
        <div className="zol-footer-inner">
          <nav className="zol-footer-links">
            {FOOTER_LINKS.map(({ label, path, modalType }) => (
              <button
                key={path}
                className="zol-footer-link"
                onClick={() => handleLinkClick(path, modalType)}
              >
                {label}
              </button>
            ))}
          </nav>
          {/* GitHub 링크 */}
          <a
            className="zol-footer-github"
            href="https://github.com/hvvrnz/zolver-service"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 저장소"
          >
            <FaGithub />
          </a>

          <p className="zol-footer-copy">
            © 2026 Zol.ver v1.0.0 — Confidence-based Graduation Guide
          </p>
        </div>
      </footer>

      {/* 모달 3개 */}
      <PolicyModal 
        isOpen={activeModal === 'terms'}
        onClose={closeModal}
      >
        <TermsPage />
      </PolicyModal>

      <PolicyModal 
        isOpen={activeModal === 'privacy'}
        onClose={closeModal}
      >
        <PrivacyPage />
      </PolicyModal>

      <PolicyModal 
        isOpen={activeModal === 'faq'}
        onClose={closeModal}
      >
        <FAQPage />
      </PolicyModal>
    </>
  );
}