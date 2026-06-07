from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import speaking
from app.services.llm_client import llm_client

app = FastAPI(
    title="English Speaking Coach",
    description="AI 英语口语陪练 — 场景对话、语音交互、发音评测、语法纠错",
    version="1.0.0",
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(speaking.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "llm_configured": llm_client.available,
        "llm_last_error": llm_client._last_error,
        "services": ["speaking"],
    }
