export default function AiThinking({ label = "AI 正在思考" }: { label?: string }) {
  return (
    <div className="ai-thinking">
      <div className="ai-avatar-pulse" />
      <div>
        <span className="ai-thinking-label">{label}</span>
        <span className="typing-dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
