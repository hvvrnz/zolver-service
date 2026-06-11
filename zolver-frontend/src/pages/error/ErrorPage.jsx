// src/pages/error/ErrorPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import './ErrorPage.css';

// ✅ 이미지 import
import img403 from '../../assets/403error.png';
import img404 from '../../assets/404error.png';
import img500 from '../../assets/500error.png';
import img503 from '../../assets/503error.png';

export default function ErrorPage({ 
  code = '404',
  imagePath,  // ← 이제 import한 이미지 객체를 받음
  title = '페이지를 찾을 수 없습니다',
  description = '요청하신 페이지가 존재하지 않거나 이동되었습니다.',
  showBackButton = true,
  showHomeButton = true
}) {
  const navigate = useNavigate();
  
  return (
    <div className="error-page-container">
      <div className="error-content">
        <div className="error-image-wrapper">
          <img 
            src={imagePath}  // ✅ import한 객체 사용
            alt={`${code} Error`}
            className="error-image"
          />
        </div>
        
        <h1 className="error-title">{title}</h1>
        <p className="error-description">{description}</p>
        
        <div className="error-actions">
          {showHomeButton && (
            <Link to="/" className="error-btn error-btn-primary">
              홈으로 가기
            </Link>
          )}

          {showBackButton && (
            <button 
              onClick={() => navigate(-1)} 
              className="error-btn error-btn-secondary"
            >
              이전 페이지
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ✅ 각 에러 페이지 - import한 이미지 전달
export function NotFoundPage() {
  return (
    <ErrorPage 
      code="404"
      imagePath={img404}  // ✅ 문자열 아닌 import 객체
      title="페이지를 찾을 수 없습니다"
      description="요청하신 페이지가 존재하지 않거나 이동되었습니다."
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorPage 
      code="403"
      imagePath={img403}  // ✅
      title="접근 권한이 없습니다"
      description="이 페이지에 접근할 권한이 없습니다."
      showBackButton={false}
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorPage 
      code="500"
      imagePath={img500}  // ✅
      title="서버 오류가 발생했습니다"
      description="일시적인 오류입니다. 잠시 후 다시 시도해주세요."
    />
  );
}

export function ServiceUnavailablePage() {
  return (
    <ErrorPage 
      code="503"
      imagePath={img503}  // ✅
      title="서비스 점검 중입니다"
      description="더 나은 서비스 제공을 위해 시스템 점검 중입니다."
      showBackButton={false}
      showHomeButton={false}
    />
  );
}