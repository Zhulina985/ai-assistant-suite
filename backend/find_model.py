import asyncio
import os
from pathlib import Path

from openai import AsyncOpenAI

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip()

MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "ibm-granite/granite-4.1-8b",
    "openrouter/fusion",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "stepfun/step-3.7-flash",
]


async def main():
    client = AsyncOpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url=os.environ["OPENAI_BASE_URL"],
        timeout=30,
        max_retries=0,
    )
    for model in MODELS:
        try:
            r = await client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": "Fix: He dont like coffe. Reply one short English sentence.",
                    }
                ],
                max_tokens=50,
            )
            text = (r.choices[0].message.content or "").strip()
            print(f"OK  {model}")
            print(f"    {text[:120]}")
        except Exception as exc:
            print(f"FAIL {model}")
            print(f"    {str(exc)[:120]}")


asyncio.run(main())
