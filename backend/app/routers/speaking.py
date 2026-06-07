from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import (
    SpeakingChatRequest,
    SpeakingChatResponse,
    SpeakingSession,
    SpeakingSessionCreate,
    SpeakingSummaryRequest,
    SpeakingSummaryResponse,
)
from app.services.speaking_coach import speaking_coach_service
from app.services.speech_service import speech_service

router = APIRouter(prefix="/api/speaking", tags=["Speaking Coach"])


@router.get("/scenarios")
def list_scenarios():
    return {
        "scenarios": [
            {"id": "interview", "name": "Job Interview", "name_zh": "面试"},
            {"id": "restaurant", "name": "Restaurant Ordering", "name_zh": "点餐"},
            {"id": "meeting", "name": "Team Meeting", "name_zh": "会议"},
            {"id": "travel", "name": "Travel", "name_zh": "旅行"},
            {"id": "daily", "name": "Daily Chat", "name_zh": "日常对话"},
        ]
    }


@router.post("/sessions", response_model=SpeakingSession)
def create_session(payload: SpeakingSessionCreate):
    return speaking_coach_service.create_session(payload.scenario, payload.user_level)


@router.get("/sessions/{session_id}", response_model=SpeakingSession)
def get_session(session_id: str):
    session = speaking_coach_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/chat", response_model=SpeakingChatResponse)
async def chat(payload: SpeakingChatRequest):
    try:
        return await speaking_coach_service.chat(
            payload.session_id,
            payload.user_message,
            payload.request_correction,
            payload.use_llm,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text = await speech_service.transcribe(audio_bytes, file.filename or "audio.webm")
    return {"text": text}


@router.post("/tts")
async def text_to_speech(text: str, voice: str = "en-US-JennyNeural"):
    audio_b64 = await speech_service.synthesize_base64(text, voice)
    return {"audio_base64": audio_b64, "format": "mp3"}


@router.post("/summary", response_model=SpeakingSummaryResponse)
async def summarize(payload: SpeakingSummaryRequest):
    try:
        return await speaking_coach_service.summarize(payload.session_id, payload.use_llm)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
