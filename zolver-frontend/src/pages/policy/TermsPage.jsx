import React from 'react';
import './TermsPage.css';

export default function TermsPage() {
  return (
    <div className="terms-container">
      <div className="terms-card">
        <header className="terms-header">
          <div className="breadcrumb">Zol.ver / 서비스 약관</div>
          <h1>서비스 이용약관</h1>
          <p className="last-modified">최종 수정일: 2026년 6월 4일</p>
          <p>이 약관은 Zol.ver 서비스 제공자와 이용자 간의 권리 및 책임 관계를 명확히 합니다.</p>
        </header>

        <nav className="terms-index">
          <ol>
            <li><a href="#t1">제1조 서비스의 목적 및 범위</a></li>
            <li><a href="#t2">제2조 데이터 처리 방식 및 무결성</a></li>
            <li><a href="#t3">제3조 이용자의 의무 및 면책 사항 (필독)</a></li>
            <li><a href="#t4">제4조 서비스 제한 및 이용 정책</a></li>
          </ol>
        </nav>

        <article className="terms-content">
          <section id="t1">
            <h3>제 1 조 (서비스의 목적 및 데이터 출처)</h3>
            <p>1. 본 서비스는 이용자가 제출한 성적 데이터를 기반으로 졸업 요건 충족 여부를 시뮬레이션하는 비공식 학업 보조 도구입니다.</p>
            <p>2. 서비스 내 관리자 등록 과목 데이터는 <strong>건국대학교글로컬캠퍼스의 2020학년도 1학기부터 2025학년도 1학기까지</strong> 개설된 과목 데이터를 기준으로 구축되었습니다. 해당 기간 외의 과목이나 학제 개편 사항은 실시간으로 반영되지 않을 수 있습니다.</p>
            <p>3. 본 서비스는 대학 본부와 무관하게 개인이 운영하는 보조 도구이며, 대학의 공식 DB를 직접 복제하거나 배포하지 않습니다.</p>
          </section>

          <section id="t2">
            <h3>제 2 조 (데이터 처리 방식 및 무결성)</h3>
            <p>1. 동일한 과목이 중복으로 등록되는 것을 방지하기 위해, 이용자의 식별 정보와 과목 정보를 결합한 고유 식별값을 생성하여 관리합니다. 이 값은 원본 정보로 복원이 불가능한 방식으로 암호화됩니다.</p>
            <p>2. 이용자가 업로드한 과목은 시스템의 자동 검증과 운영진의 수동 검토를 거쳐 서비스 품질을 유지합니다.</p>
            <p>3. 이용자가 탈퇴한 이후에도, 개인과의 연결이 끊어진 비식별 과목 데이터는 강의 신뢰도 향상을 위해 보관될 수 있습니다. 이는 서비스 전체의 데이터 품질을 높이기 위한 목적으로만 활용됩니다.</p>
          </section>

          <section id="t3" className="warning-section">
            <h3>제 3 조 (면책 조항 및 책임의 한계)</h3>
            <p className="danger-text"><strong>본 서비스의 결과값은 대학 본부의 공식 학적 기록을 대체할 수 없으며, 법적 효력이 없습니다.</strong></p>
            <p>1. 시뮬레이션 결과는 단순 참고용으로만 활용해야 하며, 졸업 및 이수 여부에 대한 최종 판정 권한은 전적으로 소속 대학 교무처에 있습니다.</p>
            <p>2. 시스템 오류, 성적표 추출 과정의 알고리즘 오차, 학교 측의 예고 없는 요람 변경으로 발생하는 정보 불일치에 대해 운영진은 법적 책임을 지지 않습니다.</p>
            <p>3. 졸업 관련 중요한 결정은 반드시 담당 교수 또는 교무처에 직접 문의하시기 바랍니다.</p>
          </section>

          <section id="t4">
            <h3>제 4 조 (이용 제한)</h3>
            <p>아래의 행위가 발견될 경우 해당 계정의 접속을 즉시 차단하고 수집된 데이터를 영구 파기할 수 있습니다.</p>
            <ul>
              <li>타인의 성적표 도용</li>
              <li>허위 사실 기재</li>
              <li>시스템 해킹 또는 비정상적인 접근 시도</li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
