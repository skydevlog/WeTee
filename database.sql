-- 이 파일은 실행되는 코드가 아니라, DB 구조를 기록해두는 백업 파일입니다.
-- 나중에 DB를 초기화하거나 다시 만들 때 이 코드를 사용하세요.

-- 1. 기존 테이블이 있다면 삭제 (초기화)
DROP TABLE IF EXISTS users;

-- 2. users 테이블 새로 생성 (컬럼 길이 확장 적용됨)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE, -- 이메일 길이 넉넉하게
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,         -- 이름 길이 넉넉하게
    age INTEGER,
    gender VARCHAR(50)                  -- 성별 길이 넉넉하게 (오류 해결 핵심)
);

------------------------------------------------------------------------------------------

SELECT * FROM users;