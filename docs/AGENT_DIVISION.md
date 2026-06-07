# Agent 分工设计文档

本项目采用多 Agent 协作开发模式，聚焦 **英语口语陪练** 单一产品。

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                    SpeakingCoach                            │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Spring Boot / FastAPI Gateway                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │  Speaking Coach   │
                   │      Agent        │
                   └─────────┬─────────┘
                             │
   ┌─────────────────────────▼───────────────────────────────┐
   │           Shared Infrastructure Layer                   │
   │  LLMClient │ SpeechService │ Session Store              │
   └─────────────────────────┬───────────────────────────────┘
                             │
   ┌─────────────────────────▼───────────────────────────────┐
   │  External APIs                                            │
   │  OpenAI GPT │ Whisper │ Edge-TTS │ Web Speech API        │
   └───────────────────────────────────────────────────────────┘
```

---

## Agent 职责：Speaking Coach（英语口语陪练）

| 维度 | 说明 |
|------|------|
| **核心职责** | 场景化对话、发音评测、语法纠错、课后总结 |
| **Java 后端** | `SpeakingController.java`, `SpeakingCoachService.java` |
| **Python 后端** | `speaking_coach.py`, `routers/speaking.py` |
| **前端模块** | `SpeakingCoach.tsx`, `AiThinking.tsx` |
| **关键 API** | `POST /api/speaking/sessions`, `/chat`, `/summary`, `/transcribe`, `/tts` |

**设计决策：**
- 纠错与回复合并为单次 LLM 调用，降低延迟
- 纠错默认仅返回 major/minor 分级，避免过度打断对话流
- 发音评分由 LLM 基于转写文本推断
- 前端使用 Web Speech API 做实时 STT 降级，Whisper 做精准转写（Python 版）
- 支持 `use_llm` 开关，无 API Key 时自动降级为规则引擎演示模式

---

## 子 Agent 分工（开发阶段）

| 子 Agent | 职责 |
|----------|------|
| **对话 Agent** | 场景人设、多轮对话、上下文管理 |
| **纠错 Agent** | 语法检测、修改建议、严重级别分类 |
| **评测 Agent** | 发音评分、流利度反馈 |
| **总结 Agent** | 课后报告、薄弱点分析、学习建议 |

以上子 Agent 在运行时合并为单次 LLM 调用，通过结构化 JSON 输出统一返回。
