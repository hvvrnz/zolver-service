import os
from datetime import datetime, timezone, timedelta
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai

from repositories.tag_repo import get_tags_by_user
from repositories.lecture_repo import get_my_lectures, get_verified_lectures
from repositories.auth_repo import find_login_session
from repositories.ai_repo import (
    get_user_ai_info, get_major_info,
    get_curriculum_memo, save_ai_recommend
)
from core.gpa import calc_gpa
from core.ai_prompt import build_prompt, fmt_stats

CACHE_MINUTES = 30
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


async def handle_recommend(db: AsyncSession, provider_id_hash: str):
    session = await find_login_session(db, provider_id_hash=provider_id_hash)
    user_id = session["user_id"]

    user_info = await get_user_ai_info(db, user_id)
    user_info["user_id"] = user_id

    # 30분 캐시 확인
    cached_text = user_info.get("ai_recommend")
    cached_at = user_info.get("ai_recommend_at")
    if cached_text and cached_at:
        if isinstance(cached_at, str):
            cached_at = datetime.fromisoformat(cached_at)
        if cached_at.tzinfo is None:
            cached_at = cached_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - cached_at < timedelta(minutes=CACHE_MINUTES):
            return StreamingResponse(iter([cached_text]), media_type="text/plain")

    tags = await get_tags_by_user(db, user_id)
    lectures = await get_my_lectures(db, user_id)

    # 이수 학점 계산
    total_credits = sum(
        l["lecture_credit"] for l in lectures
        if l.get("course_grade") not in ["F", "N", "NP"] and not l.get("delete_type")
    )

    # GPA 계산
    current_gpa = calc_gpa(lectures)
    gpa_str = f"{current_gpa:.2f}" if current_gpa is not None else "정보 없음"
    target_gpa = user_info.get("target_gpa")
    target_gpa_str = f"{target_gpa:.2f}" if target_gpa else "설정 안 함"

    major_lectures_list = [l for l in lectures if l.get("system_category") == "major"]
    current_gpa_major = calc_gpa(major_lectures_list)
    gpa_major_str = f"{current_gpa_major:.2f}" if current_gpa_major is not None else "정보 없음"
    target_gpa_major = user_info.get("target_gpa_major")
    target_gpa_major_str = f"{target_gpa_major:.2f}" if target_gpa_major else "설정 안 함"

    # 이수구분별 학점 집계
    earned_by_group = {}
    for l in lectures:
        if l.get("course_grade") not in ["F", "N", "NP"] and not l.get("delete_type"):
            cat = l.get("lecture_category")
            if cat:
                earned_by_group[cat] = earned_by_group.get(cat, 0) + (l["lecture_credit"] or 0)

    # 태그별 달성 현황
    tag_lines = []
    for t in tags:
        if t.get("min_credits", 0) > 0:
            earned = earned_by_group.get(t["tag_group"], 0)
            status = "✅" if earned >= t["min_credits"] else "❌"
            tag_lines.append(f"{status} {t['tag_group']} ({t['system_category']}): {earned}/{t['min_credits']}학점")
    tag_summary = "\n".join(tag_lines) if tag_lines else "태그 설정 없음"

    # 부족한 태그
    short_tags = [
        t for t in tags
        if t.get("min_credits", 0) > earned_by_group.get(t["tag_group"], 0)
    ]
    short_cats = set(t["system_category"] for t in short_tags)

    # 전공 코드 추출
    major_codes = set()
    for l in lectures:
        if l.get("system_category") != "major":
            continue
        code = l.get("lecture_code") or ""
        if len(code) >= 4 and code[:4].isalpha() and code[:4] not in ("BKSA", "MANU"):
            major_codes.add(code[:4])

    already_taken = set(l.get("lecture_name") for l in lectures)

    # 추천 과목 필터링
    all_lectures = await get_verified_lectures(db, keyword="")
    suggest_lectures = [
        l for l in all_lectures
        if l.get("system_category") in short_cats
        and l.get("system_category") != "general"
        and any((l.get("lecture_code") or "").startswith(code) for code in major_codes)
        and l.get("lecture_name") not in already_taken
    ]

    # 정렬
    admission_year = user_info.get('admission_year', '')
    user_adm = str(admission_year) if admission_year else ""

    def sort_key(l):
        cat = l.get('lecture_category') or ''
        is_required = 0 if '필' in cat else 1
        stats = l.get('admission_stats') or {}
        my_count = -stats.get(user_adm, 0) if isinstance(stats, dict) else 0
        last_year = -(l.get('last_completed_year') or 0)
        return (is_required, my_count, last_year)

    suggest_lectures.sort(key=sort_key)
    suggest_lectures = suggest_lectures[:20]

    lecture_list = "\n".join([
        f"- `{l['lecture_name']}` ({l.get('lecture_code','')}, {l.get('lecture_credit', 3)}학점, 최근이수: {l.get('last_completed_year', '?')}년 {l.get('last_completed_semester', '')}, 학번별이수: {fmt_stats(l.get('admission_stats'))})"
        for l in suggest_lectures
    ]) if suggest_lectures else "없음 (대부분의 전공 과목 이수 완료)"

    # 학과 정보
    majors = await get_major_info(db, user_id)
    major_str = ", ".join([m['major'] for m in majors]) if majors else "정보 없음"

    # 졸업요건 메모
    curr = await get_curriculum_memo(db, user_id)
    curr_items = []
    if curr and curr["content"]:
        items = curr["content"].get("items", [])
        curr_items = [f"- {i['title']} ({'완료' if i.get('checked') else '미완료'})" for i in items]
    curr_summary = "\n".join(curr_items) if curr_items else "없음"

    # 부족한 이수구분 요약
    short_summary = "\n".join([
        f"- {t['tag_group']} ({t['system_category']}): {t['min_credits'] - earned_by_group.get(t['tag_group'], 0)}학점 부족"
        for t in short_tags if t.get("min_credits", 0) > 0
    ]) if short_tags else "없음 (모든 요건 충족)"

    prompt = build_prompt(
        major_str=major_str,
        admission_year=admission_year,
        total_credits=total_credits,
        user_info=user_info,
        gpa_str=gpa_str,
        target_gpa_str=target_gpa_str,
        gpa_major_str=gpa_major_str,
        target_gpa_major_str=target_gpa_major_str,
        short_summary=short_summary,
        tag_summary=tag_summary,
        curr_summary=curr_summary,
        lecture_list=lecture_list
    )

    async def stream_and_save():
        full_text = ""
        try:
            response = client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=prompt
            )
            for chunk in response:
                if chunk.text:
                    full_text += chunk.text
                    yield chunk.text
        except Exception:
            yield "현재 AI 추천이 일시적으로 제한됐어요. 30분 후 다시 시도해주세요."
            return
        if full_text:
            await save_ai_recommend(db, user_id, full_text)

    return StreamingResponse(stream_and_save(), media_type="text/plain")