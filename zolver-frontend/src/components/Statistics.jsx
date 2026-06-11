// ✅ 올바른 import
import { 
  calculateTotalCredits, 
  calculateCreditsByCategory, 
  isInvalidCourse 
} from '../utils/helpers';

/**
 * 학점 통계 표시
 */
export default function Statistics({ courses }) {
  const totalCredits = calculateTotalCredits(courses);
  const majorCredits = calculateCreditsByCategory(courses, 'major');
  const generalCredits = calculateCreditsByCategory(courses, 'general');
  const etcCredits = calculateCreditsByCategory(courses, 'etc');
  
  return (
    <div className="record-stats-row">
      <StatItem 
        label="전체" 
        value={courses.length}
        unit="과목" 
      />
      
      <div className="record-stat-divider"/>
      
      <StatItem 
        label="유효 취득" 
        value={totalCredits}
        unit="학점" 
        className="primary"
      />
      
      <div className="record-stat-divider"/>
      
      <StatItem 
        label="전공" 
        value={majorCredits}
        unit="학점" 
        className="major"
      />
      
      <div className="record-stat-divider"/>
      
      <StatItem 
        label="교양" 
        value={generalCredits}
        unit="학점" 
        className="general"
      />
      
      <div className="record-stat-divider"/>
      
      <StatItem 
        label="기타" 
        value={etcCredits}
        unit="학점" 
        className="etc"
      />
    </div>
  );
}

function StatItem({ label, value, unit, className = '' }) {
  return (
    <div className="record-stat-item">
      <span className="record-stat-label">{label}</span>
      <strong className={`record-stat-val ${className}`}>
        {value}<span>{unit}</span>
      </strong>
    </div>
  );
}