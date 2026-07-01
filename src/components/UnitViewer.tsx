// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  X, Film, ExternalLink, Link2,
  Loader2, BookOpen, Lock, CheckCircle2,
  ChevronRight, ChevronLeft, Trophy, RefreshCw,
  CheckCircle, XCircle, Volume2, Copy, Check,
} from 'lucide-react';
import { STAGES, MATERIAL_TYPE_CONFIG, type Stage, type UnitStageMaterial } from '@/lib/stages';
import { getUnitProgress, setStageCompleted, hasMigrated, mergeFromRemote } from '@/lib/localProgress';

// ─── Google Drive helper ─────────────────────────────────────────────────────
function getGoogleDriveId(url) {
  if (!url) return null;
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

// ─── YouTube helpers ──────────────────────────────────────────────────────────
function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function getEmbedUrl(url) {
  const yt = extractYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
function getYouTubeThumbnail(url) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// ─── HTML renderer ────────────────────────────────────────────────────────────
function isHtml(s) { return /<[a-z][\s\S]*>/i.test(s); }
function RichContent({ html }) {
  if (!html) return null;
  if (isHtml(html)) {
    return (
      <div
        className="prose prose-sm max-w-none text-foreground [&_*]:text-foreground [&_a]:text-primary [&_b]:font-bold [&_strong]:font-bold"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <p className="text-sm whitespace-pre-wrap">{html}</p>;
}

// ─── Strip HTML to plain text (preserving block-level newlines) ──────────────
function htmlToText(html) {
  // Replace block-level tags with newlines BEFORE stripping
  const withNewlines = html
    .replace(/<\/?(div|p|br|li|tr|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');  // strip remaining tags
  // Decode HTML entities
  const tmp = document.createElement('textarea');
  tmp.innerHTML = withNewlines;
  return tmp.value || withNewlines;
}

// ─── Extract words from vocabulary HTML ───────────────────────────────────────
function extractVocabWords(html) {
  const text = htmlToText(html);
  // Split by newlines and also by common separators; filter short unique words
  const lines = text
    .split(/[\n,;]+/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.length < 60 && !/^\s*$/.test(l));
  // Deduplicate
  return [...new Set(lines)];
}

// ─── Vocabulary renderer with TTS ─────────────────────────────────────────────
function VocabularyMaterial({ html }) {
  const [speaking, setSpeaking] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoIdx, setAutoIdx] = useState(0);
  const words = extractVocabWords(html);

  const speak = (word, idx) => {
    setSpeaking(idx);
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    utt.onend = () => setSpeaking(null);
    window.speechSynthesis.speak(utt);
  };

  useEffect(() => {
    if (!autoPlay || autoIdx >= words.length) {
      if (autoIdx >= words.length) setAutoPlay(false);
      return;
    }
    const timer = setTimeout(() => {
      speak(words[autoIdx], autoIdx);
      setAutoIdx(i => i + 1);
    }, 1800);
    return () => clearTimeout(timer);
  }, [autoPlay, autoIdx]);

  if (words.length === 0) return <RichContent html={html} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground italic">Toca cada palabra para escucharla</p>
        <button
          onClick={() => { setAutoIdx(0); setAutoPlay(true); }}
          disabled={autoPlay}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
          <Volume2 className="w-3.5 h-3.5" />
          {autoPlay ? 'Reproduciendo...' : 'Escuchar todo'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {words.map((word, idx) => (
          <button key={idx}
            onClick={() => speak(word, idx)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold text-left transition-all',
              speaking === idx
                ? 'border-primary bg-primary text-primary-foreground shadow-md scale-105'
                : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
            )}>
            <Volume2 className={cn('w-4 h-4 shrink-0', speaking === idx ? 'text-primary-foreground' : 'text-primary')} />
            <span className="flex-1">{word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Reading renderer with floating tooltip translation ───────────────────────
function ReadingMaterial({ html }) {
  // tooltip: posición en viewport + contenido
  const [tooltip, setTooltip] = useState<{
    anchorX: number;  // centro horizontal del anchor (viewport coords)
    anchorY: number;  // borde superior del anchor (viewport coords)
    original: string;
    translated: string | null;
    loading: boolean;
    below: boolean;   // true = mostrar debajo del anchor (cuando está muy arriba)
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // ── Llama a la API y actualiza el tooltip en el mismo lugar ──
  const fetchTranslation = async (text: string, anchorX: number, anchorY: number) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) return;
    const below = anchorY < 140; // poco espacio arriba → mostrar debajo
    setTooltip({ anchorX, anchorY, original: trimmed, translated: null, loading: true, below });
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 500))}&langpair=en|es`
      );
      const data = await res.json();
      const translated = data?.responseData?.translatedText || 'No se pudo traducir';
      setTooltip(prev => prev ? { ...prev, translated, loading: false } : null);
    } catch {
      setTooltip(prev => prev ? { ...prev, translated: 'Error al traducir.', loading: false } : null);
    }
  };

  // ── Selección de texto con ratón / arrastre ──
  const handleMouseUp = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const selText = sel.toString().trim();
    if (selText.length < 2) return;
    // Usar el bounding rect de la selección para anclar el tooltip
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();
    fetchTranslation(selText, rect.left + rect.width / 2, rect.top);
    e.stopPropagation();
  };

  // ── Toque / click en párrafo (sin texto seleccionado) ──
  const handleClick = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return; // ya lo maneja mouseup
    if (tooltipRef.current?.contains(e.target as Node)) return;

    // Buscar el elemento de texto más próximo (párrafo, ítem de lista, etc.)
    const el = (e.target as HTMLElement).closest('p, li, h1, h2, h3, h4, h5, h6, span, div');
    if (!el) return;
    const text = (el.textContent || '').trim();
    if (text.length < 3) return;
    fetchTranslation(text, e.clientX, e.clientY);
  };

  // ── Cerrar al hacer click fuera del tooltip ──
  useEffect(() => {
    if (!tooltip) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    // capture:true para que se ejecute antes de otros handlers
    document.addEventListener('mousedown', close, true);
    document.addEventListener('touchstart', close, true);
    return () => {
      document.removeEventListener('mousedown', close, true);
      document.removeEventListener('touchstart', close, true);
    };
  }, [tooltip]);

  // ── Calcular estilo del tooltip flotante ──
  const tooltipStyle = (() => {
    if (!tooltip) return {};
    const vw       = window.innerWidth;
    const tipW     = Math.min(256, vw - 16);
    const left     = Math.min(Math.max(tooltip.anchorX - tipW / 2, 8), vw - tipW - 8);
    const top      = tooltip.below
      ? tooltip.anchorY + 20             // debajo del anchor
      : tooltip.anchorY - 8;            // encima (translateY(-100%) lo sube)
    return {
      position: 'fixed' as const,
      left,
      top,
      width: tipW,
      transform: tooltip.below ? 'none' : 'translateY(-100%)',
      zIndex: 9999,
    };
  })();

  // Texto original truncado para el tooltip (sin desbordar)
  const originalSnippet = tooltip
    ? tooltip.original.length > 90
      ? tooltip.original.slice(0, 90) + '…'
      : tooltip.original
    : '';

  return (
    <div className="space-y-3">
      {/* Instrucción */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <span className="text-base">💡</span>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Selecciona</strong> texto o <strong>toca</strong> un párrafo para traducirlo al español.
        </p>
      </div>

      {/* Cuerpo del texto */}
      <div
        className="p-4 rounded-xl border-2 border-border bg-card leading-relaxed text-sm cursor-pointer hover:border-primary/30 transition-colors select-text"
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      >
        <RichContent html={html} />
      </div>

      {/* ── Tooltip flotante (portal visual con position:fixed) ── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className="relative rounded-2xl border-2 border-primary/40 bg-card shadow-2xl shadow-black/20 p-3 pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Flecha decorativa */}
          <div className={cn(
            'absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-card border-primary/40 rotate-45',
            tooltip.below
              ? 'top-[-6px] border-t-2 border-l-2'    // flecha apunta arriba
              : 'bottom-[-6px] border-b-2 border-r-2', // flecha apunta abajo
          )} />

          {/* Contenido */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Original */}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                🇺🇸 Original
              </p>
              <p className="text-xs italic text-foreground/80 leading-snug">
                "{originalSnippet}"
              </p>

              {/* Traducción / spinner */}
              {tooltip.loading ? (
                <div className="flex items-center gap-1.5 text-xs text-primary pt-0.5">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" /> Traduciendo…
                </div>
              ) : tooltip.translated ? (
                <>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none pt-0.5">
                    🇨🇴 Traducción
                  </p>
                  <p className="text-xs font-semibold text-primary leading-snug">
                    "{tooltip.translated}"
                  </p>
                </>
              ) : null}
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setTooltip(null)}
              className="shrink-0 mt-0.5 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Answer logic helpers (uses the REAL DB structure) ────────────────────────
// opts = options array from DB: [{text, isCorrect, correctAnswer?}]
function getCorrectTexts(q) {
  // For types that use options[].isCorrect
  const opts = q.options || [];
  if (['multiple_choice','true_false','listen_select','image_choice','image_url'].includes(q.type)) {
    return opts.filter(o => o.isCorrect).map(o => o.text);
  }
  if (q.type === 'multiple_select') {
    return opts.filter(o => o.isCorrect).map(o => o.text);
  }
  // fill_gap, image_write, listen_write, rewrite, organize → q.correctAnswer
  if (['fill_gap','image_write','listen_write','rewrite','organize'].includes(q.type)) {
    return [String(q.correctAnswer || '').trim()];
  }
  return [];
}

// ─── Botón de reproducción de audio (Web Speech Synthesis) ──────────────────
function ListenButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'done' | 'error'>('idle');

  const playAudio = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setStatus('error');
      return;
    }

    window.speechSynthesis.cancel();
    setStatus('playing');

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.82;
    utt.pitch = 1.0;
    utt.onend   = () => setStatus('done');
    utt.onerror = () => setStatus('error');

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      // Preferir voz en-US nativa (no Google TTS que puede fallar offline)
      const voice =
        voices.find(v => v.lang === 'en-US' && v.localService) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en'));
      if (voice) utt.voice = voice;
      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      // Chrome carga voces de forma asíncrona la primera vez
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }
  }, [text]);

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/80 p-4 space-y-2.5">
      <div className="flex items-center gap-2 justify-center">
        <span className="text-lg">🎧</span>
        <p className="text-sm font-semibold text-blue-900">Escucha con atención y responde</p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={playAudio}
          disabled={status === 'playing'}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all',
            status === 'playing'
              ? 'bg-blue-200 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm',
          )}
        >
          {status === 'playing' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Reproduciendo…</>
          ) : (
            <><Volume2 className="w-4 h-4" /> {status === 'done' ? 'Escuchar de nuevo' : '▶ Escuchar audio'}</>
          )}
        </button>
      </div>

      {status === 'idle' && (
        <p className="text-xs text-blue-600 text-center">Presiona el botón para escuchar el audio</p>
      )}
      {status === 'done' && (
        <p className="text-xs text-blue-700 text-center font-medium">✓ Puedes escucharlo de nuevo cuando quieras</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">
          ⚠️ Tu navegador no soporta síntesis de voz. Prueba con Chrome o Edge.
        </p>
      )}
    </div>
  );
}

// ─── Inline Quiz Player ───────────────────────────────────────────────────────
function InlineQuiz({ questions, onPassed }) {
  const [cur, setCur] = useState(0);
  const [selected, setSelected] = useState(null);   // string for single, string[] for multi
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  // results: un objeto por cada pregunta respondida, para mostrar el resumen
  const [results, setResults] = useState([]);
  // hasCalled: evita doble-llamada a onPassed()
  const [hasCalled, setHasCalled] = useState(false);

  // match: {optText -> correctAnswer}
  const [matchMap, setMatchMap] = useState({});
  const [matchLeft, setMatchLeft] = useState(null);
  const [matchRightShuffled, setMatchRightShuffled] = useState([]);

  // image_match: {word -> imgUrl} already provided in imagePairs
  const [imgMatchMap, setImgMatchMap] = useState({});  // imgUrl -> word (user picks word for each image)
  const [imgMatchShuffledWords, setImgMatchShuffledWords] = useState([]);
  const [selImg, setSelImg] = useState(null);  // selected image URL in image_match

  // story_order: storyItems reordered
  const [storyOrder, setStoryOrder] = useState([]);

  // lightbox para imágenes
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // word_sort: {optText -> categoryName}
  const [wordPlacements, setWordPlacements] = useState({});
  const [wordSelected, setWordSelected] = useState(null);
  const [categories, setCategories] = useState([]);
  const [wordItems, setWordItems] = useState([]);

  const q = questions[cur];
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 60;

  // Reset per-question state
  useEffect(() => {
    if (!q) return;
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setMatchMap({});
    setMatchLeft(null);
    setImgMatchMap({});
    setSelImg(null);

    // match: build right column shuffled
    if (q.type === 'match') {
      const rights = (q.options || []).map(o => o.correctAnswer).filter(Boolean);
      setMatchRightShuffled([...rights].sort(() => Math.random() - 0.5));
    }

    // image_match: imagePairs = [{id, word, imageUrl}]
    if (q.type === 'image_match') {
      const pairs = q.imagePairs || [];
      const words = pairs.map(p => p.word);
      setImgMatchShuffledWords([...words].sort(() => Math.random() - 0.5));
      setImgMatchMap({});
    }

    // story_order: storyItems = string[]
    if (q.type === 'story_order') {
      const items = q.storyItems || [];
      setStoryOrder([...items].sort(() => Math.random() - 0.5));
    }

    // word_sort / classify: options = [{text, correctAnswer (= category name)}]
    if (q.type === 'word_sort' || q.type === 'classify') {
      const opts = q.options || [];
      const cats = [...new Set(opts.map(o => o.correctAnswer).filter(Boolean))];
      setCategories(cats);
      setWordItems(opts.map(o => o.text));
      setWordPlacements({});
      setWordSelected(null);
    }
  }, [cur, q?.id]);

  // ─── Check correctness ────────────────────────────────────────────────────
  const checkAnswer = () => {
    if (!q) return false;
    const type = q.type;
    const opts = q.options || [];

    // Single choice (multiple_choice, true_false, listen_select, image_choice, image_url)
    if (['multiple_choice','true_false','listen_select','image_choice','image_url'].includes(type)) {
      // find selected option and check isCorrect
      const selOpt = opts.find(o => o.text === selected);
      return selOpt?.isCorrect === true;
    }

    // Multiple select
    if (type === 'multiple_select') {
      const selArr = Array.isArray(selected) ? selected : [];
      const correctTexts = opts.filter(o => o.isCorrect).map(o => o.text).sort();
      const selSorted = [...selArr].sort();
      return JSON.stringify(selSorted) === JSON.stringify(correctTexts);
    }

    // Fill gap / write types — case-insensitive trim
    if (['fill_gap','image_write','listen_write','rewrite','organize'].includes(type)) {
      // Para listen_write el admin solo guarda q.question (la palabra a escuchar);
      // si correctAnswer no está definido, la respuesta correcta ES q.question.
      const correctSource =
        type === 'listen_write' && !q.correctAnswer
          ? q.question
          : (q.correctAnswer || '');
      const correct = String(correctSource).trim().toLowerCase();
      const ans = textAnswer.trim().toLowerCase();
      return ans === correct;
    }

    // Match: options[i].text -> options[i].correctAnswer
    if (type === 'match') {
      return opts.every(o => matchMap[o.text] === o.correctAnswer);
    }

    // Image match: imagePairs[i].imageUrl -> imagePairs[i].word
    if (type === 'image_match') {
      const pairs = q.imagePairs || [];
      return pairs.every(p => imgMatchMap[p.imageUrl] === p.word);
    }

    // Story order: storyItems are the correct order (index 0 = first)
    if (type === 'story_order') {
      const correct = q.storyItems || [];
      return JSON.stringify(storyOrder) === JSON.stringify(correct);
    }

    // Word sort / classify: each wordItem goes to its correctAnswer category
    if (type === 'word_sort' || type === 'classify') {
      const optMap = {};
      (q.options || []).forEach(o => { optMap[o.text] = o.correctAnswer; });
      return wordItems.every(w => wordPlacements[w] === optMap[w]);
    }

    return false;
  };

  const handleSubmit = () => {
    const correct = checkAnswer();
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) setScore(s => s + 1);

    // Registrar resultado para el resumen final
    const wt = ['fill_gap','image_write','listen_write','rewrite','organize'];
    const sc = ['multiple_choice','true_false','listen_select','image_choice','image_url'];
    const qOpts = q.options || [];
    const correctAns = (() => {
      if (wt.includes(q.type)) {
        if (q.type === 'listen_write' && !q.correctAnswer) return q.question || '';
        return q.correctAnswer || '';
      }
      if (sc.includes(q.type) || q.type === 'multiple_select')
        return qOpts.filter(o => o.isCorrect).map(o => o.text).join(', ');
      if (q.type === 'match')
        return qOpts.map(o => `${o.text} → ${o.correctAnswer}`).join(' | ');
      return '';
    })();
    const qTxt = (() => {
      if (['listen_write','listen_select'].includes(q.type))
        return `Pregunta de escucha ${cur + 1}`;
      const plain = (q.question || '').replace(/<[^>]*>/g, '').trim();
      return plain.length > 58 ? plain.slice(0, 58) + '…' : plain || `Pregunta ${cur + 1}`;
    })();
    setResults(prev => [...prev, { correct, correctAnswer: correctAns, questionText: qTxt }]);
  };

  const handleNext = () => {
    if (cur < total - 1) setCur(c => c + 1);
    else setFinished(true);
  };

  // ─── Finished screen ──────────────────────────────────────────────────────
  if (finished) {
    const resetQuiz = () => {
      setCur(0); setScore(0); setFinished(false);
      setResults([]); setHasCalled(false);
    };

    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-4">

        {/* ── Puntuación ── */}
        <div className="text-center space-y-2.5">
          <div className="text-5xl">{passed ? '🎉' : '📚'}</div>
          <p className="font-bold text-xl">{passed ? '¡Quiz superado!' : 'Sigue practicando'}</p>
          <p className="text-sm text-muted-foreground">
            Respondiste correctamente <strong>{score}</strong> de <strong>{total}</strong> ({pct}%)
          </p>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={cn('h-3 rounded-full transition-all', passed ? 'bg-green-500' : 'bg-orange-400')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Resultados por pregunta ── */}
        {results.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              📋 Resultados
            </p>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl px-3 py-2.5 flex items-start gap-2.5 border text-sm',
                    r.correct
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
                  )}
                >
                  {r.correct
                    ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    : <XCircle    className="w-4 h-4 text-red-500  dark:text-red-400  shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium leading-snug',
                      r.correct ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300',
                    )}>
                      {i + 1}. {r.questionText}
                    </p>
                    {!r.correct && r.correctAnswer && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        Respuesta correcta: <strong>{r.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Acciones ── */}
        {passed ? (
          <div className="space-y-2">
            {/* Reintentar disponible cuando no es 100% y no se llamó aún onPassed */}
            {pct < 100 && !hasCalled && (
              <Button variant="outline" className="w-full rounded-xl gap-2" onClick={resetQuiz}>
                <RefreshCw className="w-4 h-4" /> Intentar de nuevo
              </Button>
            )}
            <Button
              className="w-full rounded-xl font-bold gap-2 bg-green-600 hover:bg-green-700"
              disabled={hasCalled}
              onClick={() => {
                if (!hasCalled) {
                  setHasCalled(true);
                  // Sin await: la navegación es optimista e inmediata dentro de markCompleted.
                  // El guardado en Supabase ocurre en segundo plano.
                  onPassed();
                }
              }}
            >
              <CheckCircle className="w-4 h-4" /> Continuar →
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              Necesitas al menos <strong>60%</strong> para avanzar. ¡Revisa el material y vuelve a intentarlo!
            </div>
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={resetQuiz}>
              <RefreshCw className="w-4 h-4" /> Intentar de nuevo
            </Button>
          </div>
        )}

      </div>
    );
  }

  if (!q) return null;

  const opts = q.options || [];
  const singleChoiceTypes = ['multiple_choice','true_false','listen_select','image_choice','image_url'];
  const writeTypes = ['fill_gap','image_write','listen_write','rewrite','organize'];

  // For display: correct answer text
  const correctDisplay = (() => {
    if (writeTypes.includes(q.type)) {
      // listen_write: si no hay correctAnswer, la respuesta correcta es q.question
      if (q.type === 'listen_write' && !q.correctAnswer) return q.question || '';
      return q.correctAnswer || '';
    }
    if (singleChoiceTypes.includes(q.type)) return opts.filter(o => o.isCorrect).map(o => o.text).join(', ');
    if (q.type === 'multiple_select') return opts.filter(o => o.isCorrect).map(o => o.text).join(', ');
    return '';
  })();

  // Can submit?
  const canSubmit = (() => {
    if (singleChoiceTypes.includes(q.type)) return selected !== null;
    if (q.type === 'multiple_select') return Array.isArray(selected) && selected.length > 0;
    if (writeTypes.includes(q.type)) return textAnswer.trim().length > 0;
    if (q.type === 'match') return opts.every(o => matchMap[o.text]);
    if (q.type === 'image_match') return (q.imagePairs || []).every(p => imgMatchMap[p.imageUrl]);
    if (q.type === 'story_order') return storyOrder.length === (q.storyItems || []).length;
    if (q.type === 'word_sort' || q.type === 'classify') return wordItems.every(w => wordPlacements[w]);
    return false;
  })();

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-primary">📝 Pregunta {cur + 1} de {total}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{score} correctas</span>
          <div className="w-20 bg-muted rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${(cur / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Image for image-based types */}
        {(q.type === 'image_url' || q.type === 'image_choice' || q.type === 'image_write') && q.imageUrl && (
          <img
            src={q.imageUrl}
            alt="Quiz"
            onClick={() => setLightboxUrl(q.imageUrl)}
            className="w-full max-h-52 object-contain rounded-xl border border-border bg-muted/20 cursor-zoom-in"
          />
        )}

        {/* Audio player para preguntas de escucha */}
        {(q.type === 'listen_select' || q.type === 'listen_write') && q.question && (
          <ListenButton key={q.id ?? cur} text={q.question} />
        )}

        {/* Question text — para tipos "listening" q.question ES la palabra a escuchar
            (= la respuesta correcta), así que se oculta completamente.
            El encabezado de ListenButton ya da la instrucción; el feedback
            revela la respuesta correcta después de verificar. */}
        {q.type !== 'listen_write' && q.type !== 'listen_select' && (
          <div className="font-semibold text-sm leading-relaxed">
            <RichContent html={q.question || ''} />
          </div>
        )}

        {/* ── Answer areas ── */}
        {!submitted ? (
          <>
            {/* Single choice */}
            {singleChoiceTypes.includes(q.type) && opts.length > 0 && (
              <div className="space-y-2">
                {opts.map((opt, i) => (
                  <button key={i} onClick={() => setSelected(opt.text)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                      selected === opt.text
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                    )}>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple select */}
            {q.type === 'multiple_select' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground italic">Selecciona todas las correctas</p>
                {opts.map((opt, i) => {
                  const sel = Array.isArray(selected) ? selected : [];
                  const isSel = sel.includes(opt.text);
                  return (
                    <button key={i}
                      onClick={() => {
                        const cur = Array.isArray(selected) ? [...selected] : [];
                        setSelected(isSel ? cur.filter(s => s !== opt.text) : [...cur, opt.text]);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3',
                        isSel ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/30 hover:border-primary/50'
                      )}>
                      <span className={cn('w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center',
                        isSel ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )}>
                        {isSel && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Write / fill gap */}
            {writeTypes.includes(q.type) && (
              <input
                type="text"
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                placeholder={q.type === 'organize' ? 'Escribe las palabras en orden correcto...' : 'Escribe tu respuesta...'}
                className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none bg-background"
              />
            )}

            {/* Match */}
            {q.type === 'match' && opts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground italic">Toca un elemento de la izquierda, luego uno de la derecha</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    {opts.map(opt => (
                      <button key={opt.text}
                        onClick={() => setMatchLeft(matchLeft === opt.text ? null : opt.text)}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-center transition-all',
                          matchMap[opt.text] ? 'border-green-400 bg-green-50 text-green-800' :
                          matchLeft === opt.text ? 'border-primary bg-primary/10 text-primary' :
                          'border-border bg-muted/30 hover:border-primary/40'
                        )}>
                        {opt.text}
                        {matchMap[opt.text] && <span className="block text-[10px] text-green-600">→ {matchMap[opt.text]}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {matchRightShuffled.map(right => (
                      <button key={right}
                        onClick={() => {
                          if (!matchLeft) return;
                          setMatchMap(prev => ({ ...prev, [matchLeft]: right }));
                          setMatchLeft(null);
                        }}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-center transition-all',
                          Object.values(matchMap).includes(right) ? 'border-green-400 bg-green-50 text-green-800' :
                          matchLeft ? 'border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary cursor-pointer' :
                          'border-border bg-muted/30 cursor-not-allowed opacity-60'
                        )}>
                        {right}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Reset match */}
                {Object.keys(matchMap).length > 0 && (
                  <button onClick={() => { setMatchMap({}); setMatchLeft(null); }}
                    className="text-xs text-muted-foreground underline">Reiniciar</button>
                )}
              </div>
            )}

            {/* Image match: images on left, words on right */}
            {q.type === 'image_match' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground italic">Toca una imagen, luego la palabra que le corresponde</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Images */}
                    <div className="space-y-2">
                      {(q.imagePairs || []).map(p => (
                        <button key={p.imageUrl}
                          onClick={() => setSelImg(selImg === p.imageUrl ? null : p.imageUrl)}
                          className={cn(
                            'w-full rounded-xl border-2 overflow-hidden transition-all',
                            imgMatchMap[p.imageUrl] ? 'border-green-400' :
                            selImg === p.imageUrl ? 'border-primary' : 'border-border hover:border-primary/40'
                          )}>
                          <img src={p.imageUrl} alt="" className="w-full h-16 object-cover" />
                          {imgMatchMap[p.imageUrl] && (
                            <p className="text-[10px] text-green-700 bg-green-50 py-0.5 font-bold">{imgMatchMap[p.imageUrl]}</p>
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Words */}
                    <div className="space-y-2">
                      {imgMatchShuffledWords.map(word => (
                        <button key={word}
                          onClick={() => {
                            if (!selImg) return;
                            setImgMatchMap(prev => ({ ...prev, [selImg]: word }));
                            setSelImg(null);
                          }}
                          className={cn(
                            'w-full px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-center transition-all',
                            Object.values(imgMatchMap).includes(word) ? 'border-green-400 bg-green-50 text-green-800' :
                            selImg ? 'border-primary/40 hover:border-primary hover:bg-primary/10 cursor-pointer' :
                            'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                          )}>
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                  {Object.keys(imgMatchMap).length > 0 && (
                    <button onClick={() => { setImgMatchMap({}); setSelImg(null); }}
                      className="text-xs text-muted-foreground underline">Reiniciar</button>
                  )}
                </div>
              </div>
            )}

            {/* Story order */}
            {q.type === 'story_order' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground italic">Usa ▲▼ para ordenar cronológicamente</p>
                {storyOrder.map((item, idx) => (
                  <div key={item + idx}
                    className="flex items-start gap-2 p-2.5 rounded-xl border border-border bg-muted/20">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center mt-0.5">{idx + 1}</span>
                    <span className="flex-1 text-sm leading-snug">{item}</span>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button disabled={idx === 0}
                        onClick={() => {
                          const arr = [...storyOrder];
                          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                          setStoryOrder(arr);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary disabled:opacity-30 px-1 leading-none">▲</button>
                      <button disabled={idx === storyOrder.length - 1}
                        onClick={() => {
                          const arr = [...storyOrder];
                          [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                          setStoryOrder(arr);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary disabled:opacity-30 px-1 leading-none">▼</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Word sort / Classify */}
            {(q.type === 'word_sort' || q.type === 'classify') && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground italic">Toca una palabra y luego la categoría donde pertenece</p>
                {/* Unplaced pool */}
                <div className="flex flex-wrap gap-2 min-h-[44px] p-2.5 rounded-xl border-2 border-dashed border-border bg-muted/20">
                  {wordItems.filter(w => !wordPlacements[w]).map(w => (
                    <button key={w}
                      onClick={() => setWordSelected(wordSelected === w ? null : w)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all',
                        wordSelected === w
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary/60'
                      )}>
                      {w}
                    </button>
                  ))}
                </div>
                {/* Category buckets */}
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat}
                      onClick={() => {
                        if (!wordSelected) return;
                        setWordPlacements(prev => ({ ...prev, [wordSelected]: cat }));
                        setWordSelected(null);
                      }}
                      className={cn(
                        'rounded-xl border-2 p-3 transition-all',
                        wordSelected ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer' : 'border-border bg-muted/20'
                      )}>
                      <p className="text-xs font-bold text-primary mb-2">{cat}</p>
                      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                        {wordItems.filter(w => wordPlacements[w] === cat).map(w => (
                          <button key={w}
                            onClick={e => {
                              e.stopPropagation();
                              setWordPlacements(prev => {
                                const next = { ...prev }; delete next[w]; return next;
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-colors">
                            {w} ✕
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <Button className="w-full rounded-xl font-bold" onClick={handleSubmit} disabled={!canSubmit}>
              Verificar respuesta
            </Button>
          </>
        ) : (
          /* ── Feedback ── */
          <div className="space-y-3">
            <div className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2',
              isCorrect ? 'border-green-400 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'
            )}>
              {isCorrect
                ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{isCorrect ? '¡Correcto! 🎉' : 'Incorrecto'}</p>
                {!isCorrect && correctDisplay && (
                  <p className="text-xs mt-1">
                    Respuesta correcta: <strong>{correctDisplay}</strong>
                  </p>
                )}
                {q.explanation && (
                  <p className="text-xs mt-1 opacity-80 italic">{q.explanation}</p>
                )}
              </div>
            </div>
            <Button className="w-full rounded-xl font-bold" onClick={handleNext}>
              {cur < total - 1 ? 'Siguiente pregunta →' : 'Ver resultado'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Lightbox modal ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Imagen ampliada"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

// ─── Botón copiar al portapapeles ────────────────────────────────────────────
function CopyPromptButton({ html }: { html: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const plain = html ? htmlToText(html).replace(/\n{3,}/g, '\n\n').trim() : '';
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      const ta = document.createElement('textarea');
      ta.value = plain;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shrink-0',
        copied
          ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
          : 'bg-muted/60 border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary',
      )}
    >
      {copied
        ? <><Check className="w-3 h-3" /> ¡Copiado!</>
        : <><Copy className="w-3 h-3" /> Copiar</>
      }
    </button>
  );
}

// ─── Detect subtype for text materials ───────────────────────────────────────
function detectSubtype(mat) {
  const title = (mat.title || '').toLowerCase();
  const stage = (mat.stage || '').toLowerCase();
  // Vocabulary: by title keywords OR by stage name
  if (
    title.includes('vocabulario') ||
    title.includes('escucha y repite') ||
    title.includes('vocab') ||
    title.includes('flashcard') ||
    stage === 'vocabulary'
  ) return 'vocab';
  // Reading: by title keywords OR by stage name
  if (
    title.includes('reading') ||
    title.includes('lee ') ||
    title.includes('lectura') ||
    title.includes('texto') ||
    stage === 'reading'
  ) return 'reading';
  return 'generic';
}

// ─── Material renderer ────────────────────────────────────────────────────────
function MaterialItem({ mat, stage }: { mat: any; stage?: string }) {
  const [playing, setPlaying] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const subtype = detectSubtype(mat);
  const isPracticePrompt = stage === 'ai_practice' && mat.material_type === 'text' && !!mat.description && mat.plan_type !== 'trimestral';
  const isSpeakologyMsg  = stage === 'ai_practice' && mat.plan_type === 'trimestral';

  // ── Speakology message: special full-width card ──
  if (isSpeakologyMsg) {
    const plainText = mat.description
      ? mat.description.replace(/<[^>]*>/g, '').trim()
      : '';
    return (
      <div className="rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-violet-100/60 dark:bg-violet-900/30 border-b border-violet-200 dark:border-violet-700">
          <span className="text-xl">🤖</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-violet-800 dark:text-violet-200">Práctica con Speakology</p>
            <p className="text-xs text-violet-600 dark:text-violet-400">Plan Trimestral</p>
          </div>
          <span className="text-[10px] font-bold bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-2 py-0.5 rounded-full">💎 Trimestral</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 leading-relaxed">
            {plainText || mat.description}
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400">
            Ingresa a <strong>Speakology</strong> y sigue las instrucciones para practicar con IA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/50">
        <span className="text-base">{MATERIAL_TYPE_CONFIG[mat.material_type]?.emoji || '📄'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{mat.title}</p>
        </div>
        {isPracticePrompt
          ? <CopyPromptButton html={mat.description} />
          : <Badge variant="outline" className="text-[10px] shrink-0">
              {MATERIAL_TYPE_CONFIG[mat.material_type]?.label || mat.material_type}
            </Badge>
        }
      </div>

      <div className="p-3">
        {mat.material_type === 'audio' && mat.file_url && (
          <audio src={mat.file_url} controls className="w-full" />
        )}
        {mat.material_type === 'video' && mat.file_url && (
          <video src={mat.file_url} controls className="w-full rounded-lg max-h-64 bg-black" />
        )}
        {mat.material_type === 'image' && mat.file_url && (
          <>
            {getGoogleDriveId(mat.file_url) ? (
              <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={`https://drive.google.com/thumbnail?id=${getGoogleDriveId(mat.file_url)}&sz=w1200`}
                  alt={mat.title}
                  className="w-full rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
                <p className="text-[11px] text-muted-foreground text-center mt-1">🔗 Toca para abrir en Google Drive</p>
              </a>
            ) : (
              <>
                <img
                  src={mat.file_url}
                  alt={mat.title}
                  onClick={() => setLightboxUrl(mat.file_url)}
                  className="w-full rounded-lg max-h-64 object-contain cursor-zoom-in"
                />
                {lightboxUrl && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightboxUrl(null)}
                  >
                    <button
                      onClick={() => setLightboxUrl(null)}
                      className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold"
                    >
                      ✕
                    </button>
                    <img
                      src={lightboxUrl}
                      alt="Imagen ampliada"
                      onClick={e => e.stopPropagation()}
                      className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── PDF ── */}
        {mat.material_type === 'pdf' && (
          <div className="space-y-2">
            {mat.file_url ? (
              (() => {
                const driveId = getGoogleDriveId(mat.file_url);
                if (driveId) {
                  return (
                    <>
                      <iframe
                        src={`https://drive.google.com/file/d/${driveId}/preview`}
                        className="w-full rounded-lg border border-border bg-muted/10"
                        style={{ height: '480px', minHeight: '320px' }}
                        title={mat.title}
                        allow="fullscreen"
                      />
                      <Button variant="outline" size="sm" className="w-full gap-2"
                        onClick={() => window.open(mat.file_url, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5" /> Abrir en Google Drive
                      </Button>
                    </>
                  );
                }
                return (
                  <>
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(mat.file_url)}&embedded=true`}
                      className="w-full rounded-lg border border-border bg-muted/10"
                      style={{ height: '480px', minHeight: '320px' }}
                      title={mat.title}
                      allow="fullscreen"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2"
                        onClick={() => window.open(
                          `https://docs.google.com/viewer?url=${encodeURIComponent(mat.file_url)}`,
                          '_blank'
                        )}>
                        <ExternalLink className="h-3.5 w-3.5" /> Ver en pantalla completa
                      </Button>
                      <Button variant="default" size="sm" className="flex-1 gap-2"
                        onClick={() => window.open(mat.file_url, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5" /> Descargar PDF
                      </Button>
                    </div>
                  </>
                );
              })()
            ) : mat.description ? (
              <div className="p-4 rounded-xl bg-muted/20 border border-border max-h-96 overflow-y-auto">
                <RichContent html={mat.description} />
              </div>
            ) : null}
          </div>
        )}

        {/* ── Word / PPT ── */}
        {(mat.material_type === 'word' || mat.material_type === 'ppt') && mat.file_url && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
            <span className="text-3xl">{mat.material_type === 'ppt' ? '📊' : '📝'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{mat.file_name || mat.title}</p>
            </div>
            <Button variant="default" size="sm" className="gap-1.5 shrink-0"
              onClick={() => window.open(mat.file_url, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" /> Descargar
            </Button>
          </div>
        )}

        {/* ── URL / YouTube ── */}
        {mat.material_type === 'url' && mat.external_url && (() => {
          const ytThumb = getYouTubeThumbnail(mat.external_url);
          const embedSrc = getEmbedUrl(mat.external_url);
          if (ytThumb) return (
            <div className="rounded-xl overflow-hidden border border-border bg-black">
              {!playing ? (
                <div className="relative cursor-pointer group" onClick={() => setPlaying(true)}>
                  <img src={ytThumb} alt="YouTube" className="w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl">
                      <Film className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
              ) : embedSrc ? (
                <iframe src={embedSrc} className="w-full aspect-video" allowFullScreen />
              ) : null}
            </div>
          );
          return (
            <a href={mat.external_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-primary underline truncate flex-1">{mat.external_url}</p>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          );
        })()}

        {/* ── Text: smart by subtype ── */}
        {mat.material_type === 'text' && mat.description && (
          subtype === 'vocab' ? (
            <VocabularyMaterial html={mat.description} />
          ) : subtype === 'reading' ? (
            <ReadingMaterial html={mat.description} />
          ) : (
            <div className="p-4 rounded-xl bg-muted/20 border border-border leading-relaxed">
              <RichContent html={mat.description} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Stepper dot ──────────────────────────────────────────────────────────────
function StepDot({ idx, currentIdx, completed, label }) {
  const isActive = idx === currentIdx;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
        completed ? 'bg-green-500 border-green-500 text-white' :
        isActive ? 'bg-primary border-primary text-primary-foreground' :
        'bg-background border-border text-muted-foreground'
      )}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
      </div>
      <span className={cn('text-[9px] font-medium text-center w-12 leading-tight',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}>{label}</span>
    </div>
  );
}

// ─── Caché de contenido por unidad con TTL de 3 minutos ──────────────────────
// Evita re-pedir a Supabase si el estudiante abre la misma unidad varias veces
// en poco tiempo, pero expira para reflejar cambios del admin.
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos
const _unitContentCache: Record<string, {
  byStage: Record<string, any[]>;
  quizByStage: Record<string, any[]>;
  ts: number;
}> = {};

// ─── Main UnitViewer ──────────────────────────────────────────────────────────
export function UnitViewer({ unitId, unitTitle, unitDescription, studentId, onClose, isLocked, isReview = false, studentPlanSlug = '' }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [byStage, setByStage] = useState(() =>
    Object.fromEntries(STAGES.map(s => [s.id, []])));
  const [quizByStage, setQuizByStage] = useState({});
  const [progress, setProgress] = useState({});
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [markingDone, setMarkingDone] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  // Modo repaso: stages "pasados" en esta sesión (no se guardan en Supabase)
  const [reviewPassedSet, setReviewPassedSet] = useState<Set<string>>(new Set());
  // Activado cuando el estudiante elige repasar desde la pantalla de unidad completa
  const [isReviewing, setIsReviewing] = useState(isReview);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setShowQuiz(false);

    try {
      // ── Paso 1: contenido estático (materials + quizzes) desde caché o Supabase ──
      // Se ejecuta en paralelo con la consulta de progreso (que siempre va a Supabase).
      const getContent = async () => {
        // Usar caché si existe y no ha expirado (TTL = 3 min)
        const cached = _unitContentCache[unitId];
        if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached;

        const [matsResult, quizResult] = await Promise.all([
          supabase
            .from('unit_stage_materials').select('*')
            .eq('unit_id', unitId).order('sort_order', { ascending: true }),
          supabase
            .from('unit_stage_quizzes').select('stage, questions')
            .eq('unit_id', unitId),
        ]);

        const byStageData: Record<string, any[]> = Object.fromEntries(STAGES.map(s => [s.id, []]));
        (matsResult.data || []).forEach(m => { if (m.stage in byStageData) byStageData[m.stage].push(m); });

        const quizData: Record<string, any[]> = {};
        (quizResult.data || []).forEach(row => {
          const qs = Array.isArray(row.questions) ? row.questions : [];
          if (qs.length > 0) quizData[row.stage] = qs;
        });

        _unitContentCache[unitId] = { byStage: byStageData, quizByStage: quizData, ts: Date.now() };
        return _unitContentCache[unitId];
      };

      // ── Paso 2: contenido (timeout de seguridad: 10 s) ──
      const timeoutFallback = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout (>10 s) cargando la unidad')), 10000),
      );
      const content = await Promise.race([getContent(), timeoutFallback]);

      const { byStage: map, quizByStage: qmap } = content;
      setByStage(map);
      setQuizByStage(qmap);

      if (!isLocked) {
        // El progreso ya no depende de Supabase: se lee directo de localStorage
        // (instantáneo, no requiere red ni puede "quedarse cargando").
        let pm: Record<string, any> = getUnitProgress(studentId, unitId);

        // Respaldo: si no hay nada local para esta unidad y aún no se migró el
        // historial completo (ver Dashboard), traer solo esta unidad desde Supabase
        // para no mostrarla como "no iniciada" si en realidad ya estaba completada.
        if (Object.keys(pm).length === 0 && !hasMigrated(studentId)) {
          try {
            const { data: remoteRows } = await Promise.race([
              supabase.from('unit_progress')
                .select('unit_id, stage, completed, completed_at, quiz_passed')
                .eq('unit_id', unitId).eq('student_id', studentId),
              new Promise<{ data: null }>(resolve => setTimeout(() => resolve({ data: null }), 5000)),
            ]);
            if (remoteRows) {
              mergeFromRemote(studentId, remoteRows as any);
              pm = getUnitProgress(studentId, unitId);
            }
          } catch (e) {
            console.error('[UnitViewer] ⚠️ No se pudo respaldar el progreso histórico desde Supabase:', e);
          }
        }
        setProgress(pm);

        const stagesWC = STAGES.filter(s => map[s.id]?.length > 0 || qmap[s.id]);
        if (isReview) {
          // En repaso: siempre empezar desde la primera parte
          const globalIdx = STAGES.findIndex(s => s.id === stagesWC[0]?.id);
          setCurrentStageIdx(globalIdx >= 0 ? globalIdx : 0);
        } else {
          const firstInc = stagesWC.findIndex(s => !pm[s.id]?.completed);
          const startStage = stagesWC[firstInc >= 0 ? firstInc : Math.max(0, stagesWC.length - 1)];
          const globalIdx = STAGES.findIndex(s => s.id === (startStage?.id || STAGES[0].id));
          setCurrentStageIdx(globalIdx >= 0 ? globalIdx : 0);
        }
      }
    } catch (e) {
      // Bug 2 fix: sin este catch, cualquier error de red dejaba el spinner girando para siempre
      console.error('[UnitViewer] ❌ Excepción cargando unidad:', e);
      setLoadError(true);
    } finally {
      // Bug 2 fix: setLoading(false) ahora se ejecuta SIEMPRE, incluso si hay error
      setLoading(false);
    }
  }, [unitId, studentId, isLocked]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtrar materiales de ai_practice según plan del estudiante ──
  const filterForPlan = (mats: any[], stageId: string) => {
    if (stageId !== 'ai_practice' || !mats?.length) return mats || [];
    const isTrimestral = studentPlanSlug === 'trimestral';
    return mats.filter(m => {
      const pt = m.plan_type ?? 'mensual';
      return isTrimestral ? pt === 'trimestral' : pt === 'mensual';
    });
  };

  const stagesWithContent = STAGES.filter(s => {
    const filtered = filterForPlan(byStage[s.id] || [], s.id);
    return filtered.length > 0 || quizByStage[s.id]?.length > 0;
  });
  const currentStage = STAGES[currentStageIdx];
  const currentMaterials = currentStage ? filterForPlan(byStage[currentStage.id] || [], currentStage.id) : [];
  const currentQuiz = currentStage ? (quizByStage[currentStage.id] || []) : [];
  const hasQuiz = currentQuiz.length > 0;
  const currentCompleted = currentStage ? !!progress[currentStage.id]?.completed : false;
  const completedCount = stagesWithContent.filter(s => progress[s.id]?.completed).length;
  const progressPct = stagesWithContent.length > 0 ? Math.round((completedCount / stagesWithContent.length) * 100) : 0;
  const allDone = stagesWithContent.length > 0 && completedCount === stagesWithContent.length;
  const localIdx = stagesWithContent.findIndex(s => s.id === currentStage?.id);

  const goPrev = () => {
    if (localIdx > 0) { setCurrentStageIdx(STAGES.findIndex(s => s.id === stagesWithContent[localIdx - 1].id)); setShowQuiz(false); }
  };
  const goNext = () => {
    if (localIdx < stagesWithContent.length - 1) { setCurrentStageIdx(STAGES.findIndex(s => s.id === stagesWithContent[localIdx + 1].id)); setShowQuiz(false); }
  };

  const markCompleted = async () => {
    if (!currentStage || markingDone) return;
    setSaveErrorMsg('');

    // Bug 1 fix: capturar studentId y unitId al inicio.
    let sid = studentId;
    const uid = unitId;
    const stageId = currentStage.id;

    // Respaldo: si el prop studentId todavía no llegó (carrera con la sesión cargando
    // en Dashboard), intentar obtenerlo directo de Supabase antes de fallar en silencio.
    if (!sid) {
      try {
        const { data } = await supabase.auth.getSession();
        sid = data?.session?.user?.id || '';
      } catch {
        sid = '';
      }
    }

    if (!sid || !uid) {
      console.error('[UnitViewer] ❌ markCompleted: studentId o unitId no disponible — progreso no guardado', { sid, uid });
      setSaveErrorMsg('No se pudo identificar tu sesión. Por favor recarga la página (Ctrl+F5) e intenta de nuevo.');
      return;
    }

    setMarkingDone(true);

    const now = new Date().toISOString();
    const stageData = { completed: true, completed_at: now, quiz_passed: hasQuiz };

    // 1. Guardar de inmediato en localStorage — es la fuente de verdad real,
    // síncrona y nunca depende de la red. Actualiza la UI con el resultado.
    const updated = setStageCompleted(sid, uid, stageId, stageData);
    setProgress(updated);
    setShowQuiz(false);

    // 2. Capturar el índice de navegación ANTES de que el re-render lo cambie
    const nextLocalIdx = localIdx + 1;
    const nextStage = stagesWithContent[nextLocalIdx];

    // 3. Navegar a la siguiente parte si existe
    if (nextStage) {
      setTimeout(() => {
        setCurrentStageIdx(STAGES.findIndex(s => s.id === nextStage.id));
      }, 400);
    }

    // Pequeño debounce de UI para evitar doble clic — ya no depende de ninguna red.
    setTimeout(() => setMarkingDone(false), 300);

    // 4. Intento de guardado en Supabase en segundo plano, solo para reportes del
    // panel admin. Es best-effort: si falla o tarda, no afecta al estudiante en nada.
    try {
      const { error } = await supabase.from('unit_progress').upsert(
        {
          student_id: sid,
          unit_id: uid,
          stage: stageId,
          completed: true,
          completed_at: now,
          quiz_passed: hasQuiz,
          updated_at: now,
        },
        { onConflict: 'student_id,unit_id,stage' },
      );
      if (error) {
        console.error('[UnitViewer] ⚠️ No se pudo respaldar el progreso en Supabase (no afecta al estudiante):', error.message, { sid, uid, stageId });
      } else {
        console.log('[UnitViewer] ✅ Progreso respaldado en Supabase:', stageId);
      }
    } catch (e) {
      console.error('[UnitViewer] ⚠️ Excepción respaldando progreso en Supabase (no afecta al estudiante):', e);
    }
  };

  // ── Completar en modo repaso: solo avanza de stage, NO guarda en Supabase ──
  const markReviewCompleted = () => {
    if (!currentStage) return;
    setReviewPassedSet(prev => new Set([...prev, currentStage.id]));
    setShowQuiz(false);
    if (localIdx < stagesWithContent.length - 1) {
      setTimeout(() => {
        setCurrentStageIdx(STAGES.findIndex(s => s.id === stagesWithContent[localIdx + 1].id));
      }, 400);
    }
  };

  if (isLocked) return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="border-b border-border bg-card shrink-0 px-4 py-3 flex items-center gap-3">
        <div className="flex-1"><h1 className="text-base font-bold truncate">{unitTitle}</h1></div>
        <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg">Contenido bloqueado</p>
        <p className="text-sm text-muted-foreground">Suscríbete al plan mensual para acceder a esta unidad</p>
        <Button onClick={onClose}>Ver planes</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0 px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-base font-bold truncate">{unitTitle}</h1>
              {isReviewing && (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  🔁 Repaso
                </span>
              )}
            </div>
            {unitDescription && <p className="text-xs text-muted-foreground truncate mt-0.5 ml-6">{unitDescription}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        {!loading && stagesWithContent.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{completedCount} de {stagesWithContent.length} partes completadas</span>
              <span className="font-bold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}
        {saveErrorMsg && (
          <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 text-xs font-semibold rounded-xl px-3 py-2">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {saveErrorMsg}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : loadError && stagesWithContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No se pudo cargar el contenido</p>
            <p className="text-sm text-muted-foreground">Revisa tu conexión a internet e intenta de nuevo</p>
            <Button variant="outline" className="rounded-xl gap-2 mt-2" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4" /> Intentar de nuevo
            </Button>
          </div>
        ) : stagesWithContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Esta unidad aún no tiene materiales</p>
            <p className="text-sm text-muted-foreground">El instructor está preparando el contenido</p>
          </div>
        ) : allDone && !isReviewing ? (
          /* ── Pantalla "Unidad completada" ── */
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <p className="font-extrabold text-2xl text-green-700">¡Unidad completada! 🎉</p>
              <p className="text-muted-foreground text-sm mt-2">
                Has terminado todas las partes de <strong>{unitTitle}</strong>.<br />
                Puedes repasar cualquier parte cuando quieras.
              </p>
            </div>
            <Button
              className="rounded-xl gap-2 font-bold bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                // Solo vuelve a mostrar el contenido desde el inicio — NO borra el progreso
                // guardado, la unidad sigue apareciendo como completada en el menú.
                const firstStage = stagesWithContent[0];
                setCurrentStageIdx(STAGES.findIndex(x => x.id === firstStage?.id));
                setShowQuiz(false);
                setIsReviewing(true);
              }}
            >
              <RefreshCw className="w-4 h-4" /> Empezar de nuevo
            </Button>
            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Repasar parte</p>
              {stagesWithContent.map(s => (
                <button key={s.id}
                  onClick={() => {
                    setCurrentStageIdx(STAGES.findIndex(x => x.id === s.id));
                    setShowQuiz(false);
                    setIsReviewing(true); // activa modo repaso → oculta esta pantalla
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">{s.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
            <Button variant="outline" className="rounded-xl gap-2" onClick={onClose}>Volver al curso</Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

            {/* Stepper */}
            <div className="flex items-center justify-center gap-1 overflow-x-auto py-2">
              {stagesWithContent.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <button onClick={() => {
                    const canGo = i <= localIdx || progress[s.id]?.completed;
                    if (canGo) { setCurrentStageIdx(STAGES.findIndex(x => x.id === s.id)); setShowQuiz(false); }
                  }} className="focus:outline-none">
                    <StepDot idx={i} currentIdx={localIdx} completed={!!progress[s.id]?.completed} label={s.partLabel} />
                  </button>
                  {i < stagesWithContent.length - 1 && (
                    <div className={cn('w-6 h-0.5 mx-0.5 mb-4 transition-colors',
                      progress[s.id]?.completed ? 'bg-green-400' : 'bg-border')} />
                  )}
                </div>
              ))}
            </div>

            {/* Stage header */}
            {currentStage && (
              <div className={cn('rounded-2xl border-2 p-4', currentStage.bg)}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentStage.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('font-extrabold text-base', currentStage.color)}>{currentStage.label}</p>
                      {currentCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Completada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{currentStage.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{localIdx + 1}/{stagesWithContent.length}</Badge>
                </div>
              </div>
            )}

            {/* Materials */}
            {currentMaterials.length > 0 && (
              <div className="space-y-3">
                {currentMaterials.map(mat => <MaterialItem key={mat.id} mat={mat} stage={currentStage?.id} />)}
              </div>
            )}

            {/* Quiz block */}
            {hasQuiz && (
              // Normal: solo si no está completada | Repaso: siempre mostrar
              isReviewing
                ? (!reviewPassedSet.has(currentStage?.id)
                    ? (!showQuiz ? (
                        <div className="rounded-2xl border-2 border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 p-5 text-center space-y-3">
                          <div className="text-4xl">🔁</div>
                          <p className="font-bold text-base">Quiz de repaso</p>
                          <p className="text-sm text-muted-foreground">
                            Vuelve a responder {currentQuiz.length} {currentQuiz.length === 1 ? 'pregunta' : 'preguntas'}. Tu progreso no cambiará.
                          </p>
                          <Button className="w-full rounded-xl font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setShowQuiz(true)}>
                            Intentar de nuevo →
                          </Button>
                        </div>
                      ) : (
                        <InlineQuiz questions={currentQuiz} onPassed={markReviewCompleted} />
                      )
                    ) : null /* ya pasado en este repaso */
                  )
                : (!currentCompleted && (
                    !showQuiz ? (
                      <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 text-center space-y-3">
                        <div className="text-4xl">📝</div>
                        <p className="font-bold text-base">Quiz de esta parte</p>
                        <p className="text-sm text-muted-foreground">
                          Responde {currentQuiz.length} {currentQuiz.length === 1 ? 'pregunta' : 'preguntas'} para avanzar.
                        </p>
                        <Button className="w-full rounded-xl font-bold gap-2" onClick={() => setShowQuiz(true)}>
                          Comenzar quiz →
                        </Button>
                      </div>
                    ) : (
                      <InlineQuiz questions={currentQuiz} onPassed={markCompleted} />
                    )
                  ))
            )}

            {/* Action bar */}
            {isReviewing ? (
              /* ── Barra en modo repaso ── */
              <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="gap-2 rounded-xl border-amber-300" onClick={goPrev} disabled={localIdx === 0}>
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </Button>
                  {localIdx < stagesWithContent.length - 1 ? (
                    <Button className="flex-1 rounded-xl gap-2 font-bold bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => { markReviewCompleted(); }}>
                      Siguiente parte <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button className="flex-1 rounded-xl gap-2 font-bold" variant="outline"
                      onClick={onClose}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Terminar repaso
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ── Barra normal ── */
              (!hasQuiz || currentCompleted) && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  {!currentCompleted ? (
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="flex-1 rounded-xl gap-2"
                        onClick={markCompleted} disabled={markingDone}>
                        {markingDone ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {markingDone ? 'Guardando...' : 'Marcar como completada'}
                      </Button>
                      {localIdx < stagesWithContent.length - 1 && (
                        <Button className="flex-1 rounded-xl gap-2 font-bold"
                          onClick={markCompleted} disabled={markingDone}>
                          Siguiente <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="gap-2 rounded-xl" onClick={goPrev} disabled={localIdx === 0}>
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </Button>
                      {localIdx < stagesWithContent.length - 1 ? (
                        <Button className="flex-1 rounded-xl gap-2 font-bold" onClick={goNext}>
                          Siguiente parte <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
                          <Trophy className="w-4 h-4" /> Unidad completa
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Part list */}
            {stagesWithContent.length > 1 && (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Partes de la unidad</p>
                <div className="space-y-1">
                  {stagesWithContent.map((s, i) => {
                    const isCur = s.id === currentStage?.id;
                    const isDone = !!progress[s.id]?.completed;
                    const canClick = i <= localIdx || isDone;
                    const hasQ = !!quizByStage[s.id]?.length;
                    return (
                      <button key={s.id} disabled={!canClick}
                        onClick={() => { if (canClick) { setCurrentStageIdx(STAGES.findIndex(x => x.id === s.id)); setShowQuiz(false); } }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors text-sm',
                          isCur ? 'bg-primary/10 border border-primary/30 font-semibold' :
                          isDone ? 'hover:bg-green-50 text-muted-foreground' :
                          canClick ? 'hover:bg-muted/50 text-muted-foreground' :
                          'opacity-40 cursor-not-allowed text-muted-foreground'
                        )}>
                        <span className="text-base shrink-0">{s.emoji}</span>
                        <span className="flex-1 truncate">{s.label}</span>
                        {hasQ && !isDone && <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">Quiz</span>}
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> :
                         isCur ? <Badge variant="default" className="text-[9px] px-1.5 py-0.5 shrink-0">Actual</Badge> :
                         canClick ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> :
                         <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnitViewer;
