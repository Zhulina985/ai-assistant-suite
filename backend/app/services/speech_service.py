"""Speech-to-text and text-to-speech helpers."""

from __future__ import annotations

import base64
import io
import tempfile
from pathlib import Path

import edge_tts
from openai import AsyncOpenAI

from app.config import settings


class SpeechService:
    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_base_url,
            )

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        if not self._client:
            return "[Demo STT] Please configure OPENAI_API_KEY for real transcription."

        suffix = Path(filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                result = await self._client.audio.transcriptions.create(
                    model=settings.whisper_model,
                    file=audio_file,
                )
            return result.text
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    async def synthesize(self, text: str, voice: str = "en-US-JennyNeural") -> bytes:
        communicate = edge_tts.Communicate(text, voice)
        buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buffer.write(chunk["data"])
        return buffer.getvalue()

    async def synthesize_base64(self, text: str, voice: str = "en-US-JennyNeural") -> str:
        audio = await self.synthesize(text, voice)
        return base64.b64encode(audio).decode("ascii")


speech_service = SpeechService()
