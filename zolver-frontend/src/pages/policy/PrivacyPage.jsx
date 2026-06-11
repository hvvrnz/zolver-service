import React from 'react';
import './PrivacyPage.css';

export default function PrivacyPage() {
  return (
    <div className="policy-container">
      <div className="policy-card">
        <header className="policy-header">
          <div className="breadcrumb">Zol.ver / 개인정보 처리방침</div>
          <h1>개인정보 처리방침</h1>
          <p className="last-modified">최종 수정일: 2026년 6월 4일</p>
        </header>

        <nav className="policy-index">
          <ol>
            <li><a href="#section1">1. 수집하는 개인정보 항목 및 목적</a></li>
            <li><a href="#section2">2. 성적표 검증 및 처리 방식</a></li>
            <li><a href="#section3">3. 개인정보의 보유 및 파기 정책</a></li>
            <li><a href="#section4">4. 이용자의 권리 및 거부권 행사</a></li>
          </ol>
        </nav>

        <article className="policy-content">
          <section id="section1">
            <h2>1. 수집하는 개인정보 항목 및 목적</h2>
            <p>운영진은 이용자의 학업 관리 효율화와 졸업 요건의 정확한 진단을 위해 아래와 같은 최소한의 정보만 수집합니다. 모든 정보는 명시된 목적 외 용도로는 사용되지 않습니다.</p>
            <ul>
              <li><strong>식별 정보:</strong> 카카오톡 연동을 통한 닉네임, 입학년도(학번 앞 네 자리), 전공 정보</li>
              <li><strong>학업 기록:</strong> 이용자가 업로드한 성적표 내 과목명, 과목코드, 성적등급, 이수구분, 이수학점, 이수년도, 이수학기</li>
              <li><strong>로그 데이터:</strong> IP 주소, 쿠키, 브라우저 정보, 서비스 이용 기록(방문 일시 등)</li>
            </ul>
            <p>카카오 로그인을 사용하는 이유는 단 하나입니다. 동일한 이용자의 성적 데이터가 중복 적재되지 않도록 하기 위해 최소한의 식별 수단이 필요하기 때문입니다. 이름, 전화번호, 이메일 등 민감한 정보는 수집하지 않습니다.</p>
          </section>

          <hr className="divider" />

          <section id="section2">
            <h2>2. 성적표 검증 및 처리 방식</h2>
            <p>Zol.ver는 이용자의 성적표를 안전하게 처리하기 위해 아래의 검증 절차를 거칩니다.</p>

            <div className="tech-box">
              <h4>[1단계] 파일 형식 확인</h4>
              <p>업로드된 파일이 공식 성적표 양식인지 먼저 확인합니다. 성적표가 아닌 파일은 어떠한 데이터도 저장하지 않고 즉시 삭제됩니다.</p>

              <h4>[2단계] 과목 정보 추출 및 구조 검증</h4>
              <p>공식 성적표의 레이아웃을 기준으로 과목 정보를 추출합니다. 추출이 완료된 후 원본 성적표 파일은 서버에서 즉시 삭제됩니다. 저장되는 것은 졸업요건 계산에 필요한 과목 이수 정보뿐입니다.</p>
            </div>

            <div className="log-protection">
              <br/><h4>[실패 시 처리]</h4>
              <p>양식 변경 등으로 인해 분석에 실패할 경우, 서비스 개선을 위한 기술 로그만 생성됩니다. 이때 성명, 학번 등 개인을 식별할 수 있는 모든 정보는 자동으로 마스킹 처리되어 운영진도 원본 내용을 확인할 수 없습니다.</p>
            </div>
          </section>

          <hr className="divider" />

          <section id="section3">
            <h2>3. 개인정보의 보유 및 파기 정책</h2>
            <p>서비스는 이용 목적 달성 시 정보를 파기하나, 시스템 운영 상 아래의 예외 사항을 둡니다.</p>

            <p className="emphasis-text">
              <strong>회원 탈퇴 시 처리 원칙:</strong> 이용자가 탈퇴하는 경우, 카카오 연동 식별값과 연결된 모든 개인정보는 즉시 파기됩니다.
            </p>

            <p>단, 아래 두 가지 데이터는 시스템 무결성 유지를 위해 일부 보관될 수 있습니다.</p><br/>

            <ul>
              <li>
                <strong>서비스 이용 로그:</strong>  탈퇴 시 개인정보와 연결된 모든 정보는 즉시 삭제됩니다. 단, 서비스 보안
                및 운영을 위해 수집된 접속 로그는 개인 식별이 불가능한 형태로 일정 기간 보관될 수 있습니다.
              </li>
              <br/>
              <li>
                <strong>과목 검증 이력(스냅샷):</strong> 이용자가 업로드한 과목 정보는 서비스 품질 향상을 위한 강의 데이터 검증에 활용됩니다.
                탈퇴 시 이용자와의 연결은 끊어지지만, 과목 코드·학점·이수년도 등 비식별화된 학업 데이터는 강의 신뢰도 산정을 위해 보관될 수 있습니다.
                이 데이터는 특정 개인을 식별하는 데 사용되지 않으며, 서비스 내 강의 정보 고도화 목적으로만 활용됩니다.<br/><br/>
              </li>
            </ul>

            <p>성적표 원본 파일은 분석이 종료되는 즉시 서버에서 물리적으로 삭제됩니다.</p>
          </section>

          <hr className="divider" />

          <section id="section4">
            <h2>4. 이용자의 권리 및 거부권 행사</h2>
            <p>이용자는 언제든지 본인의 정보 열람, 수정, 삭제를 요청할 수 있습니다. 서비스 내 탈퇴 기능을 통해 직접 처리하거나, 아래 이메일로 문의해 주시기 바랍니다.</p>
            <p><strong>문의:</strong> supportzolver@google.com</p>
          </section>
        </article>
      </div>
    </div>
  );
}
