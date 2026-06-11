import { useState, useEffect } from 'react';

/**
 * 전공/기타: 1단계 드롭다운 (tag_group이 실제 이름)
 */
function FlatTagSelect({ cat, value, onChange, tags, disabled }) {
  const catTags = tags[cat] || [];
  return (
    <select
      className="zol-input"
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      style={disabled ? { backgroundColor: 'var(--zol-beige-100)', cursor: 'not-allowed' } : {}}
    >
      <option value="">선택 안함</option>
      {catTags.map(t => (
        <option key={t.tag_id} value={t.tag_group}>
          {t.tag_group || '(이름 없음)'}
        </option>
      ))}
    </select>
  );
}

/**
 * 교양: 2단계 드롭다운
 *
 * [변경사항]
 * - 그룹만 선택해도 저장 가능 (소분류는 선택사항)
 * - 그룹 선택 시 → lecture_category에 tag_group 저장 (onChange로 전달)
 * - 소분류 선택 시 → area에 tag_name 저장 (onAreaChange로 전달)
 * - 기존 값 역추적: area(tag_name) 있으면 소분류까지, 없으면 lecture_category(tag_group)만
 */
function GeneralTagSelect({ groupValue, areaValue, onGroupChange, onAreaChange, tags, disabled }) {
  const generalTags = tags.general || [];
  const generalGroups = tags.general_groups || [...new Set(generalTags.map(t => t.tag_group).filter(Boolean))];

  // 현재 그룹에 속한 소분류 태그들 (tag_name이 있고 tag_group과 다른 것만)
  const subTags = generalTags.filter(t =>
    t.tag_group === groupValue &&
    t.tag_name &&
    t.tag_name !== t.tag_group
  );

  const handleGroupChange = (e) => {
    onGroupChange(e.target.value);
    onAreaChange(''); // 그룹 바뀌면 소분류 초기화
  };

  const handleSubChange = (e) => {
    onAreaChange(e.target.value);
  };

  return (
    <div className="general-tag-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* 1단계: 그룹(대분류) 선택 — 선택만 해도 저장됨 */}
      <select
        className="zol-input"
        value={groupValue || ''}
        onChange={handleGroupChange}
        disabled={disabled}
        style={disabled ? { backgroundColor: 'var(--zol-beige-100)', cursor: 'not-allowed' } : {}}
      >
        <option value="">그룹 선택</option>
        {generalGroups.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      {/* 2단계: 소분류 선택 — 해당 그룹에 소분류 태그가 있을 때만 표시 */}
      {groupValue && subTags.length > 0 && (
        <select
          className="zol-input"
          value={areaValue || ''}
          onChange={handleSubChange}
          disabled={disabled}
          style={disabled ? { backgroundColor: 'var(--zol-beige-100)', cursor: 'not-allowed' } : {}}
        >
          <option value="">소분류 선택 안함 (그룹 전체)</option>
          {subTags.map(t => (
            <option key={t.tag_id} value={t.tag_name}>{t.tag_name}</option>
          ))}
        </select>
      )}

      {/* 소분류 없는 그룹에 대한 안내 */}
      {groupValue && subTags.length === 0 && (
        <p style={{
          fontSize: 11,
          color: 'var(--color-text-disabled)',
          margin: 0,
          padding: '2px 4px',
        }}>
          이 그룹은 소분류 없이 그룹 전체로 분류돼요
        </p>
      )}
    </div>
  );
}

/**
 * 메인: 카테고리에 따라 자동 분기
 *
 * 교양일 때 props:
 *   - value: lecture_category (tag_group)
 *   - areaValue: area (tag_name, 선택사항)
 *   - onChange: lecture_category 변경 핸들러
 *   - onAreaChange: area 변경 핸들러
 *
 * 전공/기타일 때 props:
 *   - value: lecture_category (tag_group)
 *   - onChange: lecture_category 변경 핸들러
 */
export default function TagSelect({ category, value, areaValue, onChange, onAreaChange, tags, disabled }) {
  const safeTags = tags || { major: [], general: [], etc: [], general_groups: [] };

  if (category === 'general') {
    return (
      <GeneralTagSelect
        groupValue={value}
        areaValue={areaValue || ''}
        onGroupChange={(v) => onChange({ target: { value: v } })}
        onAreaChange={(v) => onAreaChange?.({ target: { value: v } })}
        tags={safeTags}
        disabled={disabled}
      />
    );
  }

  return (
    <FlatTagSelect
      cat={category}
      value={value}
      onChange={onChange}
      tags={safeTags}
      disabled={disabled}
    />
  );
}
