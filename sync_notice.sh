#!/bin/bash
echo "공지사항 데이터 동기화 시작"
docker exec -it zolver-api python /app/zolver-backend/data/notices/sync_notices.py
echo "공지사항 업로드 완료"