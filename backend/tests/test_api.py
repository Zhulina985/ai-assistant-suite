import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "speaking" in data["services"]


@pytest.mark.asyncio
async def test_speaking_session_flow(client):
    create_resp = await client.post(
        "/api/speaking/sessions",
        json={"scenario": "interview", "user_level": "intermediate"},
    )
    assert create_resp.status_code == 200
    session = create_resp.json()
    assert "session_id" in session
    assert len(session["messages"]) == 1

    chat_resp = await client.post(
        "/api/speaking/chat",
        json={
            "session_id": session["session_id"],
            "user_message": "I am work in a big company for five year.",
            "request_correction": True,
            "use_llm": False,
        },
    )
    assert chat_resp.status_code == 200
    demo_chat = chat_resp.json()
    assert len(demo_chat["corrections"]) >= 1

    chat_resp = await client.post(
        "/api/speaking/chat",
        json={
            "session_id": session["session_id"],
            "user_message": "I have five years of software engineering experience.",
            "request_correction": True,
            "use_llm": True,
        },
    )
    assert chat_resp.status_code == 200
    chat = chat_resp.json()
    assert "reply" in chat
    assert "corrections" in chat

    summary_resp = await client.post(
        "/api/speaking/summary",
        json={"session_id": session["session_id"]},
    )
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert "overall_score" in summary
    assert "strengths" in summary

