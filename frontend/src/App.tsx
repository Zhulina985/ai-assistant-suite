import { useEffect, useState } from "react";
import { ModelSettingsProvider, useModelSettings } from "./context/ModelSettings";
import SpeakingCoach from "./pages/SpeakingCoach";
import { api } from "./services/api";

function Sidebar() {
  const { useModel, setUseModel, llmAvailable, backendConnected } = useModelSettings();

  const statusText = !backendConnected
    ? "后端连接中..."
    : !llmAvailable
      ? "演示模式（无需 API Key）"
      : useModel
        ? "AI 模型已启用"
        : "演示模式（规则引擎）";

  const statusClass = backendConnected && (llmAvailable ? useModel : true) ? "ok" : "warn";

  return (
    <aside className="sidebar">
      <h1>英语口语陪练</h1>
      <p className="subtitle">
        <span className={`status-dot ${statusClass}`} />
        {statusText}
      </p>

      <div className="model-toggle-card">
        <label className="toggle-row">
          <span>使用 AI 模型</span>
          <input
            type="checkbox"
            checked={useModel}
            disabled={!backendConnected || !llmAvailable}
            onChange={(e) => setUseModel(e.target.checked)}
          />
        </label>
        <p className="toggle-hint">
          {!backendConnected
            ? "正在连接后端，请稍候..."
            : llmAvailable
              ? useModel
                ? "调用 OpenRouter 模型，回复更智能（稍慢）"
                : "使用本地规则引擎，响应快、不消耗额度"
              : "未配置 API Key，自动使用演示模式"}
        </p>
      </div>

      <div className="sidebar-tips">
        <h3>使用提示</h3>
        <ul>
          <li>选择场景与水平后点击「开始练习」</li>
          <li>支持文字输入或语音输入</li>
          <li>结束后可查看课后总结</li>
        </ul>
      </div>
    </aside>
  );
}

function AppShell() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [llmOk, setLlmOk] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          const h = await api.health();
          if (cancelled) return;
          setBackendConnected(true);
          setLlmOk(!!h.llm_configured);
          setReady(true);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (!cancelled) {
        setBackendConnected(false);
        setLlmOk(false);
        setReady(true);
      }
    };

    checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <h1>英语口语陪练</h1>
          <p className="subtitle">
            <span className="status-dot warn" />
            正在启动...
          </p>
        </aside>
        <main className="main main-loading">
          <p>正在连接后端服务...</p>
        </main>
      </div>
    );
  }

  return (
    <ModelSettingsProvider llmAvailable={llmOk} backendConnected={backendConnected}>
      <Sidebar />
      <main className="main">
        <SpeakingCoach />
      </main>
    </ModelSettingsProvider>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <AppShell />
    </div>
  );
}
