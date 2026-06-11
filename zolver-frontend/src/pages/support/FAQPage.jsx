import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './FAQPage.css';

const FAQ_DATA = [
  {
    id: 1,
    question: '이용 대상은 누구인가요?',
    answer: '학사 정보 포털에서 성적표를 다운받아야 하기에, 건국대학교 글로컬캠퍼스 재학생이 이용하는 것을 권장합니다.'
  },
  {
    id: 2,
    question: '왜 카카오 로그인이 필요한가요?',
    answer: '동일한 이용자의 성적 데이터가 중복으로 저장되지 않도록 최소한의 식별 수단이 필요합니다. 실명, 전화번호, 이메일 등 민감한 정보는 수집하지 않으며, 카카오 연동을 통한 식별값만 사용합니다.'
  },
  {
    id: 3,
    question: '성적표를 올리지 않아도 사용할 수 있나요?',
    answer: '성적표 없이도 사용은 가능합니다. 단, 과목 검색 및 매핑 등 데이터 기반의 일부 기능은 이용이 제한될 수 있습니다.'
  },
  {
    id: 4,
    question: '제 성적표가 서버에 저장되나요?',
    answer: '원본 성적표 파일은 저장되지 않습니다. 업로드된 성적표는 과목 정보 추출에만 사용되며, 분석이 완료되는 즉시 서버에서 삭제됩니다. 저장되는 것은 졸업요건 계산에 필요한 과목 이수 정보(과목명, 학점, 이수년도 등)뿐입니다.'
  },
  {
    id: 5,
    question: '탈퇴하면 제 정보가 모두 삭제되나요?',
    answer: '탈퇴 시 카카오 연동 식별값과 연결된 모든 개인정보는 즉시 삭제됩니다. 단, 업로드하신 과목 데이터는 개인과의 연결이 끊어진 상태로 서비스 품질 향상(강의 신뢰도 산정)을 위해 일부 보관될 수 있습니다. 이 데이터로는 특정 개인을 식별할 수 없습니다.'
  },
  {
    id: 6,
    question: '제 성적표를 업로드하는 게 보안상 안전할까요?',
    answer: '네, 안전합니다. 성적표 원본은 분석 후 즉시 삭제되며, 개인 식별 정보는 복원이 불가능한 방식으로 암호화되어 관리됩니다.'
  },
  {
    id: 7,
    question: '서비스에 나와있는 학점수랑 제 졸업학점이랑 달라요.',
    answer: '총 졸업학점 130학점, 교양 30학점, 전공 60학점이 기본 세팅 값입니다. 본인의 졸업요건에 맞게 메인 홈페이지의 우측 상단 ⚙️(설정)에서 졸업학점, 교양학점, 전공학점을 수정하실 수 있습니다.'
  },
  {
    id: 8,
    question: '학교 성적 조회 페이지와 Zol.ver의 차이점은 뭔가요?',
    answer: '학교 성적 조회 페이지는 단순히 성적표를 보여주는 기능에 그치는 반면, Zol.ver는 업로드된 성적표를 기반으로 졸업요건 진도율 계산, 과목 매핑, 개인 맞춤형 학습 계획 관리 등 다양한 부가 기능을 제공합니다.'
  },
  {
    id: 9,
    question: '계절학기나 타대 교류 학점도 반영할 수 있나요?',
    answer: '네, 가능합니다. 자동 업로드 기능뿐만 아니라 수동 과목 추가 및 태그 기능을 통해 계절학기, 이러닝, 해외 교류 학점 등 어떤 예외적인 학점도 자유롭게 기록하고 관리할 수 있습니다.'
  },
  {
    id: 10,
    question: '가입하면 바로 모든 기능을 쓸 수 있나요? 비용은요?',
    answer: '카카오 로그인 한 번으로 모든 핵심 기능을 무료로 이용하실 수 있습니다.'
  }
];

export default function FAQPage() {
  const [openId, setOpenId] = useState(null);

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <h1 className="faq-title">자주 묻는 질문</h1>
        <p className="faq-subtitle">
          Zol.ver 이용에 관해 자주 묻는 질문들을 모아두었어요.
        </p>

        <div className="faq-list">
          {FAQ_DATA.map(faq => (
            <div key={faq.id} className="faq-item">
              <button
                className={`faq-question ${openId === faq.id ? 'active' : ''}`}
                onClick={() => toggleFAQ(faq.id)}
              >
                <span className="faq-question-text">Q. {faq.question}</span>
                {openId === faq.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
              </button>
              {openId === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <h2>더 궁금한 점이 있으신가요?</h2>
          <p>아래 이메일로 문의해주시면 빠르게 답변드리겠습니다.</p>
          <a href="mailto:supportzolver@google.com" className="faq-contact-email">
            supportzolver@google.com
          </a>
        </div>
      </div>
    </div>
  );
}
