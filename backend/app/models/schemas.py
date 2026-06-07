from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ScenarioType(str, Enum):
    INTERVIEW = "interview"
    RESTAURANT = "restaurant"
    MEETING = "meeting"
    TRAVEL = "travel"
    DAILY = "daily"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class SpeakingSessionCreate(BaseModel):
    scenario: ScenarioType = ScenarioType.INTERVIEW
    user_level: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced)$")


class SpeakingSession(BaseModel):
    session_id: str
    scenario: ScenarioType
    user_level: str
    messages: list[ChatMessage] = []
    created_at: str


class CorrectionItem(BaseModel):
    original: str
    suggestion: str
    reason: str
    severity: str = Field(default="minor", pattern="^(minor|major)$")


class SpeakingChatRequest(BaseModel):
    session_id: str
    user_message: str
    request_correction: bool = True
    use_llm: bool = True


class SpeakingChatResponse(BaseModel):
    reply: str
    corrections: list[CorrectionItem] = []
    pronunciation_score: Optional[int] = None
    pronunciation_feedback: Optional[str] = None
    encouragement: Optional[str] = None


class SpeakingSummaryRequest(BaseModel):
    session_id: str
    use_llm: bool = True


class SpeakingSummaryResponse(BaseModel):
    overall_score: int
    strengths: list[str]
    improvements: list[str]
    key_phrases_learned: list[str]
    next_steps: str
    session_stats: dict[str, Any] = {}

