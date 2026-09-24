-- 방 이름 (메인 화면 방 목록에 표시)
ALTER TABLE room ADD COLUMN title VARCHAR(20) AFTER roomcode;
