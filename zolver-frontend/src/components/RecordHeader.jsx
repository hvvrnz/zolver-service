import { FiBookOpen, FiExternalLink } from 'react-icons/fi';
import { MdFileUpload } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

/**
 * 페이지 상단 헤더
 * - 제목, 설명
 * - 가이드 링크, 포털 링크  
 * - 업로드 버튼
 */
export default function RecordHeader({ onUpload, uploading }) {
  const navigate = useNavigate();
  
  // 파일 선택했을 때
  function handleFileChange(e) {
    const file = e.target.files?.[0]; // 첫 번째 파일
    if (file) {
      onUpload(file); // 부모에게 파일 전달
    }
  }
  
  return (
    <div className="record-top-wrap">
      {/* 왼쪽: 제목 + 설명 */}
      <div className="record-top-left">
        <h1 className="record-title">이수 과목 등록</h1>
        <p className="record-subtitle">
          성적표는 최초 1회 업로드가 필요해요. 학과·학번은 성적표 기준으로 자동 입력돼요.
        </p>
      </div>
      
      {/* 오른쪽: 버튼들 */}
      <div className="record-top-actions">
        {/* 가이드 버튼 */}
        <button 
          className="btn-how-to" 
          onClick={() => navigate('/guide')}
        >
          <FiBookOpen size={14}/> 이용 가이드
        </button>
        
        {/* 포털 링크 */}
        <a 
          href="https://kis.kku.ac.kr/index.do" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-portal-link"
        >
          <FiExternalLink size={13}/> 학사정보 포털
        </a>
        
        {/* 업로드 버튼 */}
        <label className={`btn-upload-main ${uploading ? 'loading' : ''}`}>
          {uploading ? (
            <>
              <span className="btn-spinner"/> 업로드 중...
            </>
          ) : (
            <>
              <MdFileUpload size={17}/> xlsx 업로드
            </>
          )}
          
          {/* 실제 input (숨겨짐) */}
          <input 
            type="file" 
            accept=".xlsx" 
            hidden 
            disabled={uploading} 
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}