# 1. 초경량 알파인 이미지 사용
FROM node:18-alpine

# 알파인은 기본적으로 git이 없으므로 설치
RUN apk add --no-cache git

WORKDIR /app

# 루트 기준으로 package.json 복사
COPY zolver-frontend/package*.json ./zolver-frontend/
RUN npm install --prefix zolver-frontend

COPY . .

WORKDIR /app/zolver-frontend
CMD ["npm", "start"]

# Dockerfile 하단에 추가
RUN git config --global --add safe.directory /app