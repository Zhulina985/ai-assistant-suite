/**
 * auth-page.js - 登录 / 注册页逻辑
 */

document.addEventListener("DOMContentLoaded", function () {
  // 已登录则跳转到主页
  api.me().then(function () {
    window.location.href = "index.html";
  }).catch(function () {});

  bindTabs();
  bindForms();
  document.getElementById("btn-guest").addEventListener("click", onGuestLogin);
});

function bindTabs() {
  var tabLogin = document.getElementById("tab-login");
  var tabRegister = document.getElementById("tab-register");
  var loginForm = document.getElementById("login-form");
  var registerForm = document.getElementById("register-form");

  tabLogin.addEventListener("click", function () {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    hideError();
  });

  tabRegister.addEventListener("click", function () {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    hideError();
  });
}

function bindForms() {
  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();
    var username = document.getElementById("login-username").value.trim();
    var password = document.getElementById("login-password").value;
    api.login(username, password).then(goHome).catch(showError);
  });

  document.getElementById("register-form").addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();
    var username = document.getElementById("reg-username").value.trim();
    var password = document.getElementById("reg-password").value;
    var password2 = document.getElementById("reg-password2").value;
    if (password !== password2) {
      showError("两次输入的密码不一致");
      return;
    }
    api.register(username, password).then(goHome).catch(showError);
  });
}

function onGuestLogin() {
  hideError();
  api.guestLogin().then(goHome).catch(showError);
}

function goHome() {
  window.location.href = "index.html";
}

function showError(err) {
  var msg = typeof err === "string" ? err : (err.message || "操作失败");
  try {
    var parsed = JSON.parse(msg);
    if (parsed.message) msg = parsed.message;
  } catch (e) {}
  var el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError() {
  document.getElementById("auth-error").classList.add("hidden");
}
