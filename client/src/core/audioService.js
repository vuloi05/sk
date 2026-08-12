/**
 * Audio Service for Text-To-Speech and Audio playback.
 */

export function playAudio(word, dictData) {
  // Try to find audio URL from dictionary API
  let audioUrl = '';
  if (dictData && dictData.phonetics) {
    for (const ph of dictData.phonetics) {
      if (ph.audio) {
        audioUrl = ph.audio;
        break;
      }
    }
  }

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => speakFallback(word));
  } else {
    speakFallback(word);
  }
}

export function speakFallback(word) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}
