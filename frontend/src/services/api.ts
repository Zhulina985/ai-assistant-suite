const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string; llm_configured: boolean }>("/health"),

  getScenarios: () => request<{ scenarios: Array<{ id: string; name: string; name_zh: string }> }>("/speaking/scenarios"),
  createSpeakingSession: (scenario: string, user_level: string) =>
    request<{ session_id: string; messages: Array<{ role: string; content: string }> }>("/speaking/sessions", {
      method: "POST",
      body: JSON.stringify({ scenario, user_level }),
    }),
  speakingChat: (session_id: string, user_message: string, use_llm = true) =>
    request<{
      reply: string;
      corrections: Array<{ original: string; suggestion: string; reason: string; severity: string }>;
      pronunciation_score?: number;
      pronunciation_feedback?: string;
      encouragement?: string;
    }>("/speaking/chat", {
      method: "POST",
      body: JSON.stringify({ session_id, user_message, request_correction: true, use_llm }),
    }),
  speakingSummary: (session_id: string, use_llm = true) =>
    request<{
      overall_score: number;
      strengths: string[];
      improvements: string[];
      key_phrases_learned: string[];
      next_steps: string;
      session_stats: Record<string, unknown>;
    }>("/speaking/summary", {
      method: "POST",
      body: JSON.stringify({ session_id, use_llm }),
    }),
  transcribeAudio: async (blob: Blob) => {
    const form = new FormData();
    form.append("file", blob, "recording.webm");
    const res = await fetch(`${API_BASE}/speaking/transcribe`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Transcription failed");
    return res.json() as Promise<{ text: string }>;
  },
  tts: (text: string, voice = "en-US-JennyNeural") =>
    request<{ audio_base64: string }>(`/speaking/tts?text=${encodeURIComponent(text)}&voice=${voice}`, {
      method: "POST",
    }),
};
