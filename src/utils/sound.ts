/**
 * Singleton Audio feedback service using Web Audio API.
 * Prevents multiple concurrent AudioContext leaks on mobile browsers.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioContext) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioContext = new AudioCtxClass();
    }
  }

  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {
      // User gesture required or autoplay policy active
    });
  }

  return sharedAudioContext;
}

/**
 * Plays an acoustic confirmation tone (e.g. RFID tag read, scale weight lock).
 * @param freq Frequency in Hertz (default 880Hz - A5)
 * @param durationMs Duration in milliseconds (default 150ms)
 */
export function playBeep(freq: number = 880, durationMs: number = 150): void {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Support both seconds (<= 1) and milliseconds (> 1)
    const durationSec = durationMs <= 1 ? durationMs : durationMs / 1000;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + durationSec);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Graceful fallback when audio is blocked or unsupported
  }
}
