import asyncio
from app.services.llm_client import llm_client


async def main():
    print("available:", llm_client.available)
    raw = await llm_client.chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an English coach. Return JSON: "
                    '{"reply":"...","corrections":[{"original":"...","suggestion":"...","reason":"...","severity":"major"}]}'
                ),
            },
            {"role": "user", "content": "assistant: Hi\nuser: He dont like coffe because it are bitter."},
        ],
        json_mode=True,
    )
    print("response:")
    print(raw[:800])


asyncio.run(main())
