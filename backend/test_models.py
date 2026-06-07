import asyncio
from openai import AsyncOpenAI
from app.config import settings

MODELS = [
    "deepseek/deepseek-chat",
    "google/gemini-2.0-flash-001",
    "qwen/qwen-2.5-7b-instruct",
    "meta-llama/llama-3.1-8b-instruct",
    "openai/gpt-4o-mini",
]


async def try_model(client: AsyncOpenAI, model: str) -> str:
    try:
        r = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say OK"}],
            max_tokens=10,
            timeout=20,
        )
        return "OK: " + (r.choices[0].message.content or "")
    except Exception as e:
        return f"FAIL: {e}"


async def main():
    client = AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=20,
        max_retries=0,
    )
    for m in MODELS:
        result = await try_model(client, m)
        print(f"{m} -> {result[:120]}")


asyncio.run(main())
