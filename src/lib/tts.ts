/**
 * Síntesis de voz en inglés, en un solo sitio.
 *
 * El repo tenía seis copias ad-hoc de `new SpeechSynthesisUtterance(...)` y solo
 * una manejaba bien el caso de Chrome: la primera vez, `getVoices()` devuelve
 * una lista vacía y las voces llegan después por el evento `voiceschanged`. Las
 * otras cinco se quedaban con la voz por defecto del sistema, que para un texto
 * en inglés suele ser la voz en español leyendo con acento.
 *
 * Esta versión viene de `ListenButton` (src/components/UnitViewer.tsx), que era
 * la buena, y añade `speakSequence` para leer una lista seguida.
 */

export interface SpeakOptions {
  /** Velocidad. 0.82 para dictados, 0.85 para palabras sueltas. */
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
  onError?: () => void;
}

export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Corta cualquier lectura en curso. Conviene llamarla al desmontar. */
export function cancelSpeech(): void {
  if (!isSpeechAvailable()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* navegador sin soporte real */
  }
}

/**
 * Mejor voz disponible para un idioma. Se prefiere la local porque la de Google
 * depende de la red y falla en silencio sin conexión.
 */
export function getPreferredVoice(lang = 'en-US'): SpeechSynthesisVoice | null {
  if (!isSpeechAvailable()) return null;
  const base = lang.split('-')[0];
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === lang && v.localService) ||
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.startsWith(base)) ||
    null
  );
}

/**
 * Lee un texto en voz alta. Cancela lo que estuviera sonando.
 * Espera a `voiceschanged` si las voces todavía no han cargado.
 */
export function speak(text: string, opts: SpeakOptions = {}): void {
  const { rate = 0.85, pitch = 1, lang = 'en-US', onEnd, onError } = opts;

  if (!isSpeechAvailable() || !text?.trim()) {
    onError?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = rate;
    utt.pitch = pitch;
    if (onEnd) utt.onend = () => onEnd();
    utt.onerror = () => (onError ? onError() : undefined);

    const doSpeak = () => {
      const voice = getPreferredVoice(lang);
      if (voice) utt.voice = voice;
      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      // Chrome carga las voces de forma asíncrona la primera vez.
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }
  } catch {
    onError?.();
  }
}

export interface SpeakSequenceHandle {
  /** Detiene la secuencia; no se leerá nada más. */
  stop: () => void;
}

/**
 * Lee una lista de textos uno detrás de otro, esperando a que termine cada uno
 * (no con `setTimeout` a ojo, que solapa las frases largas).
 *
 * `onIndex` recibe el índice que está sonando, para poder resaltarlo, y -1
 * cuando termina o se detiene.
 */
export function speakSequence(
  texts: readonly string[],
  opts: SpeakOptions & { gapMs?: number; onIndex?: (i: number) => void } = {},
): SpeakSequenceHandle {
  const { gapMs = 450, onIndex, onEnd, ...rest } = opts;
  let stopped = false;
  let timer: number | undefined;

  const finish = () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
    onIndex?.(-1);
  };

  const next = (i: number) => {
    if (stopped) return;
    if (i >= texts.length) {
      finish();
      onEnd?.();
      return;
    }
    onIndex?.(i);
    speak(texts[i], {
      ...rest,
      onEnd: () => {
        if (stopped) return;
        timer = window.setTimeout(() => next(i + 1), gapMs);
      },
      onError: () => {
        if (stopped) return;
        timer = window.setTimeout(() => next(i + 1), gapMs);
      },
    });
  };

  next(0);

  return {
    stop: () => {
      finish();
      cancelSpeech();
    },
  };
}
