// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Volume2, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';

// ─── Reading passage (shown for Q17–Q20) ─────────────────────────────────────
const READING_PASSAGE =
  'Remote work has become increasingly popular in recent years. Many companies now allow their employees to work from home, which has both advantages and disadvantages. On one hand, workers save time and money on commuting and often report higher levels of job satisfaction. On the other hand, some people find it difficult to maintain a work-life balance and feel isolated from their colleagues.';

// ─── 30 placement questions ───────────────────────────────────────────────────
const QUESTIONS = [
  // ── Vocabulario A1 ──────────────────────────────────────────────────────
  {
    id: 1, type: 'mc', category: 'Vocabulario', level: 'A1',
    question: '¿Qué significa la frase "I am thirsty"?',
    options: ['Tengo hambre', 'Tengo sed', 'Tengo frío', 'Estoy cansado'],
    answer: 1,
  },
  {
    id: 2, type: 'mc', category: 'Vocabulario', level: 'A1',
    question: 'What does "brother" mean?',
    options: ['Prima', 'Hermana', 'Hermano', 'Tío'],
    answer: 2,
  },
  {
    id: 3, type: 'tf', category: 'Vocabulario', level: 'A1',
    question: '"Dog" significa "gato" en inglés.',
    options: ['Verdadero', 'Falso'],
    answer: 1,
  },
  // ── Gramática A1–A2 ─────────────────────────────────────────────────────
  {
    id: 4, type: 'fill', category: 'Gramática', level: 'A1',
    question: 'My name ___ Carlos.',
    options: ['am', 'is', 'are', 'be'],
    answer: 1,
  },
  {
    id: 5, type: 'mc', category: 'Gramática', level: 'A2',
    question: '¿Cuál de estas oraciones es correcta?',
    options: ["She don't like coffee.", "She doesn't like coffee.", 'She not like coffee.', 'She no like coffee.'],
    answer: 1,
  },
  {
    id: 6, type: 'mc', category: 'Vocabulario', level: 'A2',
    question: '"Worried" significa:',
    options: ['Cansado', 'Emocionado', 'Preocupado', 'Aburrido'],
    answer: 2,
  },
  {
    id: 7, type: 'fill', category: 'Gramática', level: 'A2',
    question: 'I ___ to the gym three times last week.',
    options: ['go', 'goes', 'went', 'gone'],
    answer: 2,
  },
  {
    id: 8, type: 'tf', category: 'Gramática', level: 'A2',
    question: '"I have seen that movie yesterday" es una oración correcta en inglés.',
    options: ['Verdadero', 'Falso'],
    answer: 1,
  },
  // ── Gramática A2–B1 ─────────────────────────────────────────────────────
  {
    id: 9, type: 'mc', category: 'Gramática', level: 'A2',
    question: 'What is the past tense of "go"?',
    options: ['Goed', 'Gone', 'Going', 'Went'],
    answer: 3,
  },
  {
    id: 10, type: 'mc', category: 'Gramática', level: 'B1',
    question: 'Choose the correct sentence about a past habit:',
    options: ['I use to play football.', 'I used to play football.', 'I was use to play football.', 'I would used to play football.'],
    answer: 1,
  },
  {
    id: 11, type: 'fill', category: 'Gramática', level: 'B1',
    question: 'She has been working here ___ 2018.',
    options: ['for', 'since', 'during', 'while'],
    answer: 1,
  },
  {
    id: 12, type: 'mc', category: 'Gramática', level: 'B1',
    question: 'If I ___ more time, I would study harder.',
    options: ['have', 'had', 'would have', 'will have'],
    answer: 1,
  },
  {
    id: 13, type: 'mc', category: 'Vocabulario', level: 'B1',
    question: '"Nevertheless" significa:',
    options: ['Además', 'Por lo tanto', 'Sin embargo', 'Mientras tanto'],
    answer: 2,
  },
  {
    id: 14, type: 'mc', category: 'Gramática', level: 'B1',
    question: 'The passive form of "They built this house in 1990" is:',
    options: ['This house is built in 1990.', 'This house was built in 1990.', 'This house has built in 1990.', 'This house were built in 1990.'],
    answer: 1,
  },
  {
    id: 15, type: 'tf', category: 'Gramática', level: 'B1',
    question: '"Despite of the rain, we went out" es gramaticalmente correcto.',
    options: ['Verdadero', 'Falso'],
    answer: 1,
  },
  {
    id: 16, type: 'mc', category: 'Vocabulario', level: 'B1',
    question: '"To come across" means:',
    options: ['Cruzar una calle', 'Llegar tarde', 'Encontrar algo por casualidad', 'Dar una vuelta'],
    answer: 2,
  },
  // ── Lectura B1–B2 ───────────────────────────────────────────────────────
  {
    id: 17, type: 'mc', category: 'Lectura', level: 'B1',
    question: 'According to the text, what is one advantage of remote work?',
    options: ['Higher salary', 'Less commuting time and money', 'Fewer working hours', 'Better job security'],
    answer: 1,
  },
  {
    id: 18, type: 'mc', category: 'Lectura', level: 'B1',
    question: 'What does "commuting" refer to in the text?',
    options: ['Usar una computadora', 'Trabajar en equipo', 'Viajar al trabajo', 'Comunicarse con colegas'],
    answer: 2,
  },
  {
    id: 19, type: 'tf', category: 'Lectura', level: 'B1',
    question: 'According to the text, remote work has ONLY advantages.',
    options: ['Verdadero', 'Falso'],
    answer: 1,
  },
  {
    id: 20, type: 'mc', category: 'Lectura', level: 'B2',
    question: 'What is the main purpose of this text?',
    options: [
      'Persuadir al lector de trabajar desde casa',
      'Presentar los pros y contras del trabajo remoto',
      'Criticar a las empresas que no permiten teletrabajo',
      'Explicar cómo ser más eficiente en casa',
    ],
    answer: 1,
  },
  // ── Listening B1–B2 ─────────────────────────────────────────────────────
  {
    id: 21, type: 'listen', category: 'Listening', level: 'B1',
    audioText: 'The conference will be held next Monday at nine thirty in the morning.',
    question: 'When will the conference be held?',
    options: ['Sunday at 9:30 AM', 'Monday at 9:30 AM', 'Tuesday at 9:30 AM', 'Monday at 3:30 PM'],
    answer: 1,
  },
  {
    id: 22, type: 'listen', category: 'Listening', level: 'B1',
    audioText: "I'd rather stay home than go to the party tonight.",
    question: 'What does the speaker prefer?',
    options: ['Ir a la fiesta', 'Quedarse en casa', 'Salir con amigos', 'Trabajar hasta tarde'],
    answer: 1,
  },
  {
    id: 23, type: 'listen', category: 'Listening', level: 'B2',
    audioText: 'Although the project was challenging, the team managed to complete it ahead of schedule.',
    question: '"Ahead of schedule" means:',
    options: ['Con retraso', 'Con mucha dificultad', 'Antes de lo previsto', 'Con ayuda adicional'],
    answer: 2,
  },
  // ── Vocabulario & Gramática B2 ──────────────────────────────────────────
  {
    id: 24, type: 'mc', category: 'Vocabulario', level: 'B2',
    question: '"Ambiguous" means:',
    options: ['Claro y preciso', 'Que puede interpretarse de varias maneras', 'Extremadamente largo', 'Difícil de leer'],
    answer: 1,
  },
  {
    id: 25, type: 'mc', category: 'Gramática', level: 'B2',
    question: 'Choose the most natural way to say "Ojalá hubiera estudiado medicina":',
    options: ['I wish I would study medicine.', 'I wish I studied medicine.', 'I wish I had studied medicine.', 'I wish I was studying medicine.'],
    answer: 2,
  },
  {
    id: 26, type: 'tf', category: 'Gramática', level: 'B2',
    question: '"The more you practice, the better you become" is a correct grammatical structure.',
    options: ['Verdadero', 'Falso'],
    answer: 0,
  },
  {
    id: 27, type: 'mc', category: 'Vocabulario', level: 'B2',
    question: '"Meticulous" most closely means:',
    options: ['Descuidado e impulsivo', 'Muy cuidadoso y detallista', 'Rápido y eficiente', 'Creativo e innovador'],
    answer: 1,
  },
  // ── Gramática & Vocabulario C1 ──────────────────────────────────────────
  {
    id: 28, type: 'mc', category: 'Gramática', level: 'C1',
    question: 'Choose the grammatically correct sentence:',
    options: [
      'They gave me an important information.',
      'They gave me important informations.',
      'They gave me some important informations.',
      'They gave me important information.',
    ],
    answer: 3,
  },
  {
    id: 29, type: 'mc', category: 'Vocabulario', level: 'C1',
    question: '"Albeit" is used to mean:',
    options: ['Además', 'Aunque', 'Por lo tanto', 'Sin duda'],
    answer: 1,
  },
  {
    id: 30, type: 'mc', category: 'Gramática', level: 'C1',
    question: 'Complete: "No sooner ___ arrived than it started to rain."',
    options: ['he had', 'had he', 'he has', 'has he'],
    answer: 1,
  },
];

// ─── Scoring ─────────────────────────────────────────────────────────────────
function getLevel(score: number) {
  if (score <= 5)  return 'A1';
  if (score <= 11) return 'A2';
  if (score <= 18) return 'B1';
  if (score <= 24) return 'B2';
  return 'C1';
}

const LEVEL_DATA = {
  A1: {
    emoji: '🌱', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200',
    text: 'text-green-700', badge: 'bg-green-100 text-green-800',
    title: 'Principiante',
    desc: 'Conoces palabras y frases básicas del inglés. Puedes saludar, presentarte y entender instrucciones simples. ¡Estás dando tus primeros pasos y tienes todo el camino por delante!',
    tip: 'Empieza por el curso A1 — Desde Cero. En BLANG aprenderás con explicaciones en español y ejemplos de la vida real.',
  },
  A2: {
    emoji: '📗', color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50', border: 'border-teal-200',
    text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800',
    title: 'Elemental',
    desc: 'Puedes comunicarte en situaciones cotidianas simples: hacer compras, pedir información, hablar sobre tu rutina. Tu base es sólida, ¡es el momento de crecer!',
    tip: 'El curso A2 en BLANG es perfecto para ti. Aprenderás estructuras más complejas con la misma metodología clara y en español.',
  },
  B1: {
    emoji: '📘', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-200',
    text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800',
    title: 'Intermedio',
    desc: 'Entiendes el inglés en situaciones familiares y puedes expresarte con cierta fluidez. Puedes participar en conversaciones cotidianas y eres capaz de comprender textos sobre temas conocidos.',
    tip: 'En el curso B1 de BLANG practicarás conversaciones reales, phrasal verbs y textos auténticos — todo 100% en inglés.',
  },
  B2: {
    emoji: '📙', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200',
    text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800',
    title: 'Intermedio Avanzado',
    desc: 'Dominas el inglés en situaciones complejas. Puedes entender textos extensos, expresarte con fluidez y argumentar tu punto de vista con precisión. ¡Estás muy cerca de la fluidez total!',
    tip: 'El curso B2 de BLANG lleva tu inglés al nivel profesional: modismos, matices culturales y expresión avanzada.',
  },
  C1: {
    emoji: '🏆', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200',
    text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800',
    title: 'Avanzado',
    desc: 'Tienes un dominio avanzado del inglés. Te expresas con fluidez, precisión y eficacia en contextos académicos y profesionales. Puedes entender prácticamente cualquier texto o conversación.',
    tip: 'En el curso C1 de BLANG perfeccionarás el inglés académico, debates de alto nivel y matices del idioma nativo.',
  },
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG = {
  Vocabulario: { emoji: '📖', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  Gramática:   { emoji: '✏️', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  Lectura:     { emoji: '📰', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  Listening:   { emoji: '🎧', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

// ─── TTS helper ───────────────────────────────────────────────────────────────
function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.85;
  const trySpeak = () => {
    const vs = window.speechSynthesis.getVoices();
    const v = vs.find(x => x.lang === 'en-US') || vs.find(x => x.lang.startsWith('en'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };
  if (window.speechSynthesis.getVoices().length > 0) trySpeak();
  else { window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null; }; }
}

// ─── Main component ───────────────────────────────────────────────────────────
interface LevelQuizProps {
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export default function LevelQuiz({ open, onClose, onRegister }: LevelQuizProps) {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(false); // whether audio has been played

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const isListen = q?.type === 'listen';
  const isReading = q?.category === 'Lectura';
  const isFill = q?.type === 'fill';
  const catCfg = q ? CAT_CONFIG[q.category] : null;

  // Reset state when modal opens
  useEffect(() => {
    if (open) { setPhase('intro'); setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setPlayed(false); }
  }, [open]);

  // Reset per-question state
  useEffect(() => {
    setSelected(null); setAnswered(false); setPlayed(false);
  }, [current]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= total) {
      setPhase('result');
    } else {
      setCurrent(c => c + 1);
    }
  };

  const handleRestart = () => {
    setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setPlayed(false);
    setPhase('intro');
  };

  if (!open) return null;

  // ── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const level = getLevel(score);
    const ld = LEVEL_DATA[level];
    const pct = Math.round((score / total) * 100);
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-background w-full sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[100dvh] sm:max-h-[90vh]">
          {/* Header gradient */}
          <div className={`bg-gradient-to-br ${ld.color} px-6 pt-10 pb-8 text-center relative`}>
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="text-6xl mb-3">{ld.emoji}</div>
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">Tu nivel de inglés es</p>
            <h2 className="text-6xl font-black text-white mb-1">{level}</h2>
            <p className="text-white font-bold text-lg">{ld.title}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Score */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-3xl font-black text-foreground">{score}<span className="text-lg font-semibold text-muted-foreground">/{total}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">Respuestas correctas</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-3xl font-black text-foreground">{pct}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Puntuación</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-2xl font-black text-foreground">{level}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Nivel MCER</p>
              </div>
            </div>

            {/* Description */}
            <div className={`rounded-2xl border-2 ${ld.border} ${ld.bg} p-4`}>
              <p className={`text-sm leading-relaxed ${ld.text}`}>{ld.desc}</p>
            </div>

            {/* Tip */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{ld.tip}</p>
            </div>

            {/* Level scale */}
            <div className="flex gap-1.5 items-end">
              {['A1','A2','B1','B2','C1'].map(lv => (
                <div key={lv} className="flex-1 text-center">
                  <div className={`rounded-lg mb-1 transition-all ${
                    lv === level ? `bg-gradient-to-br ${ld.color} h-8` : 'bg-muted h-4'
                  }`} />
                  <p className={`text-[10px] font-bold ${lv === level ? ld.text : 'text-muted-foreground'}`}>{lv}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-1">
              <Button
                className="w-full rounded-2xl py-5 font-bold text-base bg-primary hover:bg-primary/90 gap-2"
                onClick={() => { onClose(); onRegister(); }}
              >
                🎉 Registrarse gratis y empezar
              </Button>
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <RotateCcw className="h-4 w-4" /> Repetir el test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── INTRO SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <div className="bg-background w-full sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[100dvh] sm:max-h-[90vh]">
          {/* Hero */}
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-primary px-6 pt-10 pb-8 text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="text-5xl mb-3">🎯</div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Descubre tu nivel de inglés</h2>
            <p className="text-white/80 text-sm">Un test rápido y preciso para saber exactamente dónde estás</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[['30', 'preguntas'], ['~10', 'minutos'], ['5', 'niveles']].map(([n, l]) => (
                <div key={l} className="text-center rounded-2xl bg-muted/40 py-3 px-2">
                  <p className="text-2xl font-black text-primary">{n}</p>
                  <p className="text-xs text-muted-foreground font-medium">{l}</p>
                </div>
              ))}
            </div>

            {/* What's covered */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">¿Qué evalúa?</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
                  <div key={cat} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${cfg.color}`}>
                    <span>{cfg.emoji}</span>
                    <span className="text-xs font-semibold">{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Level scale preview */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Niveles posibles</p>
              <div className="flex gap-2">
                {Object.entries(LEVEL_DATA).map(([lv, ld]) => (
                  <div key={lv} className={`flex-1 rounded-xl border-2 ${ld.border} ${ld.bg} py-2 text-center`}>
                    <p className="text-base">{ld.emoji}</p>
                    <p className={`text-xs font-black ${ld.text}`}>{lv}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-muted-foreground text-center bg-muted/30 rounded-xl px-4 py-3">
              💡 Este test es solo orientativo y no guarda ningún dato. Es 100% gratuito.
            </p>

            <Button
              className="w-full rounded-2xl py-5 font-bold text-base gap-2"
              onClick={() => setPhase('quiz')}
            >
              Comenzar test 🚀
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ────────────────────────────────────────────────────────────
  const progress = ((current) / total) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh]">

        {/* ── Top bar ── */}
        <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-muted-foreground">{current + 1} / {total}</span>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${catCfg?.color}`}>
              <span>{catCfg?.emoji}</span>
              <span>{q.category}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Reading passage */}
          {isReading && (
            <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4">
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-2">📰 Lee el siguiente texto</p>
              <p className="text-sm text-teal-900 leading-relaxed">{READING_PASSAGE}</p>
            </div>
          )}

          {/* Listening button */}
          {isListen && (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                onClick={() => { speak(q.audioText); setPlayed(true); }}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  played
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-rose-400 hover:bg-rose-500 animate-pulse'
                }`}
              >
                <Volume2 className="w-9 h-9 text-white" />
              </button>
              <p className="text-xs text-muted-foreground font-medium">
                {played ? 'Toca para escuchar de nuevo' : 'Toca para escuchar el audio'}
              </p>
              {answered && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-3 py-1 font-medium">
                  🔊 Texto: "<em>{q.audioText}</em>"
                </p>
              )}
            </div>
          )}

          {/* Question */}
          {isFill ? (
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 px-5 py-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">✏️ Completa la oración</p>
              <p className="text-base font-bold text-foreground leading-relaxed">
                {q.question.split('___').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={`inline-block border-b-2 border-dashed mx-1 px-3 font-semibold min-w-[60px] text-center ${
                        answered
                          ? selected === q.answer ? 'border-green-500 text-green-700' : 'border-red-400 text-red-600'
                          : 'border-amber-500 text-amber-600'
                      }`}>
                        {answered ? q.options[q.answer] : '?'}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          ) : !isListen && (
            <p className="text-base font-bold text-foreground leading-snug">{q.question}</p>
          )}

          {isListen && !answered && (
            <p className="text-sm font-semibold text-foreground">{q.question}</p>
          )}
          {isListen && answered && (
            <p className="text-sm font-semibold text-foreground">{q.question}</p>
          )}

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = idx === q.answer;
              let cls = 'bg-background border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
              if (answered) {
                if (isCorrect) cls = 'bg-green-50 border-green-400 text-green-800';
                else if (isSelected && !isCorrect) cls = 'bg-red-50 border-red-400 text-red-800';
                else cls = 'bg-muted/30 border-border text-muted-foreground';
              } else if (isSelected) {
                cls = 'bg-primary/10 border-primary text-foreground';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left text-sm font-medium ${cls}`}
                >
                  <div className={`w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center text-white text-xs font-bold ${
                    answered
                      ? isCorrect ? 'bg-green-500 border-green-500'
                        : isSelected ? 'bg-red-400 border-red-400'
                        : 'border-muted-foreground/40 bg-transparent'
                      : isSelected ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40'
                  }`}>
                    {answered && isCorrect ? '✓' : answered && isSelected && !isCorrect ? '✗' : ''}
                  </div>
                  <span>{opt}</span>
                  {answered && isCorrect && <span className="ml-auto text-green-600 text-xs font-bold shrink-0">Correcto</span>}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
              selected === q.answer ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {selected === q.answer ? '✅ ¡Correcto!' : `❌ La respuesta correcta era: "${q.options[q.answer]}"`}
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          {!answered ? (
            <Button disabled className="w-full rounded-xl py-3 font-bold opacity-40">
              Selecciona una respuesta
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full rounded-xl py-3 font-bold gap-2">
              {current + 1 >= total ? '🏁 Ver mi resultado' : 'Siguiente'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
