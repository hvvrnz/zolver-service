#!/bin/bash

# 사용법: ./toggle_maintenance.sh true  (점검 시작)
# 사용법: ./toggle_maintenance.sh false (점검 종료)

MODE=$1

sed -i '/REACT_APP_MAINTENANCE=/d' zolver-frontend/.env
echo "REACT_APP_MAINTENANCE=$MODE" >> zolver-frontend/.env

echo "프론트엔드 컨테이너 재빌드 중... (점검 모드: $MODE)"
docker compose -f docker-compose.yml up -d --build frontend