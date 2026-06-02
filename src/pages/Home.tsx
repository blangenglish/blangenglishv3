// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Star, Lock, Sparkles } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { IMAGES } from '@/assets/images';
import { supabase } from '@/integrations/supabase/client';
import { MODULES } from '@/components/EnglishForYou';
import { MUNDO_REAL_TOPICS } from '@/pages/MundoRealData';
import { ClasesVirtualesModal } from '@/components/ClasesVirtualesModal';

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

interface HomeProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

const COURSES = [
  { id: 'c1', emoji: '🌱', title: 'Inglés desde Cero', level: 'A1 — Principiante', color: 'from-green-400/20 to-emerald-400/20 border-green-200', badge: 'bg-green-100 text-green-700', desc: 'Saludos, números, colores, familia y primeras conversaciones.' },
  { id: 'c2', emoji: '📗', title: 'Inglés Elemental', level: 'A2 — Elemental', color: 'from-teal-400/20 to-cyan-400/20 border-teal-200', badge: 'bg-teal-100 text-teal-700', desc: 'Amplía tu vocabulario y construye frases completas con confianza.' },
  { id: 'c3', emoji: '📘', title: 'Inglés Intermedio', level: 'B1 — Intermedio', color: 'from-blue-400/20 to-indigo-400/20 border-blue-200', badge: 'bg-blue-100 text-blue-700', desc: 'Conversaciones sobre el mundo, viajes y situaciones cotidianas.' },
  { id: 'c4', emoji: '📙', title: 'Intermedio Avanzado', level: 'B2 — Interm. Avanzado', color: 'from-purple-400/20 to-violet-400/20 border-purple-200', badge: 'bg-purple-100 text-purple-700', desc: 'Phrasal verbs, modismos y conversaciones fluidas.' },
  { id: 'c5', emoji: '🏆', title: 'Inglés Avanzado', level: 'C1 — Avanzado', color: 'from-amber-400/20 to-yellow-400/20 border-amber-200', badge: 'bg-amber-100 text-amber-700', desc: 'Debates, textos académicos y fluidez total.' },
];

const METHODOLOGY_STEPS = [
  { emoji: '✏️', title: 'Gramática', color: 'from-violet-500 to-purple-600' },
  { emoji: '📖', title: 'Vocabulario', color: 'from-blue-500 to-cyan-500' },
  { emoji: '📚', title: 'Lectura', color: 'from-teal-500 to-green-500' },
  { emoji: '🎧', title: 'Escucha', color: 'from-orange-500 to-amber-500' },
  { emoji: '🤖', title: 'Práctica con IA', color: 'from-pink-500 to-rose-500' },
];

export default function Home({ onOpenAuth, isLoggedIn }: HomeProps) {
  const [ctaEmail, setCtaEmail] = useState('');
  const navigate = useNavigate();
  const [showClasesModal, setShowClasesModal] = useState(false);
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
    <Layout onOpenAuth={onOpenAuth}>

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── PRICING HERO — FIRST SECTION ── */}
      <section id="pricing-hero" className="relative min-h-screen flex items-center overflow-hidden py-12 sm:py-16">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-amber-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10 w-full">
          <motion.div
            className="max-w-7xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >

            {/* ── TÍTULO PRINCIPAL ── */}
            <motion.div variants={staggerItem} className="text-center mb-4 px-2">
              <span className="inline-flex items-center gap-2 bg-green-400/20 text-green-300 text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-green-400/30 backdrop-blur mb-4 sm:mb-6">
                💡 Empieza gratis · 7 días sin costo
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight">
                Aprende{' '}
                <span className="text-amber-400">inglés</span>
              </h1>
              {/* Precio — mobile friendly */}
              {/* Precio — una sola línea en móvil */}
              <div className="mt-3 flex flex-col items-center gap-1">
                <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white/80 whitespace-nowrap">
                  por solo{' '}
                  <span className="text-white text-3xl sm:text-4xl md:text-5xl font-black">$15</span>
                  <span className="text-white/60 text-base sm:text-xl font-bold"> USD/mes</span>
                  {' '}<span className="bg-amber-400 text-black text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full align-middle whitespace-nowrap">o $55,000 COP</span>
                </p>
              </div>
              <p className="text-white/60 text-xs sm:text-base mt-2">
                Sin compromisos · <strong className="text-white">Cancela cuando quieras</strong>
              </p>
            </motion.div>

            {/* ── CUATRO TARJETAS DE PRECIOS ── */}
            <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 sm:mt-10">

              {/* ── PRUEBA GRATIS ── */}
              <div className="bg-white/10 backdrop-blur-md border border-white/25 rounded-3xl p-6 flex flex-col gap-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                {/* Header vertical */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl flex-shrink-0">🎁</span>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">Prueba Gratis</h2>
                    <p className="text-white/65 text-xs font-medium mt-0.5">7 días sin costo</p>
                  </div>
                </div>
                {/* Precio */}
                <div>
                  <p className="text-4xl font-black text-green-400 leading-none">GRATIS</p>
                  <p className="text-white/50 text-xs mt-1">7 días completos</p>
                </div>
                {/* Divider */}
                <div className="h-px bg-white/15" />
                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {[
                    '7 días completamente gratis',
                    'Acceso a las primeras 5 lecciones del nivel A1',
                    'Cancela en cualquier momento',
                    'Pagos fáciles y seguros por PayPal y PSE',
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-white/90 text-sm font-medium">
                      <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {/* CTA */}
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-lg shadow-green-500/40"
                >
                  Empezar gratis ahora →
                </button>
              </div>

              {/* ── PLAN MENSUAL ── */}
              <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-amber-400/40 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4 h-full">
                  {/* Header vertical */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl flex-shrink-0">🚀</span>
                    <div>
                      <h2 className="text-xl font-black text-black leading-tight">Plan Mensual</h2>
                      <span className="inline-block bg-black/15 text-black text-xs font-extrabold px-2.5 py-0.5 rounded-full mt-1">Acceso completo</span>
                    </div>
                  </div>
                  {/* Precio */}
                  <div>
                    <div className="flex items-end gap-1.5">
                      <p className="text-4xl font-black text-black leading-none">$15</p>
                      <p className="text-black/60 text-sm mb-0.5">USD / mes</p>
                    </div>
                    <p className="text-black/70 text-xs font-semibold mt-1">o $55,000 COP al mes</p>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-black/15" />
                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {[
                      'Acceso completo a TODOS los cursos',
                      'Práctica con ChatGPT usando prompts ya creados',
                      'Acceso completo a English for you: Fonética, Inglés para el Mundo Real, Escritura, Lectura, Gramática, Listening y Vocabulario',
                      'Soporte prioritario',
                      'Sin contratos anuales',
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-black text-sm font-semibold">
                        <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-black text-[10px] font-black flex-shrink-0 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* CTA */}
                  <button
                    onClick={() => onOpenAuth?.('register')}
                    className="w-full bg-black hover:bg-gray-900 active:scale-[0.98] text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-xl"
                  >
                    ¡Inscribirme ahora! 🚀
                  </button>
                </div>
              </div>

              {/* ── PLAN TRIMESTRAL ── */}
              <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-violet-500/40 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4 h-full">
                  {/* Header vertical */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl flex-shrink-0">💎</span>
                    <div>
                      <h2 className="text-xl font-black text-white leading-tight">Plan Trimestral</h2>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-block bg-white/20 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">3 meses</span>
                        <span className="inline-block bg-amber-400 text-black text-xs font-extrabold px-2.5 py-0.5 rounded-full">⭐ Mejor valor</span>
                      </div>
                    </div>
                  </div>
                  {/* Precio */}
                  <div>
                    <div className="flex items-end gap-1.5">
                      <p className="text-4xl font-black text-white leading-none">$60</p>
                      <p className="text-white/60 text-sm mb-0.5">USD / 3 meses</p>
                    </div>
                    <p className="text-white/70 text-xs font-semibold mt-1">o $240,000 COP por 3 meses</p>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-white/15" />
                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {[
                      'Acceso completo a TODOS los cursos',
                      'Módulos A1, A2, B1, B2, C1',
                      'Práctica con IA para cada módulo de cada unidad (Speakology)',
                      'Acceso completo a English for you: Fonética, Inglés para el Mundo Real, Escritura, Lectura, Gramática, Listening y Vocabulario',
                      'Sin contratos anuales',
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-white text-sm font-semibold">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* CTA */}
                  <button
                    onClick={() => onOpenAuth?.('register')}
                    className="w-full bg-white hover:bg-white/90 active:scale-[0.98] text-violet-700 font-extrabold text-base py-4 rounded-2xl transition-all shadow-xl"
                  >
                    Inscribirme ahora →
                  </button>
                </div>
              </div>

              {/* ── SPANISH FOR FOREIGNERS ── */}
              <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl shadow-orange-500/40 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-4 h-full justify-between">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl flex-shrink-0">🇪🇸</span>
                    <div>
                      <h2 className="text-xl font-black text-white leading-tight">Spanish for Foreigners</h2>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-block bg-white/20 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">Nuevo</span>
                        <span className="inline-block bg-white text-orange-600 text-xs font-extrabold px-2.5 py-0.5 rounded-full">🔜 Próx.</span>
                      </div>
                    </div>
                  </div>
                  {/* Coming soon */}
                  <div className="flex flex-col items-center justify-center flex-1 py-4 gap-3">
                    <span className="text-5xl">⏳</span>
                    <p className="text-white font-extrabold text-lg text-center leading-tight">Próximamente disponible</p>
                    <p className="text-white/70 text-sm text-center">Estamos preparando algo especial para hispanohablantes que quieren enseñar su idioma.</p>
                  </div>
                </div>
              </div>

            </motion.div>

            {/* ── FOOTER INFO ── */}
            <motion.div variants={staggerItem} className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 sm:px-6 py-3 w-full sm:flex-1">
                <p className="text-white/85 text-xs sm:text-sm text-center leading-relaxed">
                  ✅ Empieza gratis. Después continúa por <strong className="text-amber-300">$15 USD</strong> o <strong className="text-amber-300">$55,000 COP</strong> al mes.
                </p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-white/60 flex-wrap justify-center">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm"><span className="text-base sm:text-lg">🅿️</span> PayPal</span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm"><span className="text-base sm:text-lg">🏦</span> PSE</span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm"><span className="text-base sm:text-lg">💳</span> Tarjeta</span>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── HERO ── */}
      <section id="hero" className="relative py-14 sm:py-20 md:py-28 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400/8 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-7xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={staggerItem} className="text-center mb-8 sm:mb-10">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-primary/20">
                🎉 ¡7 días de prueba completamente gratis!
              </span>
            </motion.div>

            {/* TWO-COLUMN: headline+flags LEFT — 3 steps RIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">

              {/* LEFT — headline + flags */}
              <motion.div variants={staggerItem} className="flex flex-col gap-6 sm:gap-8">
                <div>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                    <span className="italic text-foreground/70">&quot;Speak Up and</span><br />
                    <span className="text-primary">Stand Out</span><br />
                    <span className="italic text-foreground/70">with </span>
                    <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">BLANG&quot;</span>
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground font-medium mt-4 sm:mt-5">Aprende inglés desde ya 🌎</p>
                </div>

                {/* Diseñado para todos */}
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/70 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-3">✨ Diseñado para todo aquel que quiera aprender inglés desde su propia comodidad y tiempo</p>
                  <ul className="space-y-2.5">
                    {[
                      { icon: '📚', strong: 'Metodología intuitiva por unidades:', rest: ' todo el contenido está listo, solo estudia a tu ritmo y desde donde estés' },
                      { icon: '🎥', strong: 'Clases en vivo:', rest: ' servicio adicional disponible cuando lo desees, no incluido en el plan mensual' },
                      { icon: '🤖', strong: 'Práctica real con IA:', rest: ' usa prompts ya creados en ChatGPT para practicar escritura y speaking' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                        <span className="shrink-0 mt-0.5">{item.icon}</span>
                        <span><strong className="text-foreground">{item.strong}</strong>{item.rest}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground">🌟 ¡Sé parte de los primeros estudiantes de BLANG!</p>
              </motion.div>

              {/* RIGHT — 3 steps */}
              <motion.div variants={staggerItem} className="flex flex-col gap-3 sm:gap-4">
                <div className="mb-1">
                  <span className="inline-block bg-primary/10 text-primary text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest">🎯 Empieza en 3 pasos</span>
                </div>
                {[
                  { num: '01', emoji: '👤', title: 'Crea tu cuenta', desc: 'Regístrate gratis en segundos. Empieza con 7 días de prueba o activa tu plan mensual en minutos.', color: 'from-violet-500 to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-200/60' },
                  { num: '02', emoji: '📋', title: 'Elige tu nivel', desc: 'De A1 principiante a C1 avanzado. Empieza desde donde realmente estás.', color: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200/60' },
                  { num: '03', emoji: '🎓', title: '¡A aprender!', desc: 'Estudia una unidad por semana o avanza a tu propio ritmo, sin límites.', color: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200/60' },
                ].map((step) => (
                  <div key={step.num} className={`flex items-start gap-3 sm:gap-4 bg-gradient-to-br ${step.bg} border ${step.border} rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-white font-black text-base sm:text-lg">{step.num}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg sm:text-xl">{step.emoji}</span>
                        <h3 className="font-bold text-sm sm:text-base text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="mt-2 w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-white font-extrabold text-base sm:text-lg py-4 rounded-2xl transition-opacity shadow-lg shadow-primary/30"
                >
                  ¡Crear mi cuenta gratis! 🚀
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COURSES + METHODOLOGY combined ── */}
      <section id="cursos" className="py-14 sm:py-24">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <motion.div
            className="text-center mb-8 sm:mb-10"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={fadeInUp}
          >
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              📚 Nuestros Cursos
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3">Nuestros Cursos</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              5 niveles estructurados. Avanza a tu ritmo, <span className="font-semibold text-foreground">una unidad por semana</span>.
            </p>
          </motion.div>

          {/* Methodology strip */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="max-w-5xl mx-auto mb-10 sm:mb-14 bg-gradient-to-br from-primary/8 via-violet-50 to-purple-50 border-2 border-primary/25 rounded-3xl px-4 sm:px-10 py-6 sm:py-10 shadow-lg"
          >
            <div className="text-center mb-6 sm:mb-8">
              <span className="inline-block bg-primary/15 text-primary text-sm font-extrabold px-4 py-1.5 rounded-full mb-3">🧠 Nuestra metodología</span>
              <p className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-foreground">Metodología intuitiva</p>
              <p className="text-base sm:text-lg sm:text-xl font-bold text-primary mt-1">Ciclo de 5 pasos por cada unidad</p>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">Cada unidad sigue el mismo ciclo probado para que aprendas de forma natural y sin memorizar reglas</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {METHODOLOGY_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-2 sm:gap-3 bg-background/60 rounded-2xl p-3 sm:p-4 border border-border/30 shadow-sm">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl sm:text-3xl shadow-md`}>
                    {step.emoji}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-center leading-tight text-foreground">{step.title}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Paso {i + 1}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Course cards */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 max-w-7xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}
          >
            {COURSES.map((course) => (
              <motion.div
                key={course.id} variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`bg-gradient-to-br ${course.color} rounded-3xl p-5 sm:p-6 border hover:shadow-lg transition-all cursor-pointer flex flex-col`}
                onClick={() => onOpenAuth?.('register')}
              >
                <p className="text-3xl sm:text-4xl mb-3">{course.emoji}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${course.badge} mb-3 inline-block`}>
                  {course.level}
                </span>
                <h3 className="text-sm sm:text-base font-bold mb-2">{course.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">{course.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Language note */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
          >
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-sm font-medium text-green-700">
              🇪🇸 A1 y A2 — Explicaciones en español
            </div>
            <span className="text-muted-foreground font-bold hidden sm:block">→</span>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm font-medium text-blue-700">
              🇺🇸 B1 a C1 — 100% en inglés
            </div>
          </motion.div>

          {/* Saber más */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mt-6"
          >
            <button
              onClick={() => navigate(ROUTE_PATHS.METHODOLOGY)}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm sm:text-base group"
            >
              Saber más sobre nuestra metodología
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
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
                Desbloquear todos los módulos gratis
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-muted-foreground mt-3">7 días de prueba gratis · Sin tarjeta requerida</p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── CLASES 1 A 1 ── */}
      <section id="sesiones-vivo" className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}
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
                  { icon: '🗓️', title: 'Tú eliges el horario', desc: 'Reserva la sesión según la disponibilidad del docente, en los horarios disponibles.' },
                  { icon: '🎯', title: 'Temas a la medida', desc: 'Trabaja exactamente lo que necesitas: gramática, conversación, pronunciación, negocios...' },
                  { icon: '💻', title: 'Google Meet', desc: 'Sesiones cómodas por videollamada, desde cualquier lugar del mundo.' },
                  { icon: '🔓', title: 'Sin matrícula obligatoria', desc: 'No necesitas registrarte para reservar un cupo, puedes contratar este servicio cuando lo desees.' },
                  { icon: 'ℹ️', title: 'Servicio adicional', desc: 'Este servicio no está incluido en el plan mensual. Tiene un costo según las horas que desees. Si quieres agendar más horas o un paquete mensual escríbenos a blangenglishlearning@blangenglish.com' },
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
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl sm:text-2xl">👨‍🏫</div>
                      <div>
                        <p className="font-extrabold text-base sm:text-lg">Clase individual</p>
                        <p className="text-white/70 text-xs sm:text-sm">Con profesor nativo / bilingüe</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl sm:text-7xl font-black leading-none">$35,000</span>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6">COP por hora · Sin contratos</p>
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
                      onClick={() => navigate(ROUTE_PATHS.PRICING)}
                    >
                      Reservar sesión 📅
                    </Button>
                    <Button
                      size="lg"
                      className="w-full bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-sm sm:text-base py-4 sm:py-5 rounded-2xl transition-all active:scale-[0.98]"
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

      {/* ── PRICING REMINDER ── */}
      <section id="pricing" className="py-10 sm:py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
          >
            <button
              onClick={() => navigate(ROUTE_PATHS.PRICING)}
              className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-base sm:text-lg group"
            >
              Ver información completa sobre precios
              <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
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

                    {/* Autor */}
                    <div className="flex items-center gap-2.5 pt-1 border-t border-border/40">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm shrink-0">
                        {r.full_name ? r.full_name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-sm font-semibold text-foreground/80 leading-tight">
                        {r.full_name || 'Estudiante'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <ClasesVirtualesModal
        open={showClasesModal}
        onClose={() => setShowClasesModal(false)}
      />

    </Layout>
  );
}
