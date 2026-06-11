import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiX,
  FiChevronDown, FiChevronUp, FiInfo,
} from 'react-icons/fi';
import { getTags, createTag, updateTag, deleteTag } from '../../api/tags';
import './TagPage.css';

const DEFAULT_GENERAL_GROUPS = ['기초', '심화', '소양', '인성'];
const CATEGORIES = [
  { value: 'major',   label: '전공', color: 'major'   },
  { value: 'general', label: '교양', color: 'general' },
  { value: 'etc',     label: '기타', color: 'etc'     },
];
const EMPTY_FORM = { tag_name: '', min_credits: 0, tag_group: '' };

// 소분류가 없는 그룹 루트 태그 여부 (tag_name 비어있거나 tag_group과 동일)
function isGroupRoot(tag) {
  return !tag.tag_name || tag.tag_name === tag.tag_group;
}

// ── 전공/기타용 태그 아이템
function FlatTagItem({
  tag, activeTab,
  editId, editForm, editNewGroupInput,
  onEditOpen, onEditSave, onEditFormChange, onEditCreditsChange,
  onEditNewGroupChange, onEditCancel, onDelete,
  isFocused, itemRef,
}) {
  const isEditing = editId === tag.tag_id;

  return (
    <div
      ref={itemRef}
      className={`tag-item ${isFocused ? 'tag-item-focused' : ''}`}
    >
      {isEditing ? (
        <div className="tag-item-edit">
          <input
            className="zol-input tag-edit-input"
            placeholder="세부영역 이름 (예: 전필, 다전공)"
            value={editNewGroupInput}
            onChange={e => onEditNewGroupChange(e.target.value)}
            autoFocus
          />
          <input
            className="zol-input tag-edit-credits"
            type="number" min="0"
            value={editForm.min_credits}
            onChange={e => onEditCreditsChange(e.target.value)}
          />
          <button className="btn-tag-confirm" onClick={() => onEditSave(tag.tag_id)}>
            <FiCheck size={14}/>
          </button>
          <button className="btn-tag-cancel" onClick={onEditCancel}>
            <FiX size={14}/>
          </button>
        </div>
      ) : (
        <div className="tag-item-view">
          <div className="tag-item-left">
            <span className={`tag-chip ${activeTab}`}>{tag.tag_group || '미지정'}</span>
            {tag.min_credits != null && (
              <span className="tag-min-credit">최소 {tag.min_credits}학점</span>
            )}
          </div>
          <div className="tag-item-actions">
            <button onClick={() => onEditOpen(tag)} title="수정"><FiEdit2 size={13}/></button>
            <button onClick={() => onDelete(tag.tag_id)} title="삭제" className="danger"><FiTrash2 size={13}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 교양 그룹 섹션 (그룹 자체 + 소분류 목록)
function GeneralGroupSection({
  group, groupRootTag, subTags,
  generalGroups,
  editId, editForm, editShowNewGroup, editNewGroupInput,
  onEditOpen, onEditSave, onEditFormChange, onEditCreditsChange,
  onEditNewGroupChange, onEditShowNewGroup, onEditCancel, onDelete,
  focusTagId, focusedRef,
  onAddSub,  // 이 그룹에 소분류 추가 폼 열기
}) {
  const [collapsed, setCollapsed] = useState(false);
  // 그룹 root와 소분류 min_credits는 별개 — 합산하지 않음
  const rootCredits = groupRootTag?.min_credits || 0;
  const subCredits  = subTags.reduce((s, t) => s + (t.min_credits || 0), 0);

  return (
    <div className="tag-group-section">
      {/* 그룹 헤더 */}
      <button className="tag-group-header" onClick={() => setCollapsed(p => !p)}>
        <div className="tag-group-header-left">
          {collapsed ? <FiChevronDown size={14}/> : <FiChevronUp size={14}/>}
          <span className="tag-group-name">{group}</span>
          <span className="tag-group-meta">
            {rootCredits > 0 && <span>{group} 최소 {rootCredits}학점</span>}
            {rootCredits > 0 && subCredits > 0 && <span> · </span>}
            {subTags.length > 0 ? `소분류 ${subTags.length}개 ` : ''}
            {rootCredits === 0 && subCredits === 0 && <span>학점 미설정</span>}
          </span>
        </div>
        <div className="tag-group-header-right" onClick={e => e.stopPropagation()}>
          {/* 그룹 루트 태그 수정 (학점 설정) */}
          {groupRootTag && (
            <button
              className="tag-group-action-btn"
              onClick={() => onEditOpen(groupRootTag)}
              title="그룹 학점 설정"
            >
              <FiEdit2 size={12}/>
            </button>
          )}
          {/* 이 그룹에 소분류 추가 */}
          <button
            className="tag-group-action-btn"
            onClick={() => onAddSub(group)}
            title="소분류 추가"
          >
            <FiPlus size={12}/>
          </button>
          {/* 그룹 루트 태그 삭제 */}
          {groupRootTag && (
            <button
              className="tag-group-action-btn danger"
              onClick={() => onDelete(groupRootTag.tag_id)}
              title="그룹 삭제"
            >
              <FiTrash2 size={12}/>
            </button>
          )}
        </div>
      </button>

      {/* 그룹 루트 편집 모드 (학점만) */}
      {groupRootTag && editId === groupRootTag.tag_id && (
        <div className="tag-group-edit-row">
          <span className="tag-group-edit-label">
            <FiInfo size={11}/> 그룹 전체 최소 이수학점
          </span>
          <input
            className="zol-input tag-edit-credits"
            type="number" min="0"
            value={editForm.min_credits}
            onChange={e => onEditCreditsChange(e.target.value)}
            autoFocus
          />
          <button className="btn-tag-confirm" onClick={() => onEditSave(groupRootTag.tag_id)}>
            <FiCheck size={14}/>
          </button>
          <button className="btn-tag-cancel" onClick={onEditCancel}>
            <FiX size={14}/>
          </button>
        </div>
      )}

      {/* 소분류 목록 */}
      {!collapsed && subTags.length > 0 && (
        <div className="tag-sub-items">
          {subTags.map(tag => {
            const isEditing = editId === tag.tag_id;
            const isFocused = tag.tag_id === focusTagId;
            return (
              <div
                key={tag.tag_id}
                ref={isFocused ? focusedRef : null}
                className={`tag-item tag-item-sub ${isFocused ? 'tag-item-focused' : ''}`}
              >
                {isEditing ? (
                  <div className="tag-item-edit">
                    {editShowNewGroup ? (
                      <div className="tag-new-group-input">
                        <input
                          className="zol-input tag-edit-group"
                          placeholder="새 그룹 이름"
                          value={editNewGroupInput}
                          onChange={e => onEditNewGroupChange(e.target.value)}
                          autoFocus
                        />
                        <button className="btn-tag-cancel" onClick={() => onEditShowNewGroup(false)}>
                          <FiX size={12}/>
                        </button>
                      </div>
                    ) : (
                      <select
                        className="zol-input tag-edit-group"
                        value={editForm.tag_group}
                        onChange={e => {
                          if (e.target.value === '__new__') onEditShowNewGroup(true);
                          else onEditFormChange('tag_group', e.target.value);
                        }}
                      >
                        <option value="">그룹 없음</option>
                        {generalGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        <option value="__new__">+ 새 그룹</option>
                      </select>
                    )}
                    <input
                      className="zol-input tag-edit-input"
                      placeholder="소분류 이름 (예: 인간과문화)"
                      value={editForm.tag_name}
                      onChange={e => onEditFormChange('tag_name', e.target.value)}
                      autoFocus={!editShowNewGroup}
                    />
                    <input
                      className="zol-input tag-edit-credits"
                      type="number" min="0"
                      value={editForm.min_credits}
                      onChange={e => onEditCreditsChange(e.target.value)}
                    />
                    <button className="btn-tag-confirm" onClick={() => onEditSave(tag.tag_id)}>
                      <FiCheck size={14}/>
                    </button>
                    <button className="btn-tag-cancel" onClick={onEditCancel}>
                      <FiX size={14}/>
                    </button>
                  </div>
                ) : (
                  <div className="tag-item-view">
                    <div className="tag-item-left">
                      <span className="tag-sub-indent-line"/>
                      <span className="tag-chip general tag-chip-sub">{tag.tag_name}</span>
                      <span className="tag-min-credit">최소 {tag.min_credits}학점</span>
                    </div>
                    <div className="tag-item-actions">
                      <button onClick={() => onEditOpen(tag)} title="수정"><FiEdit2 size={13}/></button>
                      <button onClick={() => onDelete(tag.tag_id)} title="삭제" className="danger"><FiTrash2 size={13}/></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 소분류 없을 때 안내 */}
      {!collapsed && subTags.length === 0 && (
        <div className="tag-group-no-sub">
          <FiInfo size={11}/>
          소분류 없이 그룹 전체로 과목을 분류해요.
          <button className="tag-group-add-sub-btn" onClick={() => onAddSub(group)}>
            <FiPlus size={11}/> 소분류 추가
          </button>
        </div>
      )}
    </div>
  );
}

export default function TagPage() {
  const location = useLocation();
  const focusTagId = location.state?.focusTagId ?? null;

  const [tags, setTags]                   = useState({ major: [], general: [], etc: [] });
  const [generalGroups, setGeneralGroups] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('major');

  // 추가 폼 타입: null | 'group' | 'sub'
  const [showForm, setShowForm]           = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [formLoading, setFormLoading]     = useState(false);
  const [showNewGroup, setShowNewGroup]   = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  // 소분류 추가 시 미리 지정된 그룹
  const [formPresetGroup, setFormPresetGroup] = useState('');

  const [editId, setEditId]               = useState(null);
  const [editForm, setEditForm]           = useState(EMPTY_FORM);
  const [editShowNewGroup, setEditShowNewGroup] = useState(false);
  const [editNewGroupInput, setEditNewGroupInput] = useState('');

  const focusedRef = useRef(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTags();
      const { general_groups, ...tagData } = res.data;
      const merged = [
        ...DEFAULT_GENERAL_GROUPS,
        ...(general_groups || []).filter(g => !DEFAULT_GENERAL_GROUPS.includes(g)),
      ];
      setTags(tagData);
      setGeneralGroups(merged);
    } catch (err) {
      console.error('태그 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  // focusTagId → 교양 탭 이동 + 편집 모드
  useEffect(() => {
    if (!focusTagId || loading) return;
    const target = (tags.general || []).find(t => t.tag_id === focusTagId);
    if (!target) return;
    setActiveTab('general');
    setEditId(target.tag_id);
    setEditForm({ tag_name: target.tag_name || '', min_credits: target.min_credits || 0, tag_group: target.tag_group || '' });
    setEditNewGroupInput(target.tag_group || '');
    setEditShowNewGroup(false);
  }, [focusTagId, loading, tags.general]);

  useEffect(() => {
    if (focusTagId && focusedRef.current) {
      setTimeout(() => focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    }
  }, [focusTagId, editId]);

  const currentTags     = tags[activeTab] || [];
  const currentCat      = CATEGORIES.find(c => c.value === activeTab);
  const totalMinCredits = currentTags.reduce((s, t) => s + (t.min_credits || 0), 0);

  // 교양: 그룹별로 정리
  // - groupRootTag: tag_name 없거나 tag_group과 같은 태그 (그룹 자체)
  // - subTags: tag_name이 있고 tag_group과 다른 태그 (소분류)
  const generalTagsByGroup = generalGroups.reduce((acc, g) => {
    const inGroup = (tags.general || []).filter(t => t.tag_group === g);
    acc[g] = {
      root: inGroup.find(isGroupRoot) || null,
      subs: inGroup.filter(t => !isGroupRoot(t)),
    };
    return acc;
  }, {});
  const ungrouped = (tags.general || []).filter(t => !t.tag_group);

  const handleCreateGroup = async () => {
    const finalGroup = showNewGroup ? newGroupInput.trim() : form.tag_group.trim();
    if (!finalGroup) return alert('그룹 이름을 입력해주세요.');
    setFormLoading(true);
    try {
      // 그룹 추가: tag_name은 비워서 그룹 루트 태그 생성
      await createTag({
        system_category: 'general',
        tag_name: '',
        min_credits: Number(form.min_credits) || 0,
        tag_group: finalGroup,
      });
      await fetchTags();
      setForm(EMPTY_FORM); setShowForm(null); setShowNewGroup(false); setNewGroupInput('');
    } catch (err) {
      alert(`추가 실패: ${err.response?.data?.detail || err.message}`);
    } finally { setFormLoading(false); }
  };

  const handleCreateSub = async () => {
    if (!form.tag_name.trim()) return alert('소분류 이름을 입력해주세요.');
    const finalGroup = formPresetGroup || (showNewGroup ? newGroupInput.trim() : form.tag_group);
    if (!finalGroup) return alert('그룹을 선택하거나 입력해주세요.');
    setFormLoading(true);
    try {
      await createTag({
        system_category: 'general',
        tag_name: form.tag_name.trim(),
        min_credits: Number(form.min_credits) || 0,
        tag_group: finalGroup,
      });
      await fetchTags();
      setForm(EMPTY_FORM); setShowForm(null); setShowNewGroup(false); setNewGroupInput(''); setFormPresetGroup('');
    } catch (err) {
      alert(`추가 실패: ${err.response?.data?.detail || err.message}`);
    } finally { setFormLoading(false); }
  };

  const handleCreateFlat = async () => {
    if (!form.tag_group.trim()) return alert('세부영역 이름을 입력해주세요.');
    setFormLoading(true);
    try {
      await createTag({ system_category: activeTab, tag_name: '', min_credits: Number(form.min_credits) || 0, tag_group: form.tag_group.trim() });
      await fetchTags();
      setForm(EMPTY_FORM); setShowForm(null);
    } catch (err) {
      alert(`추가 실패: ${err.response?.data?.detail || err.message}`);
    } finally { setFormLoading(false); }
  };

  const handleEditOpen = (tag) => {
    setEditId(tag.tag_id);
    setEditForm({ tag_name: tag.tag_name || '', min_credits: tag.min_credits || 0, tag_group: tag.tag_group || '' });
    setEditNewGroupInput(tag.tag_group || '');
    setEditShowNewGroup(false);
  };

  const handleEditSave = async (tagId) => {
    const isGeneral = activeTab === 'general';
    try {
      if (isGeneral) {
        const tag = (tags.general || []).find(t => t.tag_id === tagId);
        const isRoot = tag && isGroupRoot(tag);
        if (isRoot) {
          // 그룹 루트: 학점만 수정
          await updateTag(tagId, { system_category: 'general', tag_name: '', min_credits: Number(editForm.min_credits) || 0, tag_group: editForm.tag_group });
        } else {
          // 소분류: 이름 + 학점 수정
          if (!editForm.tag_name.trim()) return alert('소분류 이름을 입력해주세요.');
          const finalGroup = editShowNewGroup ? editNewGroupInput.trim() : editForm.tag_group;
          await updateTag(tagId, { system_category: 'general', tag_name: editForm.tag_name.trim(), min_credits: Number(editForm.min_credits) || 0, tag_group: finalGroup || null });
        }
      } else {
        if (!editNewGroupInput.trim()) return alert('세부영역 명칭을 입력해주세요.');
        await updateTag(tagId, { system_category: activeTab, tag_name: '', min_credits: Number(editForm.min_credits) || 0, tag_group: editNewGroupInput.trim() });
      }
      await fetchTags();
      setEditId(null); setEditShowNewGroup(false); setEditNewGroupInput('');
    } catch (err) {
      alert(`수정 실패: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('태그를 삭제할까요?')) return;
    try {
      await deleteTag(tagId);
      await fetchTags();
    } catch (err) {
      alert(`삭제 실패: ${err.response?.data?.detail || err.message}`);
    }
  };

  const openAddSub = (group) => {
    setFormPresetGroup(group);
    setForm({ ...EMPTY_FORM, tag_group: group });
    setShowForm('sub');
  };

  const sharedEditProps = {
    activeTab, generalGroups,
    editId, editForm, editShowNewGroup, editNewGroupInput,
    onEditOpen:          handleEditOpen,
    onEditSave:          handleEditSave,
    onEditFormChange:    (field, val) => setEditForm(prev => ({ ...prev, [field]: val })),
    onEditCreditsChange: (val) => setEditForm(prev => ({ ...prev, min_credits: val })),
    onEditNewGroupChange:(val) => setEditNewGroupInput(val),
    onEditShowNewGroup:  (show) => { setEditShowNewGroup(show); if (!show) setEditNewGroupInput(''); },
    onEditCancel:        () => { setEditId(null); setEditShowNewGroup(false); setEditNewGroupInput(''); },
    onDelete:            handleDelete,
    focusTagId,
    focusedRef,
  };

  return (
    <div className="tag-page">
      <div className="tag-page-header">
        <h1 className="tag-page-title">태그 관리</h1>
        <p className="tag-page-subtitle">전공·교양·기타 과목의 세부 영역을 태그로 관리하고 최소 이수학점을 설정해요.</p>
      </div>

      <div className="tag-tabs">
        {CATEGORIES.map(cat => (
          <button key={cat.value}
            className={`tag-tab ${activeTab === cat.value ? `active ${cat.color}` : ''}`}
            onClick={() => { setActiveTab(cat.value); setShowForm(null); setEditId(null); }}
          >
            {cat.label}
            <span className="tag-tab-count">{(tags[cat.value] || []).length}</span>
          </button>
        ))}
      </div>

      <div className="tag-content">
        <div className="tag-list-section">
          <div className="tag-list-header">
            <div className="tag-list-header-left">
              <span className="tag-list-title">{currentCat?.label} 태그</span>
              {activeTab === 'general' && (
                <span className="tag-list-edit-hint">
                  <FiInfo size={10}/> 그룹에 소분류를 추가하거나 그룹만으로 분류할 수 있어요
                </span>
              )}
            </div>
            <span className="tag-list-meta">최소 이수 합계 <strong>{totalMinCredits}</strong>학점</span>
          </div>

          {loading ? (
            <div className="tag-loading"><div className="loading-spinner"/></div>
          ) : currentTags.length === 0 && !showForm ? (
            <div className="tag-empty">
              <p>등록된 태그가 없어요</p>
              <p className="tag-empty-sub">아래 버튼으로 태그를 추가해보세요</p>
            </div>
          ) : (
            <div className="tag-list">
              {activeTab === 'general' ? (
                <>
                  {generalGroups.map(group => {
                    const { root, subs } = generalTagsByGroup[group] || { root: null, subs: [] };
                    if (!root && subs.length === 0) return null;
                    return (
                      <GeneralGroupSection
                        key={group}
                        group={group}
                        groupRootTag={root}
                        subTags={subs}
                        onAddSub={openAddSub}
                        {...sharedEditProps}
                      />
                    );
                  })}
                  {ungrouped.length > 0 && (
                    <div className="tag-group-section">
                      <div className="tag-group-header-plain">미분류</div>
                      <div className="tag-group-items">
                        {ungrouped.map(tag => (
                          <FlatTagItem
                            key={tag.tag_id} tag={tag}
                            {...sharedEditProps}
                            isFocused={tag.tag_id === focusTagId}
                            itemRef={tag.tag_id === focusTagId ? focusedRef : null}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                currentTags.map(tag => (
                  <FlatTagItem
                    key={tag.tag_id} tag={tag}
                    {...sharedEditProps}
                    isFocused={false}
                    itemRef={null}
                  />
                ))
              )}
            </div>
          )}

          {/* ── 추가 버튼 영역 */}
          {!showForm && (
            activeTab === 'general' ? (
              <div className="tag-add-btn-row">
                <button className="btn-add-tag" onClick={() => { setShowForm('group'); setForm(EMPTY_FORM); setFormPresetGroup(''); }}>
                  <FiPlus size={14}/> 그룹 추가
                </button>
                <button className="btn-add-tag btn-add-sub" onClick={() => { setShowForm('sub'); setForm(EMPTY_FORM); setFormPresetGroup(''); }}>
                  <FiPlus size={14}/> 소분류 추가
                </button>
              </div>
            ) : (
              <button className="btn-add-tag" onClick={() => { setShowForm('flat'); setForm(EMPTY_FORM); }}>
                <FiPlus size={14}/> 태그 추가
              </button>
            )
          )}

          {/* ── 그룹 추가 폼 */}
          {showForm === 'group' && (
            <div className="tag-add-form">
              <div className="tag-add-form-title">
                <FiPlus size={13}/> 새 그룹 추가
              </div>
              <div className="form-group">
                <label>그룹 이름 *</label>
                <input className="zol-input" placeholder="새 그룹 이름 (예: 기초, 소양)"
                  value={form.tag_group} onChange={e => setForm({ ...form, tag_group: e.target.value })} autoFocus/>
                <p className="form-field-note">
                  <FiInfo size={10}/> 그룹만 만들어도 바로 과목을 분류할 수 있어요. 소분류는 나중에 추가할 수 있어요.
                </p>
              </div>
              <div className="form-group">
                <label>그룹 최소 이수학점 <span className="form-label-hint">(그룹 전체 기준)</span></label>
                <input className="zol-input" type="number" min="0"
                  value={form.min_credits} onChange={e => setForm({ ...form, min_credits: e.target.value })}/>
              </div>
              <div className="tag-add-form-actions">
                <button className="btn-cancel" onClick={() => { setShowForm(null); setForm(EMPTY_FORM); }}>취소</button>
                <button className="btn-save" onClick={handleCreateGroup} disabled={formLoading}>
                  {formLoading ? '저장 중...' : '그룹 추가'}
                </button>
              </div>
            </div>
          )}

          {/* ── 소분류 추가 폼 */}
          {showForm === 'sub' && (
            <div className="tag-add-form tag-add-form-sub">
              <div className="tag-add-form-title">
                <FiPlus size={13}/> 소분류 추가
              </div>
              <div className="form-group">
                <label>그룹 (대분류) *</label>
                {formPresetGroup ? (
                  <div className="tag-preset-group-display">
                    <span className="tag-chip general">{formPresetGroup}</span>
                    <button className="tag-preset-group-clear" onClick={() => setFormPresetGroup('')}>
                      <FiX size={11}/> 변경
                    </button>
                  </div>
                ) : showNewGroup ? (
                  <div className="tag-new-group-input">
                    <input className="zol-input" placeholder="새 그룹 이름"
                      value={newGroupInput} onChange={e => setNewGroupInput(e.target.value)} autoFocus/>
                    <button className="btn-tag-cancel" onClick={() => { setShowNewGroup(false); setNewGroupInput(''); }}>
                      <FiX size={13}/>
                    </button>
                  </div>
                ) : (
                  <select className="zol-input" value={form.tag_group}
                    onChange={e => {
                      if (e.target.value === '__new__') { setShowNewGroup(true); setForm({ ...form, tag_group: '' }); }
                      else setForm({ ...form, tag_group: e.target.value });
                    }}
                  >
                    <option value="">그룹 선택</option>
                    {generalGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="__new__">+ 새 그룹 추가</option>
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>소분류 이름 * <span className="form-label-hint">내 학교 영역명으로 입력 (예: 인간과문화)</span></label>
                <input className="zol-input" placeholder="소분류 이름 입력"
                  value={form.tag_name} onChange={e => setForm({ ...form, tag_name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleCreateSub()}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>최소 이수학점</label>
                <input className="zol-input" type="number" min="0"
                  value={form.min_credits} onChange={e => setForm({ ...form, min_credits: e.target.value })}/>
              </div>
              <div className="tag-add-form-actions">
                <button className="btn-cancel" onClick={() => { setShowForm(null); setForm(EMPTY_FORM); setShowNewGroup(false); setNewGroupInput(''); setFormPresetGroup(''); }}>취소</button>
                <button className="btn-save" onClick={handleCreateSub} disabled={formLoading}>
                  {formLoading ? '저장 중...' : '소분류 추가'}
                </button>
              </div>
            </div>
          )}

          {/* ── 전공/기타 추가 폼 */}
          {showForm === 'flat' && (
            <div className="tag-add-form">
              <div className="form-group">
                <label>세부영역 이름 *</label>
                <input className="zol-input" placeholder="세부영역 명칭 입력 (예: 전필, 전선, 다전공)"
                  value={form.tag_group} onChange={e => setForm({ ...form, tag_group: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleCreateFlat()} autoFocus
                />
              </div>
              <div className="form-group">
                <label>최소 이수학점</label>
                <input className="zol-input" type="number" min="0"
                  value={form.min_credits} onChange={e => setForm({ ...form, min_credits: e.target.value })}/>
              </div>
              <div className="tag-add-form-actions">
                <button className="btn-cancel" onClick={() => { setShowForm(null); setForm(EMPTY_FORM); }}>취소</button>
                <button className="btn-save" onClick={handleCreateFlat} disabled={formLoading}>
                  {formLoading ? '저장 중...' : '태그 추가'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tag-guide-section">
          <div className="tag-guide-card">
            <p className="tag-guide-title">태그 사용 안내</p>
            <div className="tag-guide-list">
              <div className="tag-guide-item">
                <span className="tag-chip major">전공필수</span>
                <span>전공 필수 이수 과목 묶음</span>
              </div>
              <div className="tag-guide-item">
                <span className="tag-chip major">전공선택</span>
                <span>전공 선택 이수 과목 묶음</span>
              </div>
              <div className="tag-guide-item">
                <span className="tag-chip general">인간과문화</span>
                <span>교양 소분류 영역 태그 예시</span>
              </div>
            </div>
            <p className="tag-guide-note">
              태그를 만들면 이수 현황 페이지에서 태그별로 과목을 묶어서 볼 수 있어요.
              최소 이수학점을 설정하면 달성 여부를 확인할 수 있어요.
            </p>
          </div>

          <div className="tag-guide-card tag-guide-card-tip">
            <p className="tag-guide-title">교양 태그 구조</p>
            <p className="tag-guide-note" style={{ paddingTop: 0, borderTop: 'none' }}>
              <strong style={{ color: '#185FA5' }}>그룹만 있는 경우</strong><br/>
              과목 등록 시 그룹을 선택하면 그룹 전체로 분류돼요.<br/><br/>
              <strong style={{ color: '#185FA5' }}>소분류가 있는 경우</strong><br/>
              그룹 선택 후 소분류까지 지정할 수 있어요. 소분류 미지정 과목은 그룹 전체로 분류돼요.<br/><br/>
              <span className="tag-chip general" style={{ fontSize: 11 }}>심화</span> 그룹 →
              <span className="tag-chip general" style={{ fontSize: 11, marginLeft: 4 }}>인간과문화</span>
              <span className="tag-chip general" style={{ fontSize: 11, marginLeft: 4 }}>과학과기술</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
