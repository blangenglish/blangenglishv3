// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronRight, Star, Lock, Sparkles } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import { MODULES } from '@/components/EnglishForYou';
import { MUNDO_REAL_TOPICS } from '@/pages/MundoRealData';
import { ClasesVirtualesModal } from '@/components/ClasesVirtualesModal';
import LevelQuiz from '@/components/LevelQuiz';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 35 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 35 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};

interface EnglishProgramProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

const STEPS = [
  {
    number: '01',
    emoji: '📚',
    title: 'Gramática',
    color: 'from-purple-500 to-violet-600',
    bg: 'from-purple-50 to-violet-50 border-purple-200',
    tag: 'bg-purple-100 text-purple-700',
    desc: 'Aprendes las reglas del idioma de forma clara y en español. Sin tecnicismos complicados, con ejemplos reales del día a día.',
    details: [
      'Explicaciones 100% en español',
      'Reglas con ejemplos cotidianos',
      'Ejercicios de aplicación inmediata',
      'Comparación con el español para entender mejor',
    ],
  },
  {
    number: '02',
    emoji: '📖',
    title: 'Vocabulario',
    color: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 to-indigo-50 border-blue-200',
    tag: 'bg-blue-100 text-blue-700',
    desc: 'Palabras y frases reales, organizadas por temas de tu vida: familia, trabajo, viajes, emociones. Aprendes lo que vas a usar.',
    details: [
      'Palabras agrupadas por temas prácticos',
      'Frases completas, no solo palabras sueltas',
      'Flashcards y repetición espaciada',
      'Pronunciación incluida en cada palabra',
    ],
  },
  {
    number: '03',
    emoji: '📰',
    title: 'Lectura',
    color: 'from-teal-500 to-cyan-600',
    bg: 'from-teal-50 to-cyan-50 border-teal-200',
    tag: 'bg-teal-100 text-teal-700',
    desc: 'Textos cortos y graduales: noticias, historias, diálogos. Lees para entender el contexto real del idioma y ampliar vocabulario naturalmente.',
    details: [
      'Textos adaptados a tu nivel',
      'Comprensión lectora con preguntas guía',
      'Vocabulario nuevo resaltado con traducción',
      'Temas interesantes: cultura, viajes, tecnología',
    ],
  },
  {
    number: '04',
    emoji: '🎧',
    title: 'Escucha',
    color: 'from-pink-500 to-rose-600',
    bg: 'from-pink-50 to-rose-50 border-pink-200',
    tag: 'bg-pink-100 text-pink-700',
    desc: 'Audio con hablantes nativos en situaciones reales. Entrenas tu oído para entender inglés natural, no solo el "inglés de academia".',
    details: [
      'Audios con acento americano y británico',
      'Velocidad ajustable para practicar',
      'Transcripciones para comparar',
      'Diálogos de la vida real: aeropuerto, restaurante, trabajo',
    ],
  },
  {
    number: '05',
    emoji: '🤖',
    title: 'Práctica con IA',
    color: 'from-amber-500 to-orange-600',
    bg: 'from-amber-50 to-orange-50 border-amber-200',
    tag: 'bg-amber-100 text-amber-700',
    desc: 'Practicas escritura y conversación con inteligencia artificial (ChatGPT). Correcciones instantáneas, sin vergüenza, a tu propio ritmo.',
    details: [
      'Conversaciones escritas con IA',
      'Corrección automática de gramática y estilo',
      'Practica oral: pronunciación y fluidez',
      'Disponible 24/7, sin horarios fijos',
    ],
  },
];

const UNITS = [
  { emoji: '📅', title: 'Una unidad por semana', desc: 'O cada 4 días si quieres avanzar más rápido. Tú decides el ritmo.' },
  { emoji: '🔁', title: 'Ciclo completo en cada unidad', desc: 'Cada unidad recorre los 5 pasos: gramática → vocabulario → lectura → escucha → IA.' },
  { emoji: '🎯', title: 'Progresivo y acumulativo', desc: 'Lo que aprendes en una unidad lo refuerzas en la siguiente. Nada se queda atrás.' },
  { emoji: '🌍', title: 'A1–A2 en español', desc: 'Los niveles iniciales usan el español como apoyo. A partir de B1, todo es 100% en inglés.' },
];

const LEVELS = [
  { level: 'A1', title: 'Desde Cero', emoji: '🌱', units: 27, desc: 'Saludos, números, colores, familia y primeras frases.', lang: '🇪🇸 Explicaciones en español', color: 'bg-green-100 text-green-700 border-green-200', langColor: 'bg-green-50 text-green-600' },
  { level: 'A2', title: 'Elemental', emoji: '📗', units: 5, desc: 'Frases completas, presente y pasado simple.', lang: '🇪🇸 Explicaciones en español', color: 'bg-teal-100 text-teal-700 border-teal-200', langColor: 'bg-teal-50 text-teal-600' },
  { level: 'B1', title: 'Intermedio', emoji: '📘', units: 10, desc: 'Conversaciones fluidas sobre el mundo y viajes.', lang: '🇺🇸 100% en inglés', color: 'bg-blue-100 text-blue-700 border-blue-200', langColor: 'bg-blue-50 text-blue-600' },
  { level: 'B2', title: 'Interm. Avanzado', emoji: '📙', units: 13, desc: 'Phrasal verbs, modismos y expresión avanzada.', lang: '🇺🇸 100% en inglés', color: 'bg-purple-100 text-purple-700 border-purple-200', langColor: 'bg-purple-50 text-purple-600' },
  { level: 'C1', title: 'Avanzado', emoji: '🏆', units: 15, desc: 'Debates, textos académicos y fluidez total.', lang: '🇺🇸 100% en inglés', color: 'bg-amber-100 text-amber-700 border-amber-200', langColor: 'bg-amber-50 text-amber-600' },
];

const FAQ = [
  { q: '¿Cuánto cuesta el plan?', a: 'Tu primer mes tiene 50% de descuento. Luego solo $16 USD ó $60,000 COP al mes. Sin contratos ni compromisos.' },
  { q: '¿Cómo puedo pagar?', a: 'Aceptamos transferencia bancaria o pago por PayPal. Escríbenos y te indicamos el método más conveniente para ti.' },
  { q: '¿Puedo cancelar cuando quiera?', a: '¡Claro! No hay contratos ni compromisos. Cancelas cuando quieras desde tu perfil, sin cargos ocultos.' },
  { q: '¿Las sesiones en vivo son incluidas?', a: 'Las sesiones 1 a 1 no están incluidas en el plan mensual de cursos — arma tu propio plan de clases en vivo eligiendo días, horas y horario, desde $37,500 COP por clase.' },
  { q: '¿Hay compromiso al empezar?', a: 'No. Sin contratos ni compromisos, y tu primer mes tiene 50% de descuento. Cancelas cuando quieras.' },
];

const VALID_AGE_GROUPS = ['kids', 'teens', 'adults'];

// ── Promoción: 50% de descuento en el primer mes (reemplaza la prueba gratis) ──
// PENDIENTE POR DEFINIR: si este descuento aplica también al precio del plan de
// "Clases en vivo" (Arma tu plan / ClasesVirtualesModal) o solo al plan base/
// estándar de cursos. Por ahora solo se muestra como promoción visual en esta
// página — no se modifica el cálculo de precios dentro del modal (Parte 3).
const PRECIO_MENSUAL_COP = 60000;
const PRECIO_MENSUAL_USD = 16;
const PRECIO_MENSUAL_COP_DESC = PRECIO_MENSUAL_COP / 2;
const PRECIO_MENSUAL_USD_DESC = PRECIO_MENSUAL_USD / 2;
// "Desde $37,500 COP/clase" es el mismo precio de referencia que ya se mostraba
// en esta tarjeta antes de la promoción — no es un precio nuevo inventado.
const PRECIO_CLASE_BASE = 37500;
const PRECIO_CLASE_DESC = PRECIO_CLASE_BASE / 2;

export default function EnglishProgram({ onOpenAuth, isLoggedIn }: EnglishProgramProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Grupo de edad detectado por la tarjeta de la pantalla de bienvenida (?age=kids|teens|adults).
  // Si llega por otro medio (link directo, etc.) queda sin preseleccionar y el modal usa 'adults' por defecto.
  const ageParam = searchParams.get('age');
  const initialAgeGroup = VALID_AGE_GROUPS.includes(ageParam) ? (ageParam as 'kids' | 'teens' | 'adults') : undefined;
  const [showClasesModal, setShowClasesModal] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [reviews, setReviews] = useState<{ full_name: string; rating: number; comment: string }[]>([]);
  const [moduleContent, setModuleContent] = useState<Record<string, { id: string; title: string; rich_text: string; sort_order: number }[]>>({});

  useEffect(() => {
    supabase
      .from('student_reviews')
      .select('full_name, rating, comment')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data?.length) setReviews(data); });
  }, []);

  // Carga dinámica de contenido de módulos "English for you" (público, sin auth)
  useEffect(() => {
    supabase
      .from('english_for_students_sections')
      .select('id, module_id, title, rich_text, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const grouped: Record<string, { id: string; title: string; rich_text: string; sort_order: number }[]> = {};

        // ── Contenido de Supabase (escritura, gramática, lectura, listening, vocabulario) ──
        for (const row of (data ?? [])) {
          if (!grouped[row.module_id]) grouped[row.module_id] = [];
          grouped[row.module_id].push(row);
        }

        // ── Fonética: contenido estático (no tiene tabla propia en Supabase) ──
        grouped['fonetica'] = [
          { id: 'fonetica-vowels',      title: 'Vocales del inglés',        rich_text: '/ɪ/ sit · /iː/ see · /ʊ/ look · /uː/ food · /e/ bed · /ə/ about · /ɜː/ bird · /ɔː/ more · /æ/ cat · /ʌ/ cup · /ɑː/ far · /ɒ/ hot', sort_order: 0 },
          { id: 'fonetica-consonants',  title: 'Consonantes del inglés',    rich_text: '/p/ pen · /b/ bad · /t/ ten · /d/ dog · /k/ cat · /g/ go · /f/ fan · /v/ van · /θ/ think · /ð/ this · /s/ see · /z/ zoo · /ʃ/ she · /ʒ/ vision · /h/ hat · /tʃ/ chair · /dʒ/ jam', sort_order: 1 },
          { id: 'fonetica-diphthongs',  title: 'Diptongos (diphthongs)',    rich_text: '/eɪ/ day · /aɪ/ my · /ɔɪ/ boy · /əʊ/ go · /aʊ/ now · /ɪə/ ear · /eə/ air · /ʊə/ pure', sort_order: 2 },
          { id: 'fonetica-practice',    title: 'Práctica de pronunciación', rich_text: 'Ejercicios interactivos para entrenar cada sonido con audio real', sort_order: 3 },
        ];

        // ── Mundo Real: primeros temas de MUNDO_REAL_TOPICS ──
        grouped['mundo-real'] = MUNDO_REAL_TOPICS.slice(0, 6).map((topic, i) => ({
          id: `mr-${topic.id}`,
          title: `${topic.emoji} ${topic.title}`,
          rich_text: topic.vocabulary.slice(0, 4).map(v => `${v.word} = ${v.translation}`).join(' · '),
          sort_order: i,
        }));

        setModuleContent(grouped);
      });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="back">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── ARMA TU PLAN (Clases 1 a 1) — PRIMER BLOQUE ── */}
      <section id="sesiones-vivo" className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {/* Badge + título */}
            <motion.div variants={fadeInUp} className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full mb-4 sm:mb-5 border border-primary/20">
                🎥 Clases en vivo
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground leading-tight mb-3 sm:mb-4">
                Clases{' '}
                <span className="text-primary">1 a 1</span>
                {' '}con<br className="hidden md:block" />{' '}nuestros profes
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto">
                Practica con un profe en vivo, a tu horario y a tu ritmo
              </p>
            </motion.div>

            {/* Cards de beneficios + CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">

              {/* Columna izquierda: beneficios */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-5">
                {[
                  { icon: '🗓️', title: 'Tú eliges el horario', desc: 'Elige los días y el horario fijo de tus clases al armar tu plan mensual.' },
                  { icon: '🎯', title: 'Temas a la medida', desc: 'Trabaja exactamente lo que necesitas: gramática, conversación, pronunciación, negocios...' },
                  { icon: '💻', title: 'Google Meet', desc: 'Sesiones cómodas por videollamada, desde cualquier lugar del mundo.' },
                  { icon: '🔓', title: 'Sin matrícula obligatoria', desc: 'No necesitas estar matriculado en un curso para tomar clases en vivo.' },
                  { icon: 'ℹ️', title: 'Servicio adicional', desc: 'Este servicio es adicional a los cursos. Escríbenos por WhatsApp al +57 323 640 5246 para armar tu plan de clases en vivo.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-4 sm:gap-5 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm sm:text-base text-foreground mb-1">{item.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Columna derecha: tarjeta precio + CTA */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-6">
                {/* Tarjeta precio destacada */}
                <div className="relative bg-gradient-to-br from-primary via-violet-600 to-purple-700 rounded-3xl p-5 sm:p-8 text-white shadow-2xl shadow-primary/30 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />

                  {/* Badge de descuento — aplica sin importar la edad elegida */}
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-black text-xs sm:text-sm font-black px-3 py-1.5 rounded-full shadow-lg rotate-3">
                      🎉 -50% primer mes
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl sm:text-2xl">👨‍🏫</div>
                      <div>
                        <p className="font-extrabold text-base sm:text-lg">Clase individual</p>
                        <p className="text-white/70 text-xs sm:text-sm">Con profesor nativo / bilingüe</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-3 mb-2 flex-wrap">
                      <span className="text-lg sm:text-2xl font-bold text-white/50 line-through leading-none">
                        ${PRECIO_CLASE_BASE.toLocaleString('es-CO')}
                      </span>
                      <span className="text-5xl sm:text-7xl font-black leading-none">
                        ${PRECIO_CLASE_DESC.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6">COP por clase · primer mes · Según tu plan mensual</p>
                    <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8">
                      {[
                        '✓  Corrección en tiempo real',
                        '✓  Feedback personalizado',
                        '✓  Cancela con 24h de anticipación',
                      ].map((f, i) => (
                        <li key={i} className="text-white/90 font-medium text-xs sm:text-sm">{f}</li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      className="w-full bg-white text-primary hover:bg-white/90 font-extrabold text-base sm:text-lg py-5 sm:py-6 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                      onClick={() => setShowClasesModal(true)}
                    >
                      📅 Arma tu plan mensual
                    </Button>
                  </div>
                </div>

                {/* Nota de confianza */}
                <div className="flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-3 sm:p-4 shadow-sm">
                  <span className="text-2xl sm:text-3xl">⭐</span>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-foreground">Profesores verificados</p>
                    <p className="text-xs text-muted-foreground">Bilingües con experiencia comprobada en enseñanza de inglés</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA COMPACTO DE REGISTRO ── */}
      <section id="hero" className="relative py-14 sm:py-20 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400/8 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-6">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-primary/20">
                🎉 ¡50% de descuento en tu primer mes!
              </span>
            </motion.div>

            <motion.div variants={staggerItem}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
                <span className="italic text-foreground/70">&quot;Speak Up and</span><br />
                <span className="text-primary">Stand Out</span><br />
                <span className="italic text-foreground/70">with </span>
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">BLANG&quot;</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium mt-4 sm:mt-5">Aprende inglés desde ya 🌎</p>
            </motion.div>

            <motion.div variants={staggerItem} className="mt-8">
              <button
                onClick={() => onOpenAuth?.('register')}
                className="w-full sm:w-auto sm:px-14 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-white font-extrabold text-base sm:text-lg py-4 rounded-2xl transition-opacity shadow-lg shadow-primary/30"
              >
                ¡Crear mi cuenta gratis! 🚀
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA (4 pilares) ── */}
      <section className="py-16 bg-white/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">¿Cómo funciona?</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">El aprendizaje está organizado en <strong className="text-foreground">unidades semanales</strong> con un ciclo completo de 5 pasos</p>
            </motion.div>
            <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {UNITS.map((u, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-3">{u.emoji}</div>
                  <h3 className="font-bold mb-2">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── 5 PASOS ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                El ciclo completo
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Los 5 pasos de cada unidad</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Cada unidad recorre este ciclo completo. Así el aprendizaje se vuelve natural y sólido.
              </p>
            </motion.div>

            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={i % 2 === 0 ? fadeLeft : fadeRight}
                  className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 items-center`}
                >
                  {/* Icon side */}
                  <div className={`flex-shrink-0 w-full md:w-64 rounded-3xl bg-gradient-to-br ${step.bg} border-2 p-8 flex flex-col items-center text-center shadow-sm`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl mb-3 shadow-lg`}>
                      {step.emoji}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${step.tag} mb-2`}>Paso {step.number}</span>
                    <h3 className="text-2xl font-extrabold">{step.title}</h3>
                  </div>

                  {/* Content side */}
                  <div className="flex-1 bg-background/80 border border-border/40 rounded-3xl p-7 shadow-sm">
                    <p className="text-base text-muted-foreground leading-relaxed mb-5">{step.desc}</p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                          </span>
                          <span className="text-sm text-foreground/80">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── NIVELES ── */}
      <section className="py-16 bg-purple-50/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">5 cursos, del A1 al C1</h2>
              <p className="text-muted-foreground text-lg">Empieza desde donde estás y avanza a tu ritmo. Cada curso aplica la misma metodología intuitiva.</p>
            </motion.div>

            {/* Language transition note */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2">
                <span className="text-lg">🇪🇸</span>
                <span className="text-sm font-semibold text-green-700">A1 y A2 — Español como apoyo</span>
              </div>
              <span className="text-muted-foreground font-bold text-lg hidden sm:block">→</span>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-5 py-2">
                <span className="text-lg">🇺🇸</span>
                <span className="text-sm font-semibold text-blue-700">B1 a C1 — 100% en inglés</span>
              </div>
            </motion.div>

            <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {LEVELS.map((lv) => (
                <motion.div key={lv.level} variants={fadeUp}
                  className={`rounded-2xl border-2 p-5 bg-background/80 hover:shadow-md transition-shadow flex flex-col cursor-pointer ${lv.color}`}
                  onClick={() => onOpenAuth?.('register')}
                >
                  <div className="text-3xl mb-2">{lv.emoji}</div>
                  <span className="text-xs font-bold uppercase tracking-wide">{lv.level}</span>
                  <h3 className="font-bold text-base mt-0.5 mb-1">{lv.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug mb-3 flex-1">{lv.desc}</p>
                  <span className="text-xs font-semibold block mb-2">{lv.units} unidades</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${lv.langColor} inline-block`}>
                    {lv.lang}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── ENGLISH FOR YOU (dinámico desde Supabase) ── */}
      <section id="english-for-you" className="py-14 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >

            {/* Encabezado */}
            <motion.div variants={staggerItem} className="text-center mb-8 sm:mb-10">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-4 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" /> Módulos especiales
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
                English for <span className="text-primary">you!</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
                Módulos adicionales de aprendizaje para llevar tu inglés al siguiente nivel.
              </p>
            </motion.div>

            {/* Banner de acceso */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-primary/8 via-violet-50 to-primary/8 border border-primary/20 rounded-2xl px-5 py-4 mb-7 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm sm:text-base font-semibold text-foreground">
                  Regístrate gratis y accede a todo el contenido
                </p>
              </div>
              <button
                onClick={() => onOpenAuth?.('register')}
                className="shrink-0 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-opacity whitespace-nowrap"
              >
                Registrarse gratis →
              </button>
            </motion.div>

            {/* Grid de módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {MODULES.filter(m => m.slug !== 'clases-en-vivo').map((mod) => {
                const sections  = moduleContent[mod.slug] ?? [];
                const preview   = sections[0] ?? null;
                const locked    = sections.slice(1);

                // Texto plano del primer elemento (sin HTML), máx 100 chars
                const snippet = (() => {
                  if (!preview?.rich_text) return '';
                  const txt = preview.rich_text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                  return txt.length > 100 ? txt.slice(0, 100) + '…' : txt;
                })();

                return (
                  <motion.div
                    key={mod.slug}
                    variants={staggerItem}
                    className={`rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-gradient-to-br ${mod.cardBg} ring-1 ${mod.ring} flex flex-col`}
                  >
                    {/* Header con gradiente */}
                    <div className={`relative h-24 bg-gradient-to-br ${mod.gradient} flex items-center gap-3 px-4 overflow-hidden`}>
                      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10" />
                      <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full bg-white/10" />
                      <span className="text-4xl z-10 drop-shadow-md select-none">{mod.emoji}</span>
                      <div className="z-10 min-w-0">
                        <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest block">{mod.category}</span>
                        <p className="text-white font-black text-sm sm:text-base leading-tight">{mod.title}</p>
                      </div>
                    </div>

                    {/* Cuerpo de la card */}
                    <div className="flex flex-col flex-1 p-4 gap-3">

                      {sections.length === 0 ? (
                        /* Sin contenido publicado todavía */
                        <div className="flex-1 flex flex-col items-center justify-center py-5 gap-2 text-center">
                          <span className="text-3xl">🚀</span>
                          <p className="text-xs font-semibold text-muted-foreground">Contenido próximamente</p>
                          <p className="text-[11px] text-muted-foreground/60">Regístrate para ser el primero en acceder</p>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col gap-2">

                          {/* ── Primer elemento: visible (preview) ── */}
                          <div className="rounded-xl bg-background/70 border border-border/40 p-3 flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                              <span className="text-green-500 text-sm font-black mt-0.5 shrink-0">✓</span>
                              <p className="text-sm font-semibold text-foreground leading-snug">{preview.title}</p>
                            </div>
                            {snippet && (
                              <p className="text-xs text-muted-foreground leading-relaxed pl-5 line-clamp-2">{snippet}</p>
                            )}
                          </div>

                          {/* ── Elementos adicionales: bloqueados ── */}
                          {locked.map(s => (
                            <div
                              key={s.id}
                              className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border/30 px-3 py-2"
                            >
                              <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                              <p className="text-xs font-medium text-muted-foreground/70 leading-snug line-clamp-1">{s.title}</p>
                            </div>
                          ))}

                        </div>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => onOpenAuth?.('register')}
                        className={`mt-auto w-full rounded-xl bg-gradient-to-r ${mod.gradient} text-white font-semibold text-sm py-2.5 shadow-sm hover:shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Regístrate para acceder
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA final */}
            <motion.div variants={staggerItem} className="text-center mt-8">
              <button
                onClick={() => onOpenAuth?.('register')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-white font-extrabold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-lg shadow-primary/30 transition-opacity"
              >
                Desbloquear todos los módulos
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-muted-foreground mt-3">50% de descuento en tu primer mes · Sin compromisos</p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── NIVEL TEST ── */}
      <section className="py-16 bg-gradient-to-br from-violet-50 to-purple-50/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp}
              className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-primary p-1 shadow-xl shadow-purple-200"
            >
              <div className="rounded-[22px] bg-background/95 backdrop-blur px-8 py-10 text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
                  Conoce tu nivel de inglés
                </h2>
                <p className="text-muted-foreground text-base mb-2 max-w-xl mx-auto">
                  ¿En qué nivel estás? Descúbrelo con nuestro test de 30 preguntas que evalúa
                  vocabulario, gramática, lectura y comprensión auditiva.
                </p>
                <p className="text-sm text-muted-foreground mb-7">
                  ~10 minutos &nbsp;·&nbsp; Gratuito &nbsp;·&nbsp; Sin registro &nbsp;·&nbsp; Resultado inmediato
                </p>

                {/* Level scale decorative */}
                <div className="flex gap-2 justify-center mb-8">
                  {[
                    { lv: 'A1', emoji: '🌱', from: 'from-green-400', to: 'to-emerald-500' },
                    { lv: 'A2', emoji: '📗', from: 'from-teal-400', to: 'to-cyan-500' },
                    { lv: 'B1', emoji: '📘', from: 'from-blue-400', to: 'to-indigo-500' },
                    { lv: 'B2', emoji: '📙', from: 'from-purple-400', to: 'to-violet-500' },
                    { lv: 'C1', emoji: '🏆', from: 'from-amber-400', to: 'to-orange-500' },
                  ].map(({ lv, emoji, from, to }) => (
                    <div key={lv} className={`flex-1 max-w-[80px] rounded-2xl bg-gradient-to-br ${from} ${to} py-3 text-center shadow-sm`}>
                      <p className="text-lg">{emoji}</p>
                      <p className="text-white font-black text-sm mt-0.5">{lv}</p>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-primary hover:opacity-90 text-white rounded-full px-10 py-6 font-extrabold text-base shadow-lg shadow-primary/30 gap-2"
                  onClick={() => setQuizOpen(true)}
                >
                  🚀 Comenzar test de nivel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA EL PAGO ── */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                💳 Pagos
              </span>
              <h2 className="text-3xl font-bold">¿Cómo funciona el pago?</h2>
              <p className="text-muted-foreground mt-2 text-sm">Proceso simple, sin sorpresas</p>
            </motion.div>
            <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5">
              {[
                { icon: '📝', step: '1', title: 'Regístrate', desc: 'Crea tu cuenta en segundos y activa tu plan con 50% de descuento en el primer mes.' },
                { icon: '💬', step: '2', title: 'Contáctanos', desc: 'Escríbenos y te indicamos cómo realizar el pago.' },
                { icon: '🚀', step: '3', title: 'Activa tu plan', desc: 'Confirmado el pago, activamos tu cuenta en máximo 24 horas hábiles.' },
              ].map(({ icon, step, title, desc }) => (
                <motion.div key={step} variants={fadeUp} className="bg-background border border-border/40 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mx-auto mb-3">{step}</div>
                  <div className="text-3xl mb-2">{icon}</div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                📲 Escríbenos por{' '}
                <a href="https://wa.me/573236405246" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                  WhatsApp +57 323 640 5246
                </a>
                {' '}— respondemos en máximo 24 horas hábiles.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-2xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-background border border-border/50 rounded-2xl px-6 shadow-sm"
                  >
                    <AccordionTrigger className="text-base font-semibold hover:no-underline py-5 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── RESEÑAS DE ESTUDIANTES ── */}
      {reviews.length > 0 && (
        <section id="reviews" className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            >
              {/* Encabezado */}
              <motion.div variants={staggerItem} className="text-center mb-10 sm:mb-14">
                <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Reseñas reales
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  Lo que dicen nuestros <span className="text-primary">estudiantes</span>
                </h2>
                <p className="text-muted-foreground text-base max-w-xl mx-auto">
                  Experiencias de personas que ya están aprendiendo inglés con BLANG.
                </p>
              </motion.div>

              {/* Grid de reseñas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {reviews.map((r, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
                  >
                    {/* Estrellas */}
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                        />
                      ))}
                    </div>

                    {/* Comentario */}
                    <p className="text-sm text-foreground leading-relaxed flex-1">
                      "{r.comment}"
                    </p>

                    {/* Autor anónimo */}
                    <div className="flex items-center gap-2.5 pt-1 border-t border-border/40">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm shrink-0">
                        ✦
                      </div>
                      <span className="text-sm font-semibold text-foreground/80 leading-tight">
                        Estudiante BLANG
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-500" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-2xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">🚀</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              ¡Empieza con 50% de descuento!
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8">
              Tu primer mes por ${PRECIO_MENSUAL_USD_DESC} USD o ${PRECIO_MENSUAL_COP_DESC.toLocaleString('es-CO')} COP. Luego $16 USD o $60,000 COP al mes 🎊
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('register')}
              >
                Registrarse gratis 🎉
              </Button>
              <Button size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 rounded-full px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('login')}
              >
                Ya tengo cuenta
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <ClasesVirtualesModal
        open={showClasesModal}
        onClose={() => setShowClasesModal(false)}
        defaultAgeGroup={initialAgeGroup}
      />

      <LevelQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onRegister={() => onOpenAuth?.('register')}
      />

    </Layout>
  );
}
