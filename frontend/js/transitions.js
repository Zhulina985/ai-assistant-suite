/**
 * transitions.js - 页面跳转与视图切换动画
 */
var pageTransition = (function () {
  var EXIT_MS = 300;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** 页面加载时播放入场动画 */
  function init() {
    var root = document.querySelector("[data-page-root]");
    if (!root || prefersReducedMotion()) {
      return;
    }
    requestAnimationFrame(function () {
      root.classList.add("page-enter");
    });
  }

  /** 带出场动画的页面跳转 */
  function navigate(url) {
    var root = document.querySelector("[data-page-root]");
    if (!root || prefersReducedMotion()) {
      window.location.href = url;
      return;
    }
    document.body.classList.add("is-navigating");
    root.classList.add("page-exit");
    window.setTimeout(function () {
      window.location.href = url;
    }, EXIT_MS);
  }

  /** 主页内部区域切换（场景选择 / 对话 / 总结） */
  function switchViews(hideEls, showEl) {
    if (!showEl) {
      return;
    }

    var panels = hideEls.filter(function (el) {
      return el && !el.classList.contains("hidden");
    });

    if (prefersReducedMotion()) {
      hideEls.forEach(function (el) {
        if (el) {
          el.classList.add("hidden");
        }
      });
      showEl.classList.remove("hidden");
      return;
    }

    if (panels.length === 0) {
      showEl.classList.remove("hidden");
      showEl.classList.add("view-enter");
      showEl.addEventListener("animationend", function (e) {
        if (e.target === showEl) {
          showEl.classList.remove("view-enter");
        }
      }, { once: true });
      return;
    }

    panels.forEach(function (el) {
      el.classList.add("view-exit");
      el.addEventListener("animationend", function onExit(e) {
        if (e.target !== el) {
          return;
        }
        el.classList.remove("view-exit");
        el.classList.add("hidden");
        el.removeEventListener("animationend", onExit);
      });
    });

    showEl.classList.remove("hidden");
    showEl.classList.add("view-enter");
    showEl.addEventListener("animationend", function (e) {
      if (e.target === showEl) {
        showEl.classList.remove("view-enter");
      }
    }, { once: true });
  }

  return {
    init: init,
    navigate: navigate,
    switchViews: switchViews,
  };
})();

document.addEventListener("DOMContentLoaded", pageTransition.init);
