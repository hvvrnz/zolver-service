// 에러 메시지
export const ERROR_MESSAGES = {
  R100: '파일을 찾을 수 없어요.',
  R101: 'xlsx 파일만 업로드 가능해요.',
  R102: '성적표 파일만 올려주세요. (파일 크기가 너무 커요.)',
  R103: '수정된 파일은 업로드할 수 없어요. 원본을 사용해주세요.',
  R104: '파일의 시간 정보가 올바르지 않아요.',
  R105: '숨김 파일은 업로드할 수 없어요.',
  R106: '파일 경로가 올바르지 않아요.',
  R107: '파일 처리 중 오류가 발생했어요.',
  R200: '성적표 내용이 올바르지 않아요.',
  R201: '성적표 형식을 읽지 못했어요.',
  R202: '성적표 구조가 맞지 않아요.',
  R203: '성적표 데이터 추출에 실패했어요.',
  R204: '성적표 데이터 변환에 실패했어요.',
  R205: 'DB 저장에 실패했어요.',
  R000: '시스템 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
  '세션이 없습니다': '로그인 세션이 만료됐어요.',
};

// 카테고리 선택 옵션
export const SYS_CATEGORY_OPTIONS = [
  { value: 'all',     label: '전체' },
  { value: 'major',   label: '전공' },
  { value: 'general', label: '교양' },
  { value: 'etc',     label: '기타' },
];

// 뱃지 필터 옵션
export const BADGE_OPTIONS = [
  { value: 'all',        label: '전체' },
  { value: 'curriculum', label: '관리자 등록' },
  { value: 'verified',   label: '시스템 검증완료' },
];

// 빈 폼 초기값 — area 컬럼명이 DB에서 tag_group으로 변경됨
export const EMPTY_FORM = {
  lecture_name: '',
  lecture_credit: 3,
  system_category: 'major',
  lecture_category: '',
  lecture_code: 'MANUAL',
  completion_year: new Date().getFullYear(),
  completion_semester: '1학기',
  course_grade: '',
  area: '',
  delete_type: null,
};

// 무효 성적 목록
export const INVALID_GRADES = ['N', 'NP', 'F'];
export const FORCE_INVALID = ['N', 'NP', 'F'];

// 학기 순서 (정렬용)
export const SEM_ORDER = ['1학기', '2학기', '하계 계절학기', '동계 계절학기'];

export const GRADE_OPTIONS = [
  { value: 'A+',  label: 'A+' },
  { value: 'A',  label: 'A' },
  { value: 'B+',  label: 'B+' },
  { value: 'B',  label: 'B' },
  { value: 'C+',  label: 'C+' },
  { value: 'C',  label: 'C' },
  { value: 'D+',  label: 'D+' },
  { value: 'D',  label: 'D' },
  { value: 'F',   label: 'F'  },
  { value: 'P',   label: 'P'  },
  { value: 'NP',  label: 'NP' },
  { value: 'N',   label: 'N'  },
];