/**
 * 폼 필드 래퍼
 * - label + input을 세트로 묶음
 * - span으로 그리드 컬럼 조절
 */
export default function FormGroup({ 
  label,           // 라벨 텍스트
  children,        // 내부 컨텐츠 (input, select 등)
  span = 1,        // 그리드 컬럼 차지 수 (1 or 2)
  required = false // 필수 여부
}) {
  return (
    <div className={`form-group ${span === 2 ? 'span-2' : ''}`}>
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
    </div>
  );
}