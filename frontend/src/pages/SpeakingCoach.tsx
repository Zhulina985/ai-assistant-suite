import { useEffect, useRef, useState } from "react";
import AiThinking from "../components/AiThinking";
import { useModelSettings } from "../context/ModelSettings";
import { api } from "../services/api";
import { playReplyAudio } from "../utils/speech";

interface Message {
  role: "user" | "assistant";
  content: string;
  corrections?: Array<{ original: string; suggestion: string; reason: string }>;
  score?: number;
}

const FALLBACK_SCENARIOS = [
  { id: "interview", name_zh: "面试" },
  { id: "restaurant", name_zh: "点餐" },
  { id: "meeting", name_zh: "会议" },
  { id: "travel", name_zh: "旅行" },
  { id: "daily", name_zh: "日常对话" },
];

const LEVEL_LABELS: Record<string, string> = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

export default function SpeakingCoach() {
  const { useModel, backendConnected } = useModelSettings();
  const [scenarios, setScenarios] = useState(FALLBACK_SCENARIOS);
  const [scenario, setScenario] = useState("interview");
  const [level, setLevel] = useState("intermediate");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getScenarios()
      .then((r) => {
        if (r.scenarios?.length) setScenarios(r.scenarios);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, summary]);

  const scenarioLabel = scenarios.find((s) => s.id === scenario)?.name_zh ?? "面试";
  const userTurns = messages.filter((m) => m.role === "user").length;

  const resetSession = () => {
    setSessionId("");
    setMessages([]);
    setSummary(null);
    setInput("");
    setError("");
  };

  const startSession = async () => {
    if (!backendConnected) {
      setError("后端未连接，请先启动 start-backend-java.bat");
      return;
    }
    setLoading(true);
    setError("");
    setSummary(null);
    try {
      const session = await api.createSpeakingSession(scenario, level);
      setSessionId(session.session_id);
      setMessages(session.messages.map((m) => ({ role: m.role as "assistant", content: m.content })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建会话失败");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError("");
    try {
      const res = await api.speakingChat(sessionId, text, useModel);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          corrections: res.corrections,
          score: res.pronunciation_score,
        },
      ]);
      await playReplyAudio(res.reply, (t) => api.tts(t));
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setLoading(true);
        try {
          const { text } = await api.transcribeAudio(blob);
          if (text && !text.startsWith("[Demo")) {
            await sendMessage(text);
          } else {
            setInput(text.replace("[Demo STT] ", ""));
            setError("语音转写需要 Python 后端，请改用文字输入");
          }
        } catch {
          setError("语音转写失败，请改用文字输入");
        } finally {
          setLoading(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("无法访问麦克风，请检查浏览器权限");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const endSession = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.speakingSummary(sessionId, useModel);
      setSummary(res as unknown as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成总结失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="speaking-page">
      {!sessionId ? (
        <section className="setup-section">
          <p className="page-desc">选择场景进行真实对话训练，支持语音输入、发音评测与语法纠错。</p>

          <div className="card grid-2">
            <div>
              <label htmlFor="scenario-select">练习场景</label>
              <select
                id="scenario-select"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_zh}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="level-select">英语水平</label>
              <select
                id="level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" onClick={startSession} disabled={loading || !backendConnected}>
              {loading ? "准备中..." : "开始练习"}
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="session-bar">
            <div className="session-info">
              <span className="session-tag">{scenarioLabel}</span>
              <span className="session-tag muted">{LEVEL_LABELS[level]}</span>
              <span className="session-meta">已对话 {userTurns} 轮</span>
            </div>
            <div className="btn-row session-actions">
              <button
                className={`btn ${recording ? "btn-warn recording" : "btn-success"}`}
                onClick={recording ? stopRecording : startRecording}
                disabled={loading || !!summary}
              >
                {recording ? "停止录音" : "语音输入"}
              </button>
              <button className="btn btn-ghost" onClick={endSession} disabled={loading || !!summary}>
                结束并总结
              </button>
              <button className="btn btn-ghost" onClick={resetSession} disabled={loading}>
                重新开始
              </button>
            </div>
          </div>

          <div className="card chat-card">
            <div className="chat-window" role="log" aria-live="polite" aria-label="对话记录">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`msg-block ${m.role} animate-msg-in`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  role="article"
                  aria-label={m.role === "user" ? "你的消息" : "AI 回复"}
                >
                  <div className="msg-role">{m.role === "user" ? "你" : "AI"}</div>
                  <div className={`msg ${m.role}`}>{m.content}</div>
                  {m.corrections?.map((c, j) => (
                    <div
                      key={j}
                      className="correction animate-correction-in"
                      style={{ animationDelay: `${0.15 + j * 0.12}s` }}
                    >
                      <span className="correction-icon" aria-hidden="true">
                        ✦
                      </span>
                      <div>
                        <strong>{c.original}</strong> → <strong>{c.suggestion}</strong>
                        <br />
                        <small>{c.reason}</small>
                      </div>
                    </div>
                  ))}
                  {m.score != null && (
                    <div className="score-row">
                      <span className="score-badge animate-score-pop">发音 {m.score}</span>
                      <span className="score-hint">满分 100</span>
                    </div>
                  )}
                </div>
              ))}
              {loading && <AiThinking label={useModel ? "AI 正在生成回复" : "正在分析语法"} />}
              <div ref={chatEndRef} />
            </div>

            {!summary && (
              <div className="chat-input-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入英文，按 Enter 发送..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  disabled={loading}
                  aria-label="输入英文消息"
                />
                <button className="btn btn-primary" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
                  发送
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {summary && (
        <div className="card summary-card animate-summary-in">
          <div className="summary-header">
            <h3>课后总结</h3>
            <button className="btn btn-primary" onClick={resetSession}>
              再练一次
            </button>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{String(summary.overall_score)}</div>
              <div className="stat-label">综合评分</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{(summary.strengths as string[])?.length ?? 0}</div>
              <div className="stat-label">优势项</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{(summary.improvements as string[])?.length ?? 0}</div>
              <div className="stat-label">待提升</div>
            </div>
          </div>
          <div className="summary-details">
            <p>
              <strong>优势：</strong>
              {(summary.strengths as string[])?.join("、")}
            </p>
            <p>
              <strong>改进建议：</strong>
              {(summary.improvements as string[])?.join("、")}
            </p>
            <p>
              <strong>下步计划：</strong>
              {String(summary.next_steps)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
