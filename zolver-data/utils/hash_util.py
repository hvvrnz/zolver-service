import hashlib
import json

class HashUtil:
    @staticmethod
    def gen_form_hash(data, length: int):
        try:
            # 리스트(data)를 환경에 상관없이 똑같은 문자열로 만드는 과정 (직렬화)
            # json.dumps를 쓰면 공백, 정렬 등이 표준화되어 해시가 안정적
            if isinstance(data, (list, dict)):
                combined_str = json.dumps(data, ensure_ascii=False, sort_keys=True)
            else:
                combined_str = str(data)
            return hashlib.sha256(combined_str.encode('utf-8')).hexdigest()[:length]
        except Exception as e:
            raise e