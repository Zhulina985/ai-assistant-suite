/**
 * api.js - 与后端通信
 * 使用浏览器自带的 fetch() 发送 HTTP 请求
 * 不需要 axios、jQuery 等额外库
 */

// 后端地址（Java 后端默认跑在 8000 端口）
var API_BASE = "http://127.0.0.1:8000/api";

/**
 * 通用请求函数
 * @param {string} path - 接口路径，如 "/health"
 * @param {object} options - fetch 的选项（method、body 等）
 */
function request(path, options) {
  options = options || {};
  var headers = { "Content-Type": "application/json" };
  if (options.headers) {
    for (var key in options.headers) {
      headers[key] = options.headers[key];
    }
  }

  return fetch(API_BASE + path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body || undefined,
    credentials: "include",
  }).then(function (res) {
    if (!res.ok) {
      return res.text().then(function (text) {
        throw new Error(text || res.statusText);
      });
    }
    if (res.status === 204) {
      return null;
    }
    return res.text().then(function (text) {
      if (!text) {
        return null;
      }
      return JSON.parse(text);
    });
  });
}

// 把所有接口方法挂到 api 对象上，方便其他地方调用
var api = {
  /** 注册 */
  register: function (username, password) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: username, password: password }),
    });
  },

  /** 登录 */
  login: function (username, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username, password: password }),
    });
  },

  /** 游客登录 */
  guestLogin: function () {
    return request("/auth/guest", { method: "POST" });
  },

  /** 获取当前登录用户 */
  me: function () {
    return request("/auth/me");
  },

  /** 退出登录 */
  logout: function () {
    return request("/auth/logout", { method: "POST" });
  },

  /** 检查后端是否在线、API Key 是否配置 */
  health: function () {
    return request("/health");
  },

  /** 获取练习场景列表 */
  getScenarios: function () {
    return request("/speaking/scenarios");
  },

  /** 创建一个新的练习会话 */
  createSpeakingSession: function (scenario, userLevel) {
    return request("/speaking/sessions", {
      method: "POST",
      body: JSON.stringify({
        scenario: scenario,
        user_level: userLevel,
      }),
    });
  },

  /** 发送一条用户消息，获取 AI 回复和语法纠错 */
  speakingChat: function (sessionId, userMessage, useLlm) {
    return request("/speaking/chat", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        user_message: userMessage,
        request_correction: true,
        use_llm: useLlm !== false,
      }),
    });
  },

  /** 结束练习，生成课后总结 */
  speakingSummary: function (sessionId, useLlm) {
    return request("/speaking/summary", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        use_llm: useLlm !== false,
      }),
    });
  },

  /** 文字转语音（可选，失败时用浏览器朗读） */
  tts: function (text) {
    var url =
      "/speaking/tts?text=" + encodeURIComponent(text) + "&voice=en-US-JennyNeural";
    return request(url, { method: "POST" });
  },

  /** 上传录音文件，转成文字（需要 Python 后端） */
  transcribeAudio: function (blob) {
    var form = new FormData();
    form.append("file", blob, "recording.webm");
    return fetch(API_BASE + "/speaking/transcribe", {
      method: "POST",
      body: form,
      credentials: "include",
    }).then(function (res) {
      if (!res.ok) throw new Error("语音转写失败");
      return res.json();
    });
  },
};
