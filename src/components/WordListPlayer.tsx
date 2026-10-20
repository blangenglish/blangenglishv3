// @ts-nocheck
// ── Lista de palabras que el estudiante puede escuchar ──────────────────────
//
// Lee las palabras con la voz del navegador (speechSynthesis), así que el
// profesor NO tiene que grabar ni subir ningún archivo: escribe la lista en el
// admin y ya suena. Es la misma técnica que usan los materiales «escucha y
// repite» de las unidades del curso.
//
// Formato que escribe el profesor, una línea por palabra:
//   library = biblioteca
//   to hand in homework = entregar la tarea
//   enough          ← la traducción es opcional
//
// Solo se pronuncia la parte en inglés; la traducción se muestra en gris y
// nunca se lee en voz alta.
import { useEffect, useRef, useState } from 'react';
import { Volume2, Play, Square } from 'lucide-react';

export interface WordItem {
  en: string;
  es: string;
}

/** Convierte el texto plano del admin en pares inglés / traducción. */
export function parseWordList(raw: string | null | undefined): WordItem[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Se acepta "=", " — ", " – " o " - " como separador. El guion exige
      // espacios alrededor para no partir palabras como "twenty-three".
      const m = line.match(/^(.*?)\s*(?:=|\s—\s|\s–\s|\s-\s)\s*(.*)$/);
      if (m && m[1].trim()) return { en: m[1].trim(), es: m[2].trim() };
      return { en: line, es: '' };
    })
    .filter((w) => w.en.length > 0);
}

interface WordListPlayerProps {
  /** Texto tal cual lo escribió el profesor en el admin. */
  words: string | null | undefined;
  /** Encabezado de la tarjeta. */
  label?: string;
}

export function WordListPlayer({ words, label = 'Escucha y repite' }: WordListPlayerProps) {
  const items = parseWordList(words);

  // Índice de la palabra que está sonando ahora, para resaltarla.
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [playingAll, setPlayingAll] = useState(false);
  // playingAll vive también en una ref porque los callbacks de speechSynthesis
  // se crean una vez y verían siempre el valor viejo del estado.
  const allRef = useRef(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    // Si el estudiante cierra la sección o cambia de página, se calla.
    return () => {
      allRef.current = false;
      try { window.speechSynthesis.cancel(); } catch { /* navegador sin soporte */ }
    };
  }, []);

  if (items.length === 0) return null;

  const speak = (text: string, onEnd?: () => void) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      u.onend = () => { if (onEnd) onEnd(); };
      u.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(u);
    } catch {
      if (onEnd) onEnd();
    }
  };

  const stopAll = () => {
    allRef.current = false;
    setPlayingAll(false);
    setSpeaking(null);
    try { window.speechSynthesis.cancel(); } catch { /* vacío */ }
  };

  const playOne = (i: number) => {
    stopAll();
    setSpeaking(i);
    speak(items[i].en, () => setSpeaking((cur) => (cur === i ? null : cur)));
  };

  const playAll = () => {
    if (allRef.current) { stopAll(); return; }
    try { window.speechSynthesis.cancel(); } catch { /* vacío */ }
    allRef.current = true;
    setPlayingAll(true);

    const next = (i: number) => {
      if (!allRef.current || i >= items.length) { stopAll(); return; }
      setSpeaking(i);
      speak(items[i].en, () => {
        // Medio segundo entre palabra y palabra para poder repetirla.
        window.setTimeout(() => next(i + 1), 500);
      });
    };
    next(0);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-primary/15">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Volume2 className="w-4 h-4 text-primary" />
          {label}
          <span className="text-xs font-normal text-muted-foreground">
            ({items.length} {items.length === 1 ? 'palabra' : 'palabras'})
          </span>
        </div>

        {supported && (
          <button
            type="button"
            onClick={playAll}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {playingAll
              ? <><Square className="w-3.5 h-3.5" /> Detener</>
              : <><Play className="w-3.5 h-3.5" /> Escuchar todo</>}
          </button>
        )}
      </div>

      {!supported ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">
          Tu navegador no puede leer las palabras en voz alta. Prueba con Chrome o Edge.
        </p>
      ) : (
        <div className="p-3 grid gap-2 sm:grid-cols-2">
          {items.map((w, i) => (
            <button
              key={`${w.en}-${i}`}
              type="button"
              onClick={() => playOne(i)}
              aria-label={`Escuchar ${w.en}`}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                speaking === i
                  ? 'border-primary bg-primary/15'
                  : 'border-border/50 bg-background hover:border-primary/40'
              }`}
            >
              <Volume2
                className={`w-4 h-4 shrink-0 ${speaking === i ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate">{w.en}</span>
                {w.es && (
                  <span className="block text-xs text-muted-foreground truncate">{w.es}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
