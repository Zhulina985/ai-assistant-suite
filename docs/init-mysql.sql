-- 在 MySQL 中执行一次，创建数据库
CREATE DATABASE IF NOT EXISTS speaking_coach
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 用户表由 Spring JPA 自动创建（ddl-auto: update）
-- 也可手动创建：
-- CREATE TABLE users (
--   id BIGINT AUTO_INCREMENT PRIMARY KEY,
--   username VARCHAR(50) NOT NULL UNIQUE,
--   password_hash VARCHAR(100) NOT NULL,
--   role VARCHAR(20) NOT NULL DEFAULT 'USER',
--   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
