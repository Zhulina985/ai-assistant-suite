# 英语口语陪练

AI 英语口语陪练 — 场景对话、语法纠错、发音评分、课后总结。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | **Java 17+ / Spring Boot 3.2** |
| 数据库 | **MySQL 8** + Spring Data JPA |
| 认证 | Spring Security + Session + BCrypt |
| 前端 | HTML + CSS + JavaScript（原生） |
| LLM | OpenRouter / OpenAI 兼容 API |

## 快速开始

### 1. 配置 MySQL

在 MySQL 中执行：

```sql
CREATE DATABASE speaking_coach DEFAULT CHARACTER SET utf8mb4;
```

或运行 `docs/init-mysql.sql`。

### 2. 配置环境变量

```cmd
cd D:\ai-assistant-suite\backend-java
copy .env.example .env
```

编辑 `.env`，填写：

- `MYSQL_PASSWORD` — MySQL root 密码（**不要发到聊天里**）
- `OPENAI_API_KEY` — OpenRouter Key（可选，无则演示模式）

### 3. 启动

```cmd
start-backend-java.bat
start-frontend.bat
```

浏览器打开：**http://127.0.0.1:5173/login.html**

- 可注册 / 登录
- 或点击「游客登录」直接体验

## 项目结构

```
ai-assistant-suite/
├── backend-java/          # Java 后端（唯一后端）
│   ├── src/main/java/     # Controller / Service / Entity
│   └── .env.example       # 配置模板
├── frontend/
│   ├── login.html         # 登录 / 注册 / 游客
│   ├── index.html         # 口语练习主页
│   ├── css/
│   └── js/
└── docs/
```

## API 概览

### 认证 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 注册 |
| POST | `/login` | 登录 |
| POST | `/guest` | 游客登录 |
| GET | `/me` | 当前用户 |
| POST | `/logout` | 退出 |

### 口语陪练 `/api/speaking`（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/scenarios` | 场景列表 |
| POST | `/sessions` | 创建会话 |
| POST | `/chat` | 对话 + 纠错 |
| POST | `/summary` | 课后总结 |
