"""Unified LLM client with OpenAI API and offline fallback."""

from __future__ import annotations

import json
import re
from typing import Any

import logging

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

PLACEHOLDER_KEYS = {"", "sk-your-key-here", "your-api-key", "sk-xxx"}


class LLMClient:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        self._use_api = False
        self._last_error: str | None = None
        key = (settings.openai_api_key or "").strip()
        if key and key not in PLACEHOLDER_KEYS:
            self._client = AsyncOpenAI(
                api_key=key,
                base_url=settings.openai_base_url,
                timeout=90.0,
                max_retries=1,
            )
            self._use_api = True

    @property
    def available(self) -> bool:
        return self._use_api

    async def chat(
        self,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.7,
        json_mode: bool = False,
        use_model: bool = True,
    ) -> str:
        if not use_model or not self._client:
            return self._fallback(messages)

        kwargs: dict[str, Any] = {
            "model": settings.openai_model,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            response = await self._client.chat.completions.create(**kwargs)
            return response.choices[0].message.content or ""
        except (APITimeoutError, APIConnectionError, APIStatusError) as exc:
            logger.warning("LLM API failed, using fallback: %s", exc)
            self._last_error = str(exc)
            return self._fallback(messages)

    def _extract_user_text(self, content: str) -> str:
        return self._extract_last_user_turn(content)

    def _extract_last_user_turn(self, content: str) -> str:
        lines = content.strip().splitlines()
        for line in reversed(lines):
            if line.lower().startswith("user:"):
                return line.split(":", 1)[1].strip()
        return content.strip()

    def _demo_grammar_corrections(self, text: str) -> list[dict[str, str]]:
        rules: list[tuple[str, str, str, str]] = [
            (r"\bI am work\b", "I work", "Use simple present: I work / I am working", "major"),
            (r"\bfor (\w+) year\b", r"for \1 years", "Countable noun 'year' needs plural", "minor"),
            (r"\bHe don't\b", "He doesn't", "Third-person singular uses doesn't", "major"),
            (r"\bShe don't\b", "She doesn't", "Third-person singular uses doesn't", "major"),
            (r"\bIt don't\b", "It doesn't", "Third-person singular uses doesn't", "major"),
            (r"\bit are\b", "it is", "Subject-verb agreement: it is", "major"),
            (r"\bthey is\b", "they are", "Subject-verb agreement: they are", "major"),
            (r"\bI have went\b", "I went", "Use past simple for finished past actions", "major"),
            (r"\bhave went\b", "went", "Use past simple: went (not have went)", "major"),
            (r"\band buy\b", "and bought", "Keep past tense consistent: bought", "major"),
            (r"\bmany souvenir\b", "many souvenirs", "Countable nouns need plural form", "minor"),
            (r"\ba informations\b", "information", "Information is uncountable", "major"),
            (r"\bmore better\b", "better", "Better already means 'more good'", "minor"),
            (r"\bdiscuss about\b", "discuss", "Discuss is transitive; omit 'about'", "minor"),
            (r"\bdont\b", "don't", "Missing apostrophe in contraction", "minor"),
            (r"\bcoffe\b", "coffee", "Spelling: coffee (double f, double e)", "minor"),
            (r"\brecieved\b", "received", "Spelling: i before e except after c", "minor"),
            (r"\bmessege\b", "message", "Spelling: message", "minor"),
            (r"\breponse\b", "response", "Spelling: response", "minor"),
            (r"\bto learning\b", "to learn", "After 'to' use base verb: learn", "major"),
            (r"\bvery much like to\b", "really like to", "More natural word order", "minor"),
        ]

        corrections: list[dict[str, str]] = []
        seen: set[str] = set()
        for pattern, replacement, reason, severity in rules:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if not match:
                continue
            original = match.group(0)
            if original.lower() in seen:
                continue
            seen.add(original.lower())
            suggestion = re.sub(pattern, replacement, original, count=1, flags=re.IGNORECASE)
            corrections.append(
                {
                    "original": original,
                    "suggestion": suggestion,
                    "reason": reason,
                    "severity": severity,
                }
            )
        return corrections

    def _fallback(self, messages: list[dict[str, str]]) -> str:
        """Rule-based fallback when no API key is configured."""
        user_text = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_text = self._extract_user_text(msg.get("content", ""))
                break

        system_text = next(
            (m.get("content", "") for m in messages if m.get("role") == "system"),
            "",
        )

        if "JSON" in system_text or "json" in system_text:
            if (
                "interviewer" in system_text.lower()
                or "waiter" in system_text.lower()
                or "project manager" in system_text.lower()
                or "conversation" in system_text.lower()
                or "respond in json" in system_text.lower()
            ):
                corrections = self._demo_grammar_corrections(user_text)
                if corrections:
                    reply = (
                        "Good effort! I noticed a few grammar points — check the corrections below. "
                        "Could you try saying that again?"
                    )
                    encouragement = "Nice try! Applying corrections will make you sound more natural."
                else:
                    reply = "That's a great point! Could you tell me more about your experience?"
                    encouragement = "Keep going — your fluency is improving!"
                return json.dumps(
                    {
                        "reply": reply,
                        "corrections": corrections,
                        "pronunciation_score": 78 if not corrections else 72,
                        "pronunciation_feedback": "Clear articulation. Try stressing key verbs more.",
                        "encouragement": encouragement,
                    },
                    ensure_ascii=False,
                )
            if "english coach" in system_text.lower() or "summary" in system_text.lower():
                return json.dumps(
                    {
                        "overall_score": 75,
                        "strengths": ["词汇量不错", "语速自然"],
                        "improvements": ["多使用连接词", "注意动词时态"],
                        "key_phrases_learned": ["in my opinion", "as a result"],
                        "next_steps": "建议在同一场景下练习更难的追问。",
                    },
                    ensure_ascii=False,
                )

        return "That's interesting! Could you tell me more about that?"


llm_client = LLMClient()
