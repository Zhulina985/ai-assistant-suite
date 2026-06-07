/**
 * app.js - 主程序
 * 负责页面交互：按钮点击、显示消息、调用接口
 *
 * 讲解要点：
 * 1. 用 document.getElementById 获取页面元素
 * 2. 用 addEventListener 绑定点击、键盘事件
 * 3. 用 innerHTML / classList 更新页面内容
 * 4. 用 Promise（.then）处理异步请求
 */

// ========== 全局状态（整个页面共用的数据） ==========
var appState = {
  backendConnected: false,  // 后端是否在线
  llmAvailable: false,      // 是否配置了 API Key
  useModel: true,           // 是否使用 AI 模型
  sessionId: "",            // 当前会话 ID
  scenario: "interview",    // 当前场景
  level: "intermediate",    // 当前水平
  messages: [],             // 对话记录
  loading: false,           // 是否正在等待回复
  recording: false,         // 是否正在录音
  mediaRecorder: null,      // 录音器对象
  audioChunks: [],          // 录音数据片段
};

// 场景中文名对照表
var SCENARIO_LABELS = {
  interview: "面试",
  restaurant: "点餐",
  meeting: "会议",
  travel: "旅行",
  daily: "日常对话",
};

var LEVEL_LABELS = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

// ========== 页面加载完成后执行 ==========
document.addEventListener("DOMContentLoaded", function () {
  checkLogin().then(function (user) {
    showUserInfo(user);
    bindEvents();
    checkBackendHealth();
    loadScenarios();
  }).catch(function () {
    window.location.href = "login.html";
  });
});

/** 检查是否已登录，未登录跳转登录页 */
function checkLogin() {
  return api.me();
}

/** 显示当前用户信息 */
function showUserInfo(user) {
  var label = user.guest ? user.username + "（游客）" : user.username;
  document.getElementById("user-info").textContent = "当前用户：" + label;
  document.getElementById("user-info").classList.remove("hidden");
  document.getElementById("btn-logout").classList.remove("hidden");
}

/** 绑定所有按钮和输入框的事件 */
function bindEvents() {
  document.getElementById("use-model-checkbox").addEventListener("change", onModelToggle);
  document.getElementById("btn-start").addEventListener("click", startSession);
  document.getElementById("btn-send").addEventListener("click", onSendClick);
  document.getElementById("btn-voice").addEventListener("click", onVoiceClick);
  document.getElementById("btn-summary").addEventListener("click", endSession);
  document.getElementById("btn-restart").addEventListener("click", resetSession);
  document.getElementById("btn-again").addEventListener("click", resetSession);
  document.getElementById("btn-logout").addEventListener("click", function () {
    api.logout().then(function () {
      window.location.href = "login.html";
    });
  });

  document.getElementById("scenario-select").addEventListener("change", function (e) {
    appState.scenario = e.target.value;
  });
  document.getElementById("level-select").addEventListener("change", function (e) {
    appState.level = e.target.value;
  });

  // 按 Enter 键发送消息
  document.getElementById("message-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      onSendClick();
    }
  });
}

/** 轮询检查后端是否启动（最多试 12 次） */
function checkBackendHealth() {
  var attempt = 0;
  var maxAttempts = 12;

  function tryOnce() {
    api.health().then(function (data) {
      appState.backendConnected = true;
      appState.llmAvailable = !!data.llm_configured;

      // 从 localStorage 读取上次的模型开关设置
      var saved = localStorage.getItem("useAiModel");
      if (saved !== null) {
        appState.useModel = saved === "true";
      } else {
        appState.useModel = appState.llmAvailable;
      }

      showApp();
      updateSidebar();
    }).catch(function () {
      attempt++;
      if (attempt < maxAttempts) {
        setTimeout(tryOnce, 1000);
      } else {
        appState.backendConnected = false;
        showApp();
        updateSidebar();
        showError("后端未连接，请先运行 start-backend-java.bat");
      }
    });
  }

  tryOnce();
}

/** 从后端加载场景列表，填充下拉框 */
function loadScenarios() {
  api.getScenarios().then(function (data) {
    if (!data.scenarios || data.scenarios.length === 0) return;
    var select = document.getElementById("scenario-select");
    select.innerHTML = "";
    for (var i = 0; i < data.scenarios.length; i++) {
      var s = data.scenarios[i];
      var option = document.createElement("option");
      option.value = s.id;
      option.textContent = s.name_zh;
      select.appendChild(option);
    }
    appState.scenario = data.scenarios[0].id;
  }).catch(function () {
    // 加载失败就用 HTML 里写好的默认选项
  });
}

/** 隐藏加载页，显示主界面 */
function showApp() {
  document.getElementById("loading-view").classList.add("hidden");
  document.getElementById("app-view").classList.remove("hidden");
  document.getElementById("btn-start").disabled = !appState.backendConnected;
}

/** 更新左侧边栏的状态文字 */
function updateSidebar() {
  var statusDot = document.getElementById("status-dot");
  var statusText = document.getElementById("status-text");
  var toggleHint = document.getElementById("toggle-hint");
  var checkbox = document.getElementById("use-model-checkbox");

  if (!appState.backendConnected) {
    statusDot.className = "status-dot warn";
    statusText.textContent = "后端未连接";
    toggleHint.textContent = "请先启动 start-backend-java.bat";
    checkbox.disabled = true;
    checkbox.checked = false;
    return;
  }

  checkbox.disabled = !appState.llmAvailable;
  checkbox.checked = appState.useModel && appState.llmAvailable;

  if (!appState.llmAvailable) {
    statusDot.className = "status-dot warn";
    statusText.textContent = "演示模式（无需 API Key）";
    toggleHint.textContent = "未配置 API Key，自动使用演示模式";
  } else if (appState.useModel) {
    statusDot.className = "status-dot ok";
    statusText.textContent = "AI 模型已启用";
    toggleHint.textContent = "调用 OpenRouter 模型，回复更智能（稍慢）";
  } else {
    statusDot.className = "status-dot warn";
    statusText.textContent = "演示模式（规则引擎）";
    toggleHint.textContent = "使用本地规则引擎，响应快、不消耗额度";
  }
}

/** 切换「使用 AI 模型」开关 */
function onModelToggle(e) {
  appState.useModel = e.target.checked;
  localStorage.setItem("useAiModel", String(appState.useModel));
  updateSidebar();
}

/** 点击「开始练习」 */
function startSession() {
  if (!appState.backendConnected) {
    showError("后端未连接，请先启动 start-backend-java.bat");
    return;
  }

  setLoading(true);
  hideError();
  document.getElementById("summary-section").classList.add("hidden");

  api.createSpeakingSession(appState.scenario, appState.level).then(function (session) {
    appState.sessionId = session.session_id;
    appState.messages = [];
    for (var i = 0; i < session.messages.length; i++) {
      appState.messages.push({
        role: session.messages[i].role,
        content: session.messages[i].content,
      });
    }

    // 切换到对话界面
    document.getElementById("setup-section").classList.add("hidden");
    document.getElementById("chat-section").classList.remove("hidden");
    document.getElementById("chat-input-row").classList.remove("hidden");

    updateSessionBar();
    renderMessages();
    setLoading(false);
  }).catch(function (err) {
    showError(err.message || "创建会话失败");
    setLoading(false);
  });
}

/** 点击「发送」 */
function onSendClick() {
  var input = document.getElementById("message-input");
  var text = input.value.trim();
  if (!text || appState.loading) return;
  input.value = "";
  sendMessage(text);
}

/** 发送一条消息给后端 */
function sendMessage(text) {
  if (!appState.sessionId) return;

  // 先把用户消息显示出来
  appState.messages.push({ role: "user", content: text });
  renderMessages();
  setLoading(true);
  hideError();

  api.speakingChat(appState.sessionId, text, appState.useModel).then(function (res) {
    appState.messages.push({
      role: "assistant",
      content: res.reply,
      corrections: res.corrections || [],
      score: res.pronunciation_score,
    });
    renderMessages();
    playReplyAudio(res.reply);
    updateSessionBar();
    setLoading(false);
  }).catch(function (err) {
    showError(err.message || "发送失败");
    setLoading(false);
  });
}

/** 点击「语音输入」 */
function onVoiceClick() {
  if (appState.recording) {
    stopRecording();
  } else {
    startRecording();
  }
}

/** 开始录音 */
function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    appState.audioChunks = [];
    var recorder = new MediaRecorder(stream);

    recorder.ondataavailable = function (e) {
      appState.audioChunks.push(e.data);
    };

    recorder.onstop = function () {
      var blob = new Blob(appState.audioChunks, { type: "audio/webm" });
      setLoading(true);
      api.transcribeAudio(blob).then(function (result) {
        if (result.text && result.text.indexOf("[Demo") !== 0) {
          sendMessage(result.text);
        } else {
          document.getElementById("message-input").value = result.text.replace("[Demo STT] ", "");
          showError("语音转写需要 Python 后端，请改用文字输入");
          setLoading(false);
        }
      }).catch(function () {
        showError("语音转写失败，请改用文字输入");
        setLoading(false);
      });
      stream.getTracks().forEach(function (t) { t.stop(); });
    };

    appState.mediaRecorder = recorder;
    recorder.start();
    appState.recording = true;

    var btn = document.getElementById("btn-voice");
    btn.textContent = "停止录音";
    btn.className = "btn btn-warn recording";
  }).catch(function () {
    showError("无法访问麦克风，请检查浏览器权限");
  });
}

/** 停止录音 */
function stopRecording() {
  if (appState.mediaRecorder) {
    appState.mediaRecorder.stop();
  }
  appState.recording = false;
  var btn = document.getElementById("btn-voice");
  btn.textContent = "语音输入";
  btn.className = "btn btn-success";
}

/** 点击「结束并总结」 */
function endSession() {
  if (!appState.sessionId) return;
  setLoading(true);
  hideError();

  api.speakingSummary(appState.sessionId, appState.useModel).then(function (summary) {
    document.getElementById("chat-input-row").classList.add("hidden");
    document.getElementById("summary-section").classList.remove("hidden");

    document.getElementById("stat-score").textContent = summary.overall_score;
    document.getElementById("stat-strengths").textContent = (summary.strengths || []).length;
    document.getElementById("stat-improvements").textContent = (summary.improvements || []).length;
    document.getElementById("summary-strengths").textContent = (summary.strengths || []).join("、");
    document.getElementById("summary-improvements").textContent = (summary.improvements || []).join("、");
    document.getElementById("summary-next").textContent = summary.next_steps || "";

    setLoading(false);
  }).catch(function (err) {
    showError(err.message || "生成总结失败");
    setLoading(false);
  });
}

/** 重新开始练习 */
function resetSession() {
  appState.sessionId = "";
  appState.messages = [];
  appState.recording = false;

  document.getElementById("setup-section").classList.remove("hidden");
  document.getElementById("chat-section").classList.add("hidden");
  document.getElementById("summary-section").classList.add("hidden");
  document.getElementById("chat-input-row").classList.remove("hidden");
  document.getElementById("message-input").value = "";
  document.getElementById("btn-voice").textContent = "语音输入";
  document.getElementById("btn-voice").className = "btn btn-success";

  hideError();
  renderMessages();
}

/** 更新顶部会话状态条 */
function updateSessionBar() {
  document.getElementById("session-scenario").textContent =
    SCENARIO_LABELS[appState.scenario] || appState.scenario;
  document.getElementById("session-level").textContent =
    LEVEL_LABELS[appState.level] || appState.level;

  var userCount = 0;
  for (var i = 0; i < appState.messages.length; i++) {
    if (appState.messages[i].role === "user") userCount++;
  }
  document.getElementById("session-turns").textContent = "已对话 " + userCount + " 轮";
}

/** 把对话记录渲染到聊天窗口 */
function renderMessages() {
  var chatWindow = document.getElementById("chat-window");
  var html = "";

  for (var i = 0; i < appState.messages.length; i++) {
    var m = appState.messages[i];
    var roleLabel = m.role === "user" ? "你" : "AI";

    html += '<div class="msg-block ' + m.role + '">';
    html += '<div class="msg-role">' + roleLabel + '</div>';
    html += '<div class="msg ' + m.role + '">' + escapeHtml(m.content) + '</div>';

    // 语法纠错卡片
    if (m.corrections && m.corrections.length > 0) {
      for (var j = 0; j < m.corrections.length; j++) {
        var c = m.corrections[j];
        html += '<div class="correction">';
        html += '<span class="correction-icon">✦</span>';
        html += '<div><strong>' + escapeHtml(c.original) + '</strong> → ';
        html += '<strong>' + escapeHtml(c.suggestion) + '</strong><br>';
        html += '<small>' + escapeHtml(c.reason) + '</small></div>';
        html += '</div>';
      }
    }

    // 发音评分
    if (m.score != null) {
      html += '<div class="score-row">';
      html += '<span class="score-badge">发音 ' + m.score + '</span>';
      html += '<span class="score-hint">满分 100</span>';
      html += '</div>';
    }

    html += '</div>';
  }

  // 加载动画
  if (appState.loading) {
    var label = appState.useModel ? "AI 正在生成回复" : "正在分析语法";
    html += '<div class="ai-thinking">';
    html += '<div class="ai-avatar-pulse"></div>';
    html += '<div><span class="ai-thinking-label">' + label + '</span>';
    html += '<span class="typing-dots"><span></span><span></span><span></span></span>';
    html += '</div></div>';
  }

  chatWindow.innerHTML = html;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/** 防止 XSS：把特殊字符转成 HTML 实体 */
function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** 显示/隐藏加载状态，并刷新聊天区 */
function setLoading(isLoading) {
  appState.loading = isLoading;
  renderMessages();

  var disabled = isLoading;
  document.getElementById("btn-send").disabled = disabled;
  document.getElementById("btn-start").disabled = disabled || !appState.backendConnected;
  document.getElementById("btn-voice").disabled = disabled;
  document.getElementById("btn-summary").disabled = disabled;
  document.getElementById("message-input").disabled = disabled;
}

/** 显示错误提示 */
function showError(msg) {
  var banner = document.getElementById("error-banner");
  banner.textContent = msg;
  banner.classList.remove("hidden");
}

/** 隐藏错误提示 */
function hideError() {
  document.getElementById("error-banner").classList.add("hidden");
}
