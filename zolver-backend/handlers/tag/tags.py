from sqlalchemy.ext.asyncio import AsyncSession
from repositories import tag_repo


async def get_tags(user_id: int, db: AsyncSession):
    tags = await tag_repo.get_tags_by_user(db, user_id)
    grouped = {"major": [], "general": [], "etc": []}
    general_groups = []

    for tag in tags:
        cat = tag["system_category"]
        if cat in grouped:
            grouped[cat].append(tag)
        if cat == "general" and tag.get("tag_group"):
            if tag["tag_group"] not in general_groups:
                general_groups.append(tag["tag_group"])

    return {**grouped, "general_groups": general_groups}


async def create_tag(
    user_id: int,
    system_category: str,
    tag_name: str,
    min_credits: int,
    db: AsyncSession,
    tag_group: str = None
):
    if system_category not in ("major", "general", "etc"):
        raise ValueError("유효하지 않은 카테고리예요.")

    # 교양은 tag_name 필수, 전공/기타는 tag_group 필수
    if system_category == "general":
        if tag_name and not tag_name.strip():
            raise ValueError("태그 이름을 입력해주세요.")
        if not tag_group or not tag_group.strip():
            raise ValueError("그룹 이름을 입력해주세요.")
    else:
        if not tag_group or not tag_group.strip():
            raise ValueError("세부영역 이름을 입력해주세요.")

    tag_id = await tag_repo.create_tag(
        db=db,
        user_id=user_id,
        system_category=system_category,
        tag_name=tag_name or "",
        tag_group=tag_group,
        min_credits=min_credits
    )
    return {"tag_id": tag_id, "message": "태그가 생성됐어요."}


async def update_tag(
    user_id: int,
    tag_id: int,
    tag_name: str,
    min_credits: int,
    db: AsyncSession,
    tag_group: str = None
):
    """
    태그 수정
    - 교양(general): tag_name, tag_group, min_credits 모두 수정 가능
    - 전공/기타: tag_group(세부영역 이름), min_credits 수정 가능
                 (tag_name은 전공/기타에서 사용하지 않으므로 빈 문자열로 저장)
    """
    existing_tag = await tag_repo.get_tag_by_id(db, tag_id, user_id)
    if not existing_tag:
        raise ValueError("태그를 찾을 수 없어요.")

    system_category = existing_tag.get("system_category")

    if system_category == "general":
        # 그룹 루트(tag_name 없거나 tag_group과 같음): 학점만 수정 가능, tag_name 검증 불필요
        existing_name = existing_tag.get("tag_name") or ""
        existing_group = existing_tag.get("tag_group") or ""
        is_root = not existing_name or existing_name == existing_group

        if is_root:
            # 그룹 루트: tag_name은 빈 문자열 유지, 학점만 수정
            await tag_repo.update_tag(
                db, tag_id, user_id,
                tag_name="",
                min_credits=min_credits,
                tag_group=tag_group or existing_group
            )
        else:
            # 소분류: tag_name 필수
            if not tag_name or not tag_name.strip():
                raise ValueError("태그 이름을 입력해주세요.")
            await tag_repo.update_tag(
                db, tag_id, user_id,
                tag_name=tag_name.strip(),
                min_credits=min_credits,
                tag_group=tag_group
            )
    else:
        # 전공/기타: tag_group이 실제 표시 이름 — 수정 가능하도록 변경
        # 기존 코드: update_tag_credits_only 호출 → 해당 함수가 없어서 500 에러 발생
        if not tag_group or not tag_group.strip():
            raise ValueError("세부영역 이름을 입력해주세요.")
        await tag_repo.update_tag(
            db, tag_id, user_id,
            tag_name="",           # 전공/기타는 tag_name 미사용
            min_credits=min_credits,
            tag_group=tag_group.strip()
        )

    return {"message": "태그가 수정됐어요."}


async def delete_tag(
    user_id: int,
    tag_id: int,
    db: AsyncSession
):
    await tag_repo.delete_tag(db, tag_id, user_id)
    return {"message": "태그가 삭제됐어요."}