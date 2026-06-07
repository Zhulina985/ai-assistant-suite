"""Comprehensive API test - grammar, word order, spelling."""
import json
import time
import httpx

BASE = "http://127.0.0.1:8000/api"
TIMEOUT = 90.0

GRAMMAR_TESTS = [
    ("语法-时态", "I am work in a big company for five year."),
    ("语法-主谓一致", "He don't like coffee because it are too bitter."),
    ("语法-完成时", "I have went to Paris last summer and buy many souvenir."),
    ("语序", "I very much like to learning English every day."),
    ("拼写", "I recieved your messege and will reponse soon."),
    ("搭配错误", "I want to discuss about this topic with you."),
    ("比较级", "This solution is more better than the last one."),
    ("正确对照", "I have five years of experience in software development."),
]

results = {"health": None, "speaking": [], "errors": []}

with httpx.Client(timeout=TIMEOUT) as client:
    # Health
    h = client.get(f"{BASE}/health").json()
    results["health"] = h
    print(f"Health: llm_configured={h['llm_configured']}")

    # Speaking - grammar tests
    s = client.post(f"{BASE}/speaking/sessions", json={"scenario": "interview", "user_level": "intermediate"}).json()
    sid = s["session_id"]
    print(f"Session: {sid}\n")

    for label, msg in GRAMMAR_TESTS:
        try:
            t0 = time.time()
            r = client.post(
                f"{BASE}/speaking/chat",
                json={"session_id": sid, "user_message": msg, "request_correction": True},
            ).json()
            elapsed = round(time.time() - t0, 1)
            item = {
                "label": label,
                "input": msg,
                "reply": r.get("reply", ""),
                "corrections": r.get("corrections", []),
                "pronunciation_score": r.get("pronunciation_score"),
                "latency_sec": elapsed,
                "ok": bool(r.get("reply")),
            }
            results["speaking"].append(item)
            corr_count = len(item["corrections"])
            print(f"[{label}] {elapsed}s | corrections={corr_count}")
            print(f"  IN:  {msg}")
            print(f"  OUT: {item['reply'][:120]}")
            for c in item["corrections"][:3]:
                print(f"  FIX: {c.get('original')} -> {c.get('suggestion')} ({c.get('reason','')[:50]})")
            print()
        except Exception as e:
            results["errors"].append({"label": label, "error": str(e)})
            print(f"[{label}] ERROR: {e}\n")

out = "../full-test-results.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"\nSaved to {out}")
