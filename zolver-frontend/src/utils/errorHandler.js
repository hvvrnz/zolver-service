/**
 * 에러 페이지 표시 함수
 * 
 * URL은 그대로, 화면만 에러 페이지로 바뀜
 */
export function showErrorPage(type) {
  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('showError', {
    detail: { type }
  }));
}

// 사용 예시:
// showErrorPage('500') → 500 에러 페이지 표시
// showErrorPage('503') → 503 에러 페이지 표시