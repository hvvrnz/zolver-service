import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api/auth';
import './Header.css';
import useWindowSize from '../hooks/useWindowSize';
import logoDesktop from '../assets/logo4.png';
import logoMobile  from '../assets/icon3.png';
import { MdMenu, MdClose } from 'react-icons/md';
import { LuLogOut } from 'react-icons/lu';

export default function Header() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isMobile } = useWindowSize();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled]             = useState(false);

  const isActive    = (path) => location.pathname.startsWith(path);
  const isSubActive = (path) => location.pathname === path;
  const closeMenu   = useCallback(() => setIsMobileMenuOpen(false), []);

  const goTo = useCallback((path) => {
    navigate(path);
    closeMenu();
  }, [navigate, closeMenu]);

  useEffect(() => { closeMenu(); }, [location.pathname, closeMenu]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error('로그아웃 실패:', err); }
    finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
      closeMenu();
    }
  };

  return (
    <header className={`header ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <div className="header-logo" onClick={() => goTo('/')} role="link" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && goTo('/')}>
          <img src={isMobile ? logoMobile : logoDesktop} alt="Zolver"/>
        </div>

        {isMobile && (
          <button className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}>
            {isMobileMenuOpen ? <MdClose size={26}/> : <MdMenu size={26}/>}
          </button>
        )}

        {/* 모바일 오버레이 */}
        {isMobile && isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMenu} aria-hidden="true"/>
        )}

        {/* PC 메뉴는 항상 보이고, 모바일 메뉴는 토글에 따라 보임/숨김 처리 */}
        <nav className={`header-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>

        {/* 모바일 패널 내 닫기 버튼 */}
        {isMobile && (
          <button className="mobile-menu-close" onClick={closeMenu} aria-label="메뉴 닫기">
            <MdClose size={24}/>
          </button>
        )}

        {/* 이수 과목 등록 */}
        <div className="dropdown-wrapper">
          <div className={`menu-label ${isActive('/record') ? 'active' : ''}`}
            onClick={() => goTo('/record/courserecord')} role="button" tabIndex={0}>
            이수 과목 등록
          </div>
        </div>

        {/* 이수 현황 */}
        <div className="dropdown-wrapper">
          <div className={`menu-label ${isActive('/organize') ? 'active' : ''}`}
            role="button" tabIndex={0}>
            이수 현황
          </div>
          <div className="dropdown-menu" role="menu">
            <div className={isSubActive('/organize/major')   ? 'submenu-active' : ''}
              onClick={() => goTo('/organize/major')} role="menuitem">전공 이수 현황</div>
            <div className={isSubActive('/organize/liberal') ? 'submenu-active' : ''}
              onClick={() => goTo('/organize/liberal')} role="menuitem">교양 이수 현황</div>
            <div className={isSubActive('/organize/etc')     ? 'submenu-active' : ''}
              onClick={() => goTo('/organize/etc')} role="menuitem">기타/교류 내역</div>
          </div>
        </div>

        {/* 학업 도구 */}
        <div className="dropdown-wrapper">
          <div className={`menu-label ${isActive('/simulation') || isActive('/tags') || isActive('/catalog') || isSubActive('/gpa') ? 'active' : ''}`}
            role="button" tabIndex={0}>
            학업 도구
          </div>
          <div className="dropdown-menu" role="menu">
            <div className={isSubActive('/tags')       ? 'submenu-active' : ''}
              onClick={() => goTo('/tags')} role="menuitem">태그 관리</div>
            <div className={isSubActive('/gpa') ? 'submenu-active' : ''}
              onClick={() => goTo('/gpa')} role="menuitem">평점 분석</div>
            <div className={isSubActive('/catalog') ? 'submenu-active' : ''}
              onClick={() => goTo('/catalog')} role="menuitem">과목 모아보기</div>
            <div className={isSubActive('/simulation') ? 'submenu-active' : ''}
              onClick={() => goTo('/simulation')} role="menuitem">수강 시뮬레이션</div>
          </div>
        </div>

        {/* 도움말 */}
        <div className="dropdown-wrapper">
          <div className={`menu-label ${isActive('/guide') || isActive('/support') ? 'active' : ''}`}
            role="button" tabIndex={0}>
            도움말
          </div>
          <div className="dropdown-menu" role="menu">
            <div className={isSubActive('/guide')          ? 'submenu-active' : ''}
              onClick={() => goTo('/guide')} role="menuitem">이용 가이드</div>
            <div className={isSubActive('/support/report') ? 'submenu-active' : ''}
              onClick={() => goTo('/support/report')} role="menuitem">등록 문의 및 제보</div>
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="icon-wrapper" onClick={handleLogout}
          role="button" aria-label="로그아웃" tabIndex={0}>
          <LuLogOut size={20}/>
          <span className="tooltip" aria-hidden="true">로그아웃</span>
        </div>
      </nav>
      </div>
    </header>
  );
}