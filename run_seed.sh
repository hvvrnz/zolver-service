#!/bin/bash
echo "DB 연결 대기 중..."
sleep 10  

echo "Seed 데이터 주입 시작"
docker exec -it zolver-worker python /app/zolver-data/scripts/official_lectures/kku/seed_lectures.py