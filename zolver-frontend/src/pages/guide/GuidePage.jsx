import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFileUpload } from 'react-icons/md';
import { FiExternalLink, FiTag, FiList, FiHelpCircle, FiChevronDown, FiChevronUp, FiSettings, FiBook, FiBarChart2 } from 'react-icons/fi';
import save1Img from '../../assets/save1.png';
import save2Img from '../../assets/save2.png';
import './GuidePage.css';

const TABS = [
  { value: 'start',      label: '🎓시작하기',        icon: null },
  { value: 'upload',     label: '성적표 업로드',     icon: <MdFileUpload size={15}/> },
  { value: 'category',   label: '과목 카테고리',      icon: <FiList size={15}/> },
  { value: 'tag',        label: '영역 & 태그',        icon: <FiTag size={15}/> },
  { value: 'credits',    label: '졸업학점 설정',      icon: <FiSettings size={15}/> },
  { value: 'catalog',    label: '과목 모아보기',      icon: <FiBook size={15}/> },
  { value: 'simulation', label: '수강 시뮬레이션',    icon: <FiBarChart2 size={15}/> },
  { value: 'faq',        label: 'FAQ',               icon: <FiHelpCircle size={15}/> },
];

const FAQ_LIST = [
  { q: '성적표 업로드가 실패해요.',
    a: '다운로드 폴더의 원본 파일 그대로 업로드해야 해요. 파일명 변경, 편집, 다른 이름으로 저장한 경우 인식이 어려울 수 있어요.' },
  { q: '이수 과목 등록 페이지에서 과목 검색이 안돼요.',
    a: '성적표를 1회 이상 업로드하면 이수 과목 등록 페이지에서 과목을 검색할 수 있어요.' },
  { q: '어떤 과목들을 검색할 수 있나요?',
    a: '건국대학교 글로컬캠퍼스의 2020~2025년 개설과목 일부를 검색할 수 있어요. 자세한 사항은 페이지 하단 이용약관을 확인해주세요.' },
  { q: '성적표를 재업로드하면 기존 과목들은 어떻게 되나요?',
    a: '기존 과목은 그대로 유지되고, 새로 추가된 과목만 반영돼요. 수기로 수정한 내용도 덮어쓰지 않아요. \n 단, 재수강 등 동일 과목이 다시 업로드되면 별도 과목으로 추가될 수 있어요.' },
  { q: '수강 시뮬레이션은 실제 수강신청과 연동되나요?',
    a: '연동되지 않아요. 수강 계획을 세우고 이수 현황을 미리 확인하는 용도예요. 직접 메모 형식으로 과목을 입력해서 활용할 수 있어요.' },
  { q: '태그를 설정했는데 그래프가 안 떠요.',
    a: '태그에 목표 학점을 설정해야 달성률 그래프가 표시돼요. 태그 관리 페이지에서 목표 학점을 입력해주세요. \n목표 학점이 없으면 이수 학점 숫자만 표시돼요.' },
  { q: '졸업 학점 기준을 바꾸고 싶어요.',
    a: '우측 상단 프로필 아이콘 → 설정에서 총 졸업 이수학점, 전공, 교양 목표학점을 변경할 수 있어요.' },
  { q: '평점 분석 페이지는 어떻게 활용하나요?',
    a: '성적표를 업로드하면 전체/전공 평균 평점과 학기별 추이를 자동으로 계산해줘요. \n목표 평점을 설정하면 현재와 얼마나 차이나는지 확인할 수 있고, 앞으로 몇 학점을 어떤 성적으로 받아야 하는지 시뮬레이션도 할 수 있어요.' },
  { q: '평점 분석시 어떤 기준으로 계산되나요?',
    a: '4.5점 만점으로 계산돼요. 성적의 경우\n\n P → 취득학점 반영 O, 평점 미반영 \n NP/N → 취득학점 반영 X, 평점 미반영\n F → 취득학점 반영 X, 평점 반영(0.0)\n F → 취득학점 포기시, 취득학점 반영 X, 평점 미반영\n\n 학기별 평점은 반올림(예: 2.937 → 2.94) \n전체/전공 평점은 버림 처리 (예: 3.536 → 3.53)' },
  { q: '평점 시뮬레이션은 어떤 기준으로 계산되나요?',
    a: '2학점 과목 기준으로 보수적으로 계산해요.\n예를 들어 18학점을 입력하면 2학점짜리 9과목 기준으로 A+, A 등 몇 과목씩 받아야 하는지 알려줘요.\n실제 수강 과목의 학점(1~6학점)에 따라 필요 과목 수는 달라질 수 있어요.\n\n필요 평균 평점은 버림 처리해요 (예: 3.834 → 3.83).' }
];

export default function GuidePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('start');
  const [openFaq, setOpenFaq]     = useState(null);

  return (
    <div className="guide-page">

      <div className="guide-page-header">
        <h1 className="guide-title">이용 가이드</h1>
        <p className="guide-subtitle">
           Zolver 사용 방법을 안내해드립니다. (❁´◡`❁)<br/>
          처음이라면 <strong>🎓시작하기</strong> 탭만 읽어보세요. 나머지 탭은 더 궁금한 게 생겼을 때 찾아보시면 돼요.
        </p>
      </div>

      {/* 탭 */}
      <div className="guide-tabs">
        {TABS.map(tab => (
          <button
            key={tab.value}
            className={`guide-tab ${activeTab === tab.value ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="guide-content">

        {/* ── 시작하기 */}
        {activeTab === 'start' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              Zol.ver는 <strong>내 졸업요건을 한눈에 관리</strong>하는 서비스예요.
              딱 3단계만 하면 바로 쓸 수 있어요.
            </p>

            <div className="guide-sim-steps">
              <div className="guide-sim-step">
                <span className="guide-step-num">1</span>
                <div>
                  <p className="guide-step-title">성적표 업로드 또는 사용자 등록</p>
                  <p className="guide-step-desc">
                    학사정보 포털에서 전체성적을 <strong>.xlsx 파일</strong>로 저장한 뒤, 이수 과목 등록 페이지에서 업로드하세요.<br/><br/>

                    전공·교양·기타 과목 <strong>자동분류</strong> <br/>
                    학과·학번 자동 생성<br/>
                    자동 사용자 등록 및 서비스 이용 가능<br/><br/> 성적표 업로드는 사용자 등록을 할 필요가 없어요. 
                    
                    사용자 등록 (도움말 → 등록문의 및 제보) 
                  </p>
                </div>
              </div>
              <div className="guide-sim-step">
                <span className="guide-step-num">2</span>
                <div>
                  <p className="guide-step-title">태그 목표 학점 설정</p>
                  <p className="guide-step-desc">
                    태그 관리 페이지에서 자동 생성된 태그의 <strong>목표 학점을 입력</strong>하세요.
                    목표 학점을 설정해야 달성률 그래프가 표시돼요.<br/>
                    졸업요건은 학교 홈페이지 요람에서 확인할 수 있어요.
                  </p>
                </div>
              </div>
              <div className="guide-sim-step">
                <span className="guide-step-num">3</span>
                <div>
                  <p className="guide-step-title">이수 현황 확인</p>
                  <p className="guide-step-desc">
                    전공·교양·기타 이수 현황 페이지에서 <strong>태그별 달성률과 남은 학점</strong>을 확인하세요.
                    수강 시뮬레이션으로 앞으로 들을 과목도 미리 계획해볼 수 있어요.
                  </p>
                </div>
              </div>
            </div>

            <div className="guide-notice">
              <span className="guide-notice-title">💡 이것만 알면 돼요</span>
              <span>· 성적표 업로드하면 과목 분류와 태그 생성은 <strong>자동</strong>으로 돼요.</span>
              <span>· 태그 목표 학점만 직접 설정해주면 달성률 그래프가 바로 뜨고, 나머지는 자동이에요.</span>
              <span>· 졸업학점 기준(총 학점·전공·교양)은 <strong> 메인 홈 우측 상단 설정</strong>에서 변경할 수 있어요. 기본값은 총 130 / 전공 60 / 교양 30학점이에요.</span>
            </div>

            <div className="guide-cta">
              <button className="btn-guide-primary" onClick={() => navigate('/record/courserecord')}>
                <MdFileUpload size={16}/> 지금 바로 시작하기
              </button>
            </div>
          </div>
        )}

        {/* ── 성적표 업로드 */}
        {activeTab === 'upload' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              Zolver는 학사정보 포털에서 내려받은 <strong>성적표 파일(.xlsx)</strong>을 업로드해서 이수 과목을 등록해요.
              <strong>금학기 성적이 아닌 전체 성적표를 업로드</strong> 해야 해요.
            </p>

            <div className="guide-notice">
              <span className="guide-notice-title">※ 반드시 원본 파일 그대로 업로드해 주세요</span>
              <span><strong>다운로드 폴더의 원본 파일 그대로 (편집사용·다른 이름으로 저장 x)</strong> 업로드해야 해요.</span>
              <span>파일 이름 변경, 편집 하여 저장하면 과목 인식이 어려울 수 있어요.</span>
              <span className="guide-notice-sub">성적표 내 과목 데이터는 시스템 검증을 거쳐 신뢰도 있는 데이터로 활용돼요.</span>
            </div>

            <div className="guide-steps-grid">
              <div className="guide-step">
                <div className="guide-step-header">
                  <span className="guide-step-num">1</span>
                  <div>
                    <p className="guide-step-title">전체성적조회 접속</p>
                    <p className="guide-step-desc">
                      학사정보 포털 → 좌측 삼단바 → 성적 → 전체성적 → <strong>전체성적조회</strong> 클릭
                    </p>
                  </div>
                </div>
                <img src={save1Img} alt="전체성적조회" className="guide-step-img"/>
              </div>

              <div className="guide-step">
                <div className="guide-step-header">
                  <span className="guide-step-num">2</span>
                  <div>
                    <p className="guide-step-title">xlsx 형식으로 저장</p>
                    <p className="guide-step-desc">
                      상단 출력 버튼 → 보고서 팝업 → 좌측 상단 저장 아이콘 →
                      파일 형식 <strong>Microsoft Excel File (*.xlsx)</strong> 선택 후 저장
                    </p>
                  </div>
                </div>
                <img src={save2Img} alt="xlsx 저장" className="guide-step-img"/>
              </div>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-step-num">3</span>
                <div>
                  <p className="guide-step-title">원본 파일 그대로 업로드</p>
                  <p className="guide-step-desc">
                    다운로드 폴더에서 원본 파일을 이수 과목 등록 페이지에서 바로 업로드하면 끝이에요. <strong>(다른 이름으로 저장 x)</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="guide-cta">
              <a href="https://kis.kku.ac.kr/index.do" target="_blank" rel="noopener noreferrer"
                className="btn-guide-portal">
                <FiExternalLink size={14}/> 학사정보 포털 바로가기
              </a>
              <button className="btn-guide-primary" onClick={() => navigate('/record/courserecord')}>
                <MdFileUpload size={16}/> 이수 과목 등록하러 가기
              </button>
            </div>
          </div>
        )}

        {/* ── 과목 카테고리 */}
        {activeTab === 'category' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              모든 과목은 <strong>전공 / 교양 / 기타</strong> 세 가지 카테고리로 분류돼요.
              성적표 업로드 시 이수구분을 기준으로 <strong>자동 분류</strong>되며, 이후 언제든지 변경할 수 있어요.
            </p>

            <div className="guide-category-cards">
              <div className="guide-category-card">
                <div className="guide-category-top">
                  <span className="guide-cat-badge major">전공</span>
                  <span className="guide-category-page">→ 전공 이수 현황 페이지</span>
                </div>
                <p>전공 관련 과목이 자동으로 분류</p>
                <ul>
                  <li><strong>전필·전선</strong> 이수구분의 과목이 해당</li>
                  <li>달성률과 남은 학점을 확인할 수 있어요.</li>
                </ul>
              </div>
              <div className="guide-category-card">
                <div className="guide-category-top">
                  <span className="guide-cat-badge general">교양</span>
                  <span className="guide-category-page">→ 교양 이수 현황 페이지</span>
                </div>
                <p>교양 관련 과목이 자동으로 분류</p>
                <ul>
                  <li><strong>기초·심화·소양·인성</strong> 이수구분의 과목이 해당</li>
                  <li>태그 관리에서 영역을 더 세분화하여 관리할 수 있어요.</li>
                </ul>
              </div>
              <div className="guide-category-card">
                <div className="guide-category-top">
                  <span className="guide-cat-badge etc">기타</span>
                  <span className="guide-category-page">→ 기타/교류 내역 페이지</span>
                </div>
                <p>전공·교양 외 모든 과목이 해당</p>
                <ul>
                  <li>교직, 평생교육, 교류학점 등이 포함</li>
                  <li>태그 관리에서 직접 영역을 만들어 자유롭게 분류할 수 있어요.</li>
                </ul>
              </div>
            </div>

            <div className="guide-tip">
              💡 각 이수 현황 페이지에서 과목 카드를 클릭하면 카테고리를 변경할 수 있어요.
            </div>

            <div className="guide-tip">
              💡 자동 분류가 안 된 과목이 있다면 직접 카테고리를 변경하거나,
              수동 추가 기능으로 직접 입력할 수 있어요.
            </div>
          </div>
        )}

        {/* ── 태그 & 세부영역 */}
        {activeTab === 'tag' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              이수구분을 Zol.ver에서는 <strong>태그</strong>라고 불러요. 태그별로 목표 학점을 설정하고 이수 과목을 매핑해보세요.<br/>
              이수 현황 페이지에서 달성률을 한눈에 확인할 수 있어요.
              성적표를 업로드하면 이수구분을 기준으로 <strong>태그가 자동 생성되어 과목을 영역별로 분류</strong>해줘요.
            </p>

            <div className="guide-tag-groups">
              <div className="guide-tag-group">
                <p className="guide-tag-group-title">
                  <span className="guide-cat-badge major">전공 이수 현황 페이지</span>
                </p>
                <div className="guide-tag-chips">
                  <span className="tag-chip major">전필</span>
                  <span className="tag-chip major">전선</span>
                </div>
                <p className="guide-tag-group-note">
                  이수구분이 <strong>전필·전선</strong>인 과목이 전공 페이지로 자동 분류되고 영역(태그)이 생성돼요.
                </p>
              </div>
              <div className="guide-tag-group">
                <p className="guide-tag-group-title">
                  <span className="guide-cat-badge general">교양 이수 현황 페이지</span>
                </p>
                <div className="guide-tag-chips">
                  <span className="tag-chip general">기초</span>
                  <span className="tag-chip general">심화</span>
                  <span className="tag-chip general">소양</span>
                  <span className="tag-chip general">인성</span>
                </div>
                <p className="guide-tag-group-note">
                  이수구분이 <strong>기초·심화·소양·인성</strong>인 과목이 교양 페이지로 자동 분류되고 영역(태그)이 생성돼요.
                </p>
              </div>
              <div className="guide-tag-group">
                <p className="guide-tag-group-title">
                  <span className="guide-cat-badge etc">기타 이수 현황 페이지</span>
                </p>
                <div className="guide-tag-chips">
                  <span className="tag-chip etc">그 외 모든 과목</span>
                </div>
                <p className="guide-tag-group-note">
                  전공·교양 외 나머지 과목은 기타 페이지에서 확인할 수 있어요.
                  태그 관리 페이지에서 직접 영역(태그)을 만들어 분류할 수 있어요.
                </p>
              </div>
            </div>

            <div className="guide-notice">
              <span className="guide-notice-title">⚠️ 태그의 목표 학점은 반드시 직접 설정해주세요</span>
              <span>자동 생성된 영역(태그)의 목표 학점은 <strong>기본값 0학점</strong>으로 설정돼요.</span>
              <span>목표 학점이 0이면 달성률 그래프가 표시되지 않고 이수 학점 숫자만 표시돼요.</span>
              <span><strong>태그 관리 페이지</strong>에서 본인 졸업 기준에 맞게 목표 학점을 수정해주세요.</span>
            </div>

            <div className="guide-tip">
              💡 영역(태그)은 자유롭게 추가·삭제·수정할 수 있어요. 자동 생성된 영역이 본인 기준과 맞지 않으면 언제든지 변경하세요.
            </div>

            <button className="btn-guide-primary" onClick={() => navigate('/tags')}>
              <FiTag size={15}/> 태그 관리하러 가기
            </button>
          </div>
        )}

        {/* ── 졸업학점 설정 */}
        {activeTab === 'credits' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              졸업학점 설정은 <strong>내 졸업 기준 학점이 얼마인지 알려주는 곳</strong>이에요.
              여기서 설정한 값을 기준으로 전공·교양·총 학점 달성률이 계산돼요.
            </p>

            <div className="guide-notice">
              <span className="guide-notice-title">⚙️ 설정하지 않으면 기본값으로 계산돼요</span>
              <span>설정을 따로 하지 않으면 아래 기본값으로 집계돼요.</span>
              <span>· 총 졸업 이수학점: <strong>130학점</strong></span>
              <span>· 전공 목표학점: <strong>60학점</strong></span>
              <span>· 교양 목표학점: <strong>30학점</strong></span>
              <span className="guide-notice-sub">본인의 졸업 기준과 다르다면 반드시 설정을 변경해주세요.</span>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-step-num">1</span>
                <div>
                  <p className="guide-step-title">설정 열기</p>
                  <p className="guide-step-desc">
                    우측 상단 <strong>프로필 아이콘</strong>을 클릭하면 설정 모달이 열려요.
                  </p>
                </div>
              </div>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-step-num">2</span>
                <div>
                  <p className="guide-step-title">학점 입력</p>
                  <p className="guide-step-desc">
                    <strong>총 졸업 이수학점 / 전공 목표학점 / 교양 목표학점</strong>을 입력해요.
                    기타 카테고리는 별도 설정 없이 태그로만 관리해요.
                  </p>
                </div>
              </div>
            </div>

            <div className="guide-step">
              <div className="guide-step-header">
                <span className="guide-step-num">3</span>
                <div>
                  <p className="guide-step-title">저장</p>
                  <p className="guide-step-desc">
                    저장하면 모든 이수 현황 페이지의 학점 계산이 즉시 반영돼요.
                  </p>
                </div>
              </div>
            </div>

            <div className="guide-tip">
              💡 학과마다 졸업 기준이 달라요. 학교 홈페이지나 요람에서 본인 학과의 졸업 기준을 확인해보세요.
            </div>
          </div>
        )}

        {/* ── 과목 모아보기 */}
        {activeTab === 'catalog' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              과목 모아보기는 관리자가 등록하거나 시스템이 검증한 <strong>과목 정보를 한눈에 찾아볼 수 있는 페이지</strong>예요.
            </p>

            <div className="guide-category-cards">
              <div className="guide-category-card">
                <div className="guide-category-top">
                  <span className="guide-cat-badge major">관리자 등록</span>
                </div>
                <p>관리자가 직접 확인하고 등록한 과목</p>
                <ul>
                  <li>요람 버전(년도)이 표시</li>
                  <li>최근 이수 년도와 학기, 학번별 이수 현황 확인</li>
                </ul>
              </div>
              <div className="guide-category-card">
                <div className="guide-category-top">
                  <span className="guide-cat-badge general">시스템 검증완료</span>
                </div>
                <p>실제 이수 과목 데이터를 시스템이 검증해서 등록된 과목</p>
                <ul>
                  <li>최근 이수 년도와 학기, 학번별 이수 현황 확인</li>
                  <li>실제 개설 이력이 있는 과목</li>
                </ul>
              </div>
              <div className="guide-category-card">
                <div className="guide-category-top">
                  <span className="guide-cat-badge etc">검색 & 필터</span>
                </div>
                <p>다양한 방법으로 원하는 과목을 찾을 수 있어요.</p>
                <ul>
                  <li>과목명 검색, 학점 필터, 검증 유형 필터</li>
                  <li>최근 이수순 / 이수 많은 순 정렬</li>
                </ul>
              </div>
            </div>

            <div className="guide-tip">
              💡 이수 과목 등록 페이지에서도 과목을 검색해서 바로 추가할 수 있어요.
              (성적표 1회 이상 업로드 필요)
            </div>

            <button className="btn-guide-primary" onClick={() => navigate('/catalog')}>
              <FiBook size={15}/> 과목 모아보기 바로가기
            </button>
          </div>
        )}

        {/* ── 수강 시뮬레이션 */}
        {activeTab === 'simulation' && (
          <div className="guide-section">
            <p className="guide-section-desc">
              수강 시뮬레이션은 <strong>앞으로 들을 과목을 학기별로 미리 계획</strong>하고,
              이수 현황이 어떻게 변하는지 실시간으로 확인하는 기능이에요. 계획 수립 용도로 활용하세요.
            </p>

            <div className="guide-sim-steps">
              <div className="guide-sim-step">
                <span className="guide-step-num">1</span>
                <div>
                  <p className="guide-step-title">현재 이수 현황 확인</p>
                  <p className="guide-step-desc">
                    태그별로 설정한 목표 학점 대비 현재 달성률을 확인해요.
                    시뮬레이션 과목을 추가하면 파란색 예정 학점으로 미리 표시돼요.
                  </p>
                </div>
              </div>
              <div className="guide-sim-step">
                <span className="guide-step-num">2</span>
                <div>
                  <p className="guide-step-title">학기 추가</p>
                  <p className="guide-step-desc">
                    년도·학기·학년·최대 수강학점을 설정해서 학기 플랜을 만들어요.
                    여러 학기를 동시에 만들어서 비교해볼 수 있어요.
                  </p>
                </div>
              </div>
              <div className="guide-sim-step">
                <span className="guide-step-num">3</span>
                <div>
                  <p className="guide-step-title">과목 추가</p>
                  <p className="guide-step-desc">
                    카테고리·태그·학점을 선택하고 메모란에 과목명을 자유롭게 입력해요.
                    과목코드나 시간표 정보도 메모에 같이 적어두면 편리해요. 해당 메모는 메인 홈페이지 수강 예정 과목 (학기별 계획 시뮬레이션)에 표시돼요.
                  </p>
                </div>
              </div>
              <div className="guide-sim-step">
                <span className="guide-step-num">4</span>
                <div>
                  <p className="guide-step-title">실시간 현황 확인</p>
                  <p className="guide-step-desc">
                    과목을 추가하면 상단 이수 현황이 실시간으로 업데이트돼요.
                    <strong>파란색</strong>은 시뮬레이션 예정 학점이에요.
                  </p>
                </div>
              </div>
              <div className="guide-sim-step">
                <span className="guide-step-num">5</span>
                <div>
                  <p className="guide-step-title">과목 활성 / 비활성</p>
                  <p className="guide-step-desc">
                    각 과목의 활성 버튼으로 수강 여부를 켜고 끌 수 있어요.
                    비활성화된 과목은 현황 계산에서 제외돼서 여러 시나리오를 비교해볼 수 있어요.
                  </p>
                </div>
              </div>
            </div>

            <div className="guide-tip">
              💡 태그에 목표 학점이 설정돼 있어야 시뮬레이션 현황이 정확하게 표시돼요.
              먼저 태그 관리에서 목표 학점을 설정해주세요.
            </div>

            <button className="btn-guide-primary" onClick={() => navigate('/simulation')}>
              <FiBarChart2 size={15}/> 수강 시뮬레이션 바로가기
            </button>
          </div>
        )}

        {/* ── FAQ */}
        {activeTab === 'faq' && (
          <div className="guide-section">
            <div className="guide-faq-list">
              {FAQ_LIST.map((faq, i) => (
                <div key={i} className={`guide-faq-item ${openFaq === i ? 'open' : ''}`}>
                  <button className="guide-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>Q. {faq.q}</span>
                    {openFaq === i ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
                  </button>
                  {openFaq === i && (
                    <div className="guide-faq-a">A. {faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}