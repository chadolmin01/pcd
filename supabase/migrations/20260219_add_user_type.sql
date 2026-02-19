-- PRD 데모 유저 구분을 위한 user_type 컬럼 추가
ALTER TABLE prd_users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_prd_users_user_type ON prd_users(user_type);

-- 데모 유저 번호 시퀀스 (prd-demo-1, prd-demo-2, ...)
CREATE SEQUENCE IF NOT EXISTS prd_demo_user_seq START 1;
