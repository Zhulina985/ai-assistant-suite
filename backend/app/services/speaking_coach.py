"""English speaking practice service."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from app.models.schemas import (
    ChatMessage,
    CorrectionItem,
    MessageRole,
    ScenarioType,
    SpeakingChatResponse,
    SpeakingSession,
    SpeakingSummaryResponse,
)
from app.services.llm_client import llm_client

SCENARIO_PROMPTS = {
    ScenarioType.INTERVIEW: (
        "You are a friendly HR interviewer conducting a job interview in English. "
        "Ask one question at a time, respond naturally, and adapt to the candidate's level."
    ),
    ScenarioType.RESTAURANT: (
        "You are a waiter at a casual restaurant. Help the customer order food and drinks "
        "in natural English conversation."
    ),
    ScenarioType.MEETING: (
        "You are a project manager running a team meeting. Discuss agenda items, "
        "ask for updates, and facilitate discussion in professional English."
    ),
    ScenarioType.TRAVEL: (
        "You are a helpful local at a tourist destination. Assist with directions, "
        "recommendations, and travel-related conversation."
    ),
    ScenarioType.DAILY: (
        "You are a conversation partner for everyday English small talk about hobbies, "
        "weather, and daily life."
    ),
}


class SpeakingCoachService:
    def __init__(self) -> None:
        self._sessions: dict[str, SpeakingSession] = {}

    def create_session(self, scenario: ScenarioType, user_level: str) -> SpeakingSession:
        session_id = str(uuid.uuid4())
        opener = self._opening_line(scenario)
        session = SpeakingSession(
            session_id=session_id,
            scenario=scenario,
            user_level=user_level,
            messages=[
                ChatMessage(role=MessageRole.ASSISTANT, content=opener),
            ],
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> SpeakingSession | None:
        return self._sessions.get(session_id)

    async def chat(
        self,
        session_id: str,
        user_message: str,
        request_correction: bool = True,
        use_llm: bool = True,
    ) -> SpeakingChatResponse:
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        session.messages.append(
            ChatMessage(role=MessageRole.USER, content=user_message)
        )

        history = "\n".join(
            f"{m.role.value}: {m.content}" for m in session.messages[-8:]
        )

        system_prompt = (
            f"{SCENARIO_PROMPTS[session.scenario]}\n"
            f"Student level: {session.user_level}.\n"
            "Respond in JSON with keys: reply, corrections (array of "
            "{original, suggestion, reason, severity}), pronunciation_score (0-100), "
            "pronunciation_feedback, encouragement.\n"
            "Only correct significant grammar/expression issues; do not over-correct. "
            "Keep reply conversational and under 80 words."
        )
        if not request_correction:
            system_prompt += "\nReturn empty corrections array."

        raw = await llm_client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": history},
            ],
            temperature=0.8,
            json_mode=True,
            use_model=use_llm,
        )

        data = self._parse_json(raw)
        corrections = []
        for c in data.get("corrections", []):
            if not isinstance(c, dict):
                continue
            severity = str(c.get("severity", "minor")).lower()
            if severity not in ("minor", "major"):
                severity = "major" if severity in ("high", "critical", "error") else "minor"
            c["severity"] = severity
            try:
                corrections.append(CorrectionItem(**c))
            except Exception:
                continue
        reply = data.get("reply", raw)

        session.messages.append(ChatMessage(role=MessageRole.ASSISTANT, content=reply))

        return SpeakingChatResponse(
            reply=reply,
            corrections=corrections,
            pronunciation_score=data.get("pronunciation_score"),
            pronunciation_feedback=data.get("pronunciation_feedback"),
            encouragement=data.get("encouragement"),
        )

    async def summarize(self, session_id: str, use_llm: bool = True) -> SpeakingSummaryResponse:
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        user_turns = [m.content for m in session.messages if m.role == MessageRole.USER]
        history = "\n".join(f"{m.role.value}: {m.content}" for m in session.messages)

        system_prompt = (
            "You are an English coach. Analyze the speaking practice session and return JSON: "
            "overall_score (0-100), strengths (array), improvements (array), "
            "key_phrases_learned (array), next_steps (string)."
        )

        raw = await llm_client.chat(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": history},
            ],
            temperature=0.3,
            json_mode=True,
            use_model=use_llm,
        )
        data = self._parse_json(raw)

        return SpeakingSummaryResponse(
            overall_score=int(data.get("overall_score", 70)),
            strengths=data.get("strengths", []),
            improvements=data.get("improvements", []),
            key_phrases_learned=data.get("key_phrases_learned", []),
            next_steps=data.get("next_steps", "Continue practicing this scenario."),
            session_stats={
                "scenario": session.scenario.value,
                "user_level": session.user_level,
                "turn_count": len(user_turns),
                "total_messages": len(session.messages),
            },
        )

    def _opening_line(self, scenario: ScenarioType) -> str:
        openers = {
            ScenarioType.INTERVIEW: (
                "Hello! Thanks for coming in today. Could you start by telling me "
                "a little about yourself?"
            ),
            ScenarioType.RESTAURANT: (
                "Good evening! Welcome to our restaurant. Are you ready to order, "
                "or would you like a few more minutes with the menu?"
            ),
            ScenarioType.MEETING: (
                "Good morning, everyone. Let's get started. First item on the agenda "
                "is the project timeline. Any updates from your side?"
            ),
            ScenarioType.TRAVEL: (
                "Hi there! You look like you're exploring the area. Can I help you "
                "find something?"
            ),
            ScenarioType.DAILY: (
                "Hey! Nice weather today, isn't it? What have you been up to lately?"
            ),
        }
        return openers[scenario]

    def _parse_json(self, raw: str) -> dict:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start = raw.find("{")
            end = raw.rfind("}")
            if start >= 0 and end > start:
                return json.loads(raw[start : end + 1])
            return {"reply": raw}


speaking_coach_service = SpeakingCoachService()
