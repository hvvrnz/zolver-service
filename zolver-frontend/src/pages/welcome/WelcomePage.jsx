// src/pages/welcome/WelcomePage.jsx

import React from 'react';
import { MdLibraryBooks, MdMenuBook, MdPersonAdd } from 'react-icons/md';
import { IoSchoolSharp } from "react-icons/io5";
import './WelcomePage.css';

export default function WelcomePage() {
  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-header">
          <div className="welcome-logo">
            <IoSchoolSharp size={48} />
          </div>
          <h1 className="welcome-title">Zol.ver에 오신 것을 환영합니다!</h1>
          <p className="welcome-subtitle">
            모든 기능을 이용하시려면 아래 중 하나를 선택해주세요.
          </p>
        </div>

        <div className="welcome-cards">
          {/* 성적표 업로드 */}
          <div className="welcome-card primary">
            <div className="welcome-card-icon">
              <MdLibraryBooks size={32} />
            </div>
            <h3 className="welcome-card-title">성적표 업로드</h3>
            <p className="welcome-card-desc">
              성적표를 업로드하면<br/>
              자동으로 계정이 생성되어<br/>
              모든 기능을 즉시 이용하실 수 있습니다.
            </p>
            <button 
              className="welcome-card-btn"
              onClick={() => handleNavigation('/record/courserecord')}
            >
              업로드하러 가기 →
            </button>
            <div className="welcome-card-badge">추천</div>
          </div>

          {/* 사용법 보기 */}
          <div className="welcome-card">
            <div className="welcome-card-icon secondary">
              <MdMenuBook size={32} />
            </div>
            <h3 className="welcome-card-title">사용법 먼저 보기</h3>
            <p className="welcome-card-desc">
              Zol.ver가 어떻게 동작하는지<br/>
              먼저 살펴보고 싶으신가요?
            </p>
            <button 
              className="welcome-card-btn secondary"
              onClick={() => handleNavigation('/guide')}
            >
              가이드 보기 →
            </button>
          </div>

          {/* 사용자 등록 신청 */}
          <div className="welcome-card">
            <div className="welcome-card-icon tertiary">
              <MdPersonAdd size={32} />
            </div>
            <h3 className="welcome-card-title">사용자 등록</h3>
            <p className="welcome-card-desc">
              성적표 없이 이용하고 싶으신가요?<br/>
              사용자 등록 후 이용 가능합니다.
            </p>
            <button 
              className="welcome-card-btn tertiary"
              onClick={() => handleNavigation('/support/report')}
            >
              신청하기 →
            </button>
          </div>
        </div>

        <div className="welcome-footer">
          <p>건국대학교 글로컬 재학생이라면? 성적표 업로드가 가장 빠른 방법입니다!</p>
        </div>
      </div>
    </div>
  );
}