FROM python:3.11-slim
# 2. slim 버전은 git이 안 깔려 있을 수 있으니 설치 
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 루트에서 빌드
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 전체 소스 복사 (어차피 볼륨으로 덮어쓸 거지만 빌드용으로 필요)
COPY . .

WORKDIR /app/zolver-backend

CMD ["univcorn", "app.py", "runserver", "0.0.0.0:8000"]

RUN git config --global --add safe.directory /app