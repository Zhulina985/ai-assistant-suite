# 英语口语陪练

AI 英语口语陪练 — 场景对话、语法纠错、发音评分、课后总结。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Java 17+ / Spring Boot 3.2 |
| 数据库 | MySQL 8 + Spring Data JPA |
| 认证 | Spring Security + Session + BCrypt |
| 前端 | HTML + CSS + JavaScript（原生，无需 npm） |
| LLM | OpenRouter / OpenAI 兼容 API（可选） |

## 环境要求

| 软件 | 版本 | 用途 |
|------|------|------|
| **JDK** | 17+ | 编译运行 Java 后端 |
| **MySQL** | 8.x | 用户注册登录数据存储 |
| **Python** | 3.x | 启动前端静态文件服务 |

> Maven 已内置（`backend-java/mvnw.cmd`），首次构建会自动下载，**无需单独安装 Maven**。

## 快速开始（Windows）

### 1. 克隆项目

```cmd
git clone git@github.com:Zhulina985/ai-assistant-suite.git
cd ai-assistant-suite
```

### 2. 检测环境

双击或在 CMD 中运行：

```cmd
setup-tools.bat
```

会自动创建 `backend-java\.env`（若不存在）。

### 3. 填写配置

编辑 `backend-java\.env`：

```env
MYSQL_PASSWORD=你的MySQL密码
OPENAI_API_KEY=你的API密钥   # 可选，不填则演示模式
```

> **切勿**将 `.env` 提交到 Git 或发到聊天中。

### 4. 创建数据库

确保 MySQL 服务已启动，然后：

```cmd
init-db.bat
```

也可手动在 MySQL 中执行 `docs/init-mysql.sql`。

### 5. 启动

开两个终端窗口：

```cmd
start-backend-java.bat
start-frontend.bat
```

浏览器打开：**http://127.0.0.1:5173/login.html**

- 注册 / 登录 — 数据存入 MySQL
- 游客登录 — 无需注册，直接体验

### 6. 验证

```cmd
test-connection.bat
```

后端健康检查：http://127.0.0.1:8000/api/health

## 手动启动（macOS / Linux）

```bash
# 1. 配置
cd backend-java
cp .env.example .env
# 编辑 .env 填写 MYSQL_PASSWORD

# 2. 建库
mysql -u root -p < ../docs/init-mysql.sql

# 3. 后端
./mvnw -q -DskipTests package
export $(grep -v '^#' .env | xargs)   # 加载环境变量
java -jar target/ai-assistant-suite-1.0.0.jar

# 4. 前端（新终端）
cd ../frontend
python3 -m http.server 5173
```

## 项目结构

```
ai-assistant-suite/
├── backend-java/          # Java 后端
│   ├── mvnw / mvnw.cmd    # Maven Wrapper（免安装 Maven）
│   ├── .env.example       # 配置模板
│   └── src/main/java/     # 业务代码
├── frontend/
│   ├── login.html         # 登录 / 注册 / 游客
│   ├── index.html         # 口语练习主页
│   ├── css/
│   └── js/
├── docs/
│   └── init-mysql.sql     # 数据库初始化
├── setup-tools.bat        # 环境检测
├── init-db.bat            # 一键建库
├── start-backend-java.bat
└── start-frontend.bat
```

## 常见问题

| 问题 | 解决办法 |
|------|----------|
| `Unknown database 'speaking_coach'` | 运行 `init-db.bat` 或手动建库 |
| `MYSQL_PASSWORD 为空` | 编辑 `backend-java\.env` |
| 端口 8000 被占用 | 运行 `kill-port-8000.bat` |
| 前端显示后端未连接 | 确认 `start-backend-java.bat` 窗口无报错 |
| 无 API Key | 可游客登录，使用演示模式（回复较简单） |
| 构建很慢 | 首次需下载 Maven 和依赖，请保持网络畅通 |

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
