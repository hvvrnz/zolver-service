import React, { useEffect } from "react";
import "./LandingPage.css";
import {
    FiArrowRight, FiCheckCircle, FiFileText, FiLayers,
    FiSearch, FiImage, FiBookOpen, FiCalendar, FiCheck, FiAlertCircle
} from "react-icons/fi";
import zolverLogo from "../../assets/landing_logo.png";

export default function LandingPage() {

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        document.querySelectorAll(".reveal-section").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-root">

            {/* 우상단 로그인 버튼 */}
            <button className="nav-login-btn" onClick={() => window.location.href = "/login"}>
                로그인
            </button>

            {/* Hero */}
            <header className="hero-area">
                <div className="hero-inner fade-up">
                    <img src={zolverLogo} alt="Zolver Logo" className="giant-hero-logo" />
                    <h1 className="hero-main-title">
                        "79%의 대학생이 졸업 요건 확인에 어려움을 겪습니다."<br/>
                        <span className="highlight-text">Zol.ver는 성적표 속 과목을 읽어 졸업 요건 판단에 필요한 기준을 정리해 드립니다.</span>
                    </h1>
                    <div className="hero-sub-description">
                        <span>유연한 설계로 편입·전과·휴복학 케이스 완벽 지원</span><br/>
                        <strong>신설 과목까지 배치 검증으로 자동 반영되니까, 내 이수현황을 빠르고 간편하게 정리해 보세요.</strong>
                    </div> 
                    <div className="quick-stats">
                        <div className="q-stat"><strong>Batch-Automated</strong><span>Auto-Expanding Search</span></div>
                        <div className="q-stat"><strong>Free</strong><span>Academic Years</span></div>
                        <div className="q-stat"><strong>Verified Badge</strong><span>Data Pipeline</span></div>
                    </div>
                    <button className="hero-primary-btn" onClick={() => window.location.href = "/login"}>
                        지금 바로 시작하기 <FiArrowRight />
                    </button>
                </div>
            </header>

            {/* Features */}
            <section className="features-area reveal-section">
                <div className="section-label">Core Features</div>
                <div className="features-grid">
                    <div className="f-card">
                        <FiFileText className="f-icon" />
                        <h3>한 번의 업로드로<br/>시작되는 정리</h3>
                        <p>성적표 파일 하나만 업로드 하면 수강한 과목을 알아서 정리해줘요.</p>
                    </div>
                    <div className="f-card">
                        <FiLayers className="f-icon" />
                        <h3>나의 학기 기록을<br/>한눈에</h3>
                        <p>1학년부터 지금까지의 이수 현황을 학기별 카드로 정리해줘요.</p>
                    </div>
                    <div className="f-card">
                        <FiSearch className="f-icon" />
                        <h3>학번·연도<br/>달라도 OK</h3>
                        <p>언제 들은 과목이든 상관없이 내 졸업 기준에 맞게 정리 가능해요.</p>
                    </div>
                    <div className="f-card">
                        <FiCheckCircle className="f-icon" />
                        <h3>예외 상황도<br/>기록 단위 관리 OK</h3>
                        <p>편입·휴학·복학 같은 경우도 내 기준대로 관리할 수 있어요.</p>
                    </div>
                </div>
            </section>

            {/* Workflow */}
            <section className="workflow-section reveal-section">
                <div className="section-label"><FiCalendar /> Graduation Data Mapping Workflow</div>
                <div className="workflow-container-horizontal">
                    <div className="wf-item">
                        <div className="wf-icon-box"><FiImage /></div>
                        <div className="wf-content"><strong>1. Excel File Upload</strong><p>성적표 파일 업로드</p></div>
                    </div>
                    <FiArrowRight className="wf-step-arrow" />
                    <div className="wf-item">
                        <div className="wf-icon-box"><FiFileText /></div>
                        <div className="wf-content"><strong>2. Extract</strong><p>과목명 텍스트 추출</p></div>
                    </div>
                    <FiArrowRight className="wf-step-arrow" />
                    <div className="wf-item">
                        <div className="wf-icon-box"><FiBookOpen /></div>
                        <div className="wf-content"><strong>3. Show</strong><p>영역별 그래프로 한눈에 시각화</p></div>
                    </div>
                    <FiArrowRight className="wf-step-arrow" />
                    <div className="wf-item highlight-step">
                        <div className="wf-icon-box"><FiCheck /></div>
                        <div className="wf-content"><strong>4. Sync Plan</strong><p>사용자 확인 후 이수 계획 반영</p></div>
                    </div>
                </div>
                <div className="workflow-explanation">
                    <div className="wf-sub-text">
                        Zol.ver는 졸업을 보조하는 <strong>가이드 도구</strong>입니다.
                        모든 자동 매핑 결과는 사용자의 최종 승인을 통해 완성됩니다.
                    </div>
                </div>
            </section>

            {/* Caution */}
            <section className="caution-area reveal-section">
                <div className="caution-container">
                    <div className="caution-header">
                        <FiAlertCircle className="caution-icon" />
                        <span className="caution-label">Final Verification Protocol</span>
                    </div>
                    <div className="caution-content">
                        <h3 className="caution-title">
                            본 서비스는 이용자의 판단을 돕는 <strong>'신뢰도 기반 졸업 가이드 도구'</strong>입니다.
                        </h3>
                        <p className="caution-text">
                            Zol.ver는 학교의 특수한 예외 규정이나 실시간 학칙 변동을 모두 반영하지 못할 수 있습니다.<br/>
                            정확한 졸업 확정을 위한 <strong>최종 이수 여부는 본인이 반드시 직접 검토</strong>해 주셔야 합니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* 하단 CTA */}
            <section className="final-action-section">
                <button className="hero-primary-btn" onClick={() => window.location.href = "/login"}>
                    지금 바로 시작하기
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-container">
                    <div className="footer-bottom">
                        <p className="copyright">© 2026 Zol.ver v1.0.0 — Confidence-based Graduation Guide | ryoonjeong</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}