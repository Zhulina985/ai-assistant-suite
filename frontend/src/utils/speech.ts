export function speakText(text: string, lang = "en-US") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

export async function playReplyAudio(text: string, ttsFn: (t: string) => Promise<{ audio_base64: string }>) {
  try {
    const res = await ttsFn(text);
    if (res.audio_base64) {
      const audio = new Audio(`data:audio/mp3;base64,${res.audio_base64}`);
      await audio.play();
      return;
    }
  } catch {
    /* fallback below */
  }
  speakText(text);
}
