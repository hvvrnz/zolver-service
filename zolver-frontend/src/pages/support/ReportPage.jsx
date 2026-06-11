import { useState } from 'react';
import { MdPersonAdd, MdBugReport, MdOpenInNew } from 'react-icons/md';
import RegisterModal from './RegisterModal';
import './ReportPage.css';

const REPORT_FORM_URL = 'https://forms.gle/pCC1MMNK14REkGuE8';

export default function ReportPage() {
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="report-page">
      <div className="report-container">
        <div className="report-header">
          <h1 className="report-title">문의 및 제보</h1>
          <p className="report-subtitle">
            사용자 등록 신청, 오류 제보, 기타 문의사항을 접수하실 수 있습니다
          </p>
        </div>

        <div className="report-content">

          {/* 사용자 등록 카드 */}
          <div className="report-card registration-card">
            <h2 className="card-title">
              <MdPersonAdd size={28}/>
              <span>사용자 등록</span>
            </h2>
            <p className="card-description">
              성적표 없이 Zolver를 이용하고 싶으신가요?<br/>
              아래 버튼을 눌러 정보를 입력하면 바로 모든 기능을 이용하실 수 있습니다.
            </p>
            <button className="btn-report-form registration-btn"
              onClick={() => setRegisterOpen(true)}>
              <span>사용자 등록하기</span>
              <MdPersonAdd size={20}/>
            </button>
          </div>

          {/* 오류 제보 카드 */}
          <div className="report-card">
            <h2 className="card-title">
              <MdBugReport size={28}/>
              <span>오류 제보</span>
            </h2>
            <ul className="report-list">
              <li>
                <strong>과목 정보 오류</strong>
                <span>과목명, 학점, 분류 등의 정보가 잘못된 경우</span>
              </li>
              <li>
                <strong>건의 사항</strong>
                <span>서비스 개선이나 기능 추가에 대한 건의</span>
              </li>
              <li>
                <strong>성적표 파싱 오류</strong>
                <span>성적표 업로드 시 과목이 잘못 인식되는 경우</span>
              </li>
              <li>
                <strong>기타 데이터 오류</strong>
                <span>위 항목에 해당하지 않는 기타 데이터 문제</span>
              </li>
            </ul>
            <button className="btn-report-form report-btn"
              onClick={() => window.open(REPORT_FORM_URL, '_blank', 'noopener,noreferrer')}>
              <span>오류 제보하기</span>
              <MdOpenInNew size={20}/>
            </button>
          </div>

          {/* 안내사항 */}
          <div className="report-notice">
            <h3>안내</h3>
            <ul>
              <li><strong>사용자 등록:</strong> 정보 입력 즉시 서비스 이용이 가능합니다.</li>
              <li><strong>오류 제보:</strong> 구체적인 정보를 제공해주실수록 빠른 수정이 가능합니다.</li>
              <li>처리 결과는 이메일을 남겨주신 분들께 개별 안내해 드립니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <RegisterModal isOpen={registerOpen} onClose={() => setRegisterOpen(false)}/>
    </div>
  );
}
