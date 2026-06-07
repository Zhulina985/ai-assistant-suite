# 英语口语陪练

AI 英语口语陪练工具 — 场景化对话、语音交互、发音评测、语法纠错、课后总结。

## 功能

- 多场景练习：面试、点餐、会议、旅行、日常对话
- 实时语法纠错与发音评分
- 语音输入（Whisper / 浏览器录音）
- 课后学习总结
- AI 模型开关：可切换「真实模型」/「演示模式」

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | **Java 17+ / Spring Boot**（主）或 Python / FastAPI（旧） |
| 前端 | React 18 / TypeScript / Vite |
| LLM | OpenRouter / OpenAI 兼容 API |
| STT | OpenAI Whisper + 浏览器 Web Speech API |
| TTS | 浏览器 SpeechSynthesis（Java 版）/ Edge-TTS（Python 版） |

## 快速开始

> 项目路径：`D:\ai-assistant-suite`

**CMD（推荐）：**
```cmd
cd /d D:\ai-assistant-suite
start-backend-java.bat
start-frontend.bat
```

浏览器打开：http://127.0.0.1:5173

### 首次配置

1. 双击 `setup-tools.bat`（检测 Java、安装 Maven）
2. 复制 `backend\.env.example` 为 `backend\.env`，填入 API Key
3. 启动后端 + 前端

### 测试连接

```cmd
test-connection.bat
```

## 项目结构

```
ai-assistant-suite/
├── backend-java/          # Java 后端（推荐）
├── backend/               # Python 后端（旧版，含 Whisper）
├── frontend/
│   └── src/pages/SpeakingCoach.tsx
└── docs/
    └── AGENT_DIVISION.md
```

## API 概览

### 口语陪练 `/api/speaking`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/scenarios` | 场景列表 |
| POST | `/sessions` | 创建练习会话 |
| POST | `/chat` | 发送消息并获取回复+纠错 |
| POST | `/transcribe` | 语音转文字（Python 版） |
| POST | `/tts` | 文字转语音 |
| POST | `/summary` | 课后总结 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | API 密钥 | 空（演示模式） |
| `OPENAI_BASE_URL` | API 基地址 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 对话模型 | `gpt-4o-mini` |
| `WHISPER_MODEL` | 语音识别模型 | `whisper-1` |
