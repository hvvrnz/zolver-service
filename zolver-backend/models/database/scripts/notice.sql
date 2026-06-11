
select * from notices;

update notices
set content = '{"title": "서비스 오픈 및 이용 안내", "content": "안녕하세요! Zol.ver 서비스가 정식 오픈되었습니다. \n 졸업 설계에 도움이 되시었으면 좋겠습니다.\n 많은 이용 부탁드립니다🤎\n\n서비스는 모바일보다 PC에서 이용하시는 것을 권장드립니다.", "is_deleted": false}',
updated_at = now()
where notice_id = 1;

update notices
set content = '{"title": "과목 데이터 업데이트 안내 (과목 모아보기)", "content": "강의 데이터는 매주 자동으로 업데이트됩니다. 업데이트 중에는 일부 과목 정보가 일시적으로 변경될 수 있습니다. \n", "is_deleted": false}',
updated_at = now(),
created_at = now()
where notice_id = 3;

update notices
set content = '{"title": "서비스 이용 안내", "content": "Zol.ver 서비스는 모바일보다 PC에서 이용하시는 것을 권장드립니다.", "is_deleted": true}'
where notice_id = 2;