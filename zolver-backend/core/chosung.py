def get_chosung(text: str) -> str:
    CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
    result = ''
    for c in text:
        if '가' <= c <= '힣':
            result += CHOSUNG[(ord(c) - ord('가')) // 588]
        else:
            result += c
    return result

def is_chosung(text: str) -> bool:
    CHOSUNG_SET = set('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ')
    return len(text) > 0 and all(c in CHOSUNG_SET for c in text)