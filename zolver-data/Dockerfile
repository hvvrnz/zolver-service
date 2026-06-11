FROM python:3.11-slim

# 필요한 패키지 한 번에 설치 (불필요한 캐시 삭제로 용량 최적화)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 먼저 복사 후 설치 (이렇게 하면 코드 변경 시 pip 재설치 안 함)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 복사
COPY . .

# Git 설정
RUN git config --global --add safe.directory /app

WORKDIR /app/zolver-data
CMD ["tail", "-f", "/dev/null"]