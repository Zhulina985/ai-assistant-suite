/**
 * speech.js - 语音播放
 * 使用浏览器自带的 SpeechSynthesis API 朗读英文
 */

/** 用浏览器朗读一段英文 */
function speakText(text, lang) {
  lang = lang || "en-US";
  if (!("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  var utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

/**
 * 播放 AI 回复的语音
 * 先尝试后端 TTS，失败则用浏览器朗读
 */
function playReplyAudio(text) {
  return api.tts(text).then(function (res) {
    if (res.audio_base64) {
      var audio = new Audio("data:audio/mp3;base64," + res.audio_base64);
      return audio.play();
    }
    speakText(text);
  }).catch(function () {
    speakText(text);
  });
}
