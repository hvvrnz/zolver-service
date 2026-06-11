import httpx
import json
from core.config.oauth import oauth_settings


async def get_token(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": oauth_settings.KAKAO_CLIENT_ID,
                "client_secret": oauth_settings.KAKAO_CLIENT_SECRET,
                "redirect_uri": oauth_settings.KAKAO_REDIRECT_URI,
                "code": code,
            },
        )
        return res.json()


async def get_userinfo(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        return res.json()


async def send_welcome_message(access_token: str, nickname: str) -> dict:
# access_token = 카카오 액세스토큰 (로그인할 때 받아온 것)
# nickname     = 유저 닉네임
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://kapi.kakao.com/v2/api/talk/memo/default/send", # 카카오톡 나에게 보내기 메시지 (회원가입 축하메세지)
            headers={"Authorization": f"Bearer {access_token}"},  # 카카오 액세스토큰으로 인증
            data={
                "template_object": json.dumps({
                    "object_type": "text",
                    "text": f"🎓 안녕하세요. {nickname}님, \nZol.ver 가입을 진심으로 환영합니다!\n 졸업요건을 언제든 정리하고 확인 할 수 있습니다.\n 오늘도 행복한 하루 보내세요.🍀",
                    "link": {
                        "web_url": oauth_settings.FRONTEND_URL,
                        "mobile_web_url": oauth_settings.FRONTEND_URL
                        # 나중에 실제 URL로 변경필요
                    }
                }, ensure_ascii=False) # ensure_ascii=False = 한글 깨짐 방지
            }
        )
        return res.json()