// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronRight, Star, Lock, Sparkles } from 'lucide-react';
import { ROUTE_PATHS, OPEN_PLAN_AFTER_AUTH_KEY } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import { MODULES } from '@/components/EnglishForYou';
import { MUNDO_REAL_TOPICS } from '@/pages/MundoRealData';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';

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

// Paleta limitada a blanco/negro/morado (Parte 7): cada paso/nivel se diferencia
// por tono e intensidad dentro de esas 3 familias, no por colores distintos.
const STEPS_STYLE = [
  { number: '01', emoji: '📚', color: 'from-violet-400 to-purple-500', bg: 'from-violet-50 to-purple-50 border-violet-200', tag: 'bg-violet-100 text-violet-700' },
  { number: '02', emoji: '📖', color: 'from-purple-500 to-violet-700', bg: 'from-purple-50 to-violet-100 border-purple-200', tag: 'bg-purple-100 text-purple-700' },
  { number: '03', emoji: '📰', color: 'from-neutral-600 to-neutral-800', bg: 'from-neutral-50 to-gray-100 border-neutral-300', tag: 'bg-neutral-200 text-neutral-800' },
  { number: '04', emoji: '🎧', color: 'from-violet-600 to-purple-800', bg: 'from-violet-100 to-purple-100 border-violet-300', tag: 'bg-violet-200 text-violet-900' },
  { number: '05', emoji: '🤖', color: 'from-neutral-800 to-black', bg: 'from-neutral-100 to-neutral-200 border-neutral-400', tag: 'bg-neutral-900 text-white' },
];

const UNITS_STYLE = [{ emoji: '📅' }, { emoji: '🔁' }, { emoji: '🎯' }, { emoji: '🌍' }];

const LEVELS_STYLE = [
  { level: 'A1', emoji: '🌱', units: 27, color: 'bg-violet-50 text-violet-700 border-violet-200', langColor: 'bg-violet-50 text-violet-600' },
  { level: 'A2', emoji: '📗', units: 5, color: 'bg-purple-100 text-purple-700 border-purple-200', langColor: 'bg-purple-50 text-purple-600' },
  { level: 'B1', emoji: '📘', units: 10, color: 'bg-violet-200 text-violet-800 border-violet-300', langColor: 'bg-violet-100 text-violet-700' },
  { level: 'B2', emoji: '📙', units: 13, color: 'bg-purple-300 text-purple-900 border-purple-400', langColor: 'bg-purple-100 text-purple-800' },
  { level: 'C1', emoji: '🏆', units: 15, color: 'bg-neutral-800 text-white border-neutral-900', langColor: 'bg-neutral-200 text-neutral-900' },
];

const VALID_AGE_GROUPS = ['kids', 'teens', 'adults'];

// ── Promoción: 25% de descuento en el primer mes del plan de cursos ──────────
// (reemplaza la prueba gratis; Parte 8 no la modifica — sigue siendo la promo
// de registro para el plan base de cursos, mostrada en el CTA final).
// Parte 24: bajó de 50% a 25% — se paga el 75% del precio, no la mitad.
const PRECIO_MENSUAL_COP = 60000;
const PRECIO_MENSUAL_USD = 16;
const PRECIO_MENSUAL_COP_DESC = Math.round(PRECIO_MENSUAL_COP * 0.75);
const PRECIO_MENSUAL_USD_DESC = Math.round(PRECIO_MENSUAL_USD * 0.75 * 100) / 100;
// "Desde $37,500 COP/clase" es el mismo precio de referencia que ya se mostraba
// en esta tarjeta antes de la promoción — no es un precio nuevo inventado. Desde
// la Parte 8, el 25% de descuento del primer mes de "Arma tu plan" (clases en
// vivo) ya no se muestra acá de forma pública: se convirtió en el botón
// "Primer mes 25%" dentro del modal, disponible solo una vez por cuenta
// (ver ClasesVirtualesModal.tsx).
const PRECIO_CLASE_BASE = 37500;

export default function EnglishProgram({ onOpenAuth, isLoggedIn }: EnglishProgramProps) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].english;
  const STEPS = STEPS_STYLE.map((s, i) => ({ ...s, ...t.cincoPasos.steps[i] }));
  const UNITS = UNITS_STYLE.map((u, i) => ({ ...u, ...t.comoFunciona.units[i] }));
  const LEVELS = LEVELS_STYLE.map((lv, i) => ({ ...lv, ...t.niveles.levels[i] }));
  const FAQ = t.faq;
  const [searchParams] = useSearchParams();
  // Esta página es el módulo de Inglés para adultos (/ingles/adultos). El parámetro
  // ?age=kids|teens|adults se sigue aceptando por si llega desde un enlace antiguo;
  // sin él queda sin preseleccionar y el modal usa 'adults' por defecto.
  const ageParam = searchParams.get('age');
  const initialAgeGroup = VALID_AGE_GROUPS.includes(ageParam) ? (ageParam as 'kids' | 'teens' | 'adults') : undefined;
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

      {/* ── PLANES — PRIMER BLOQUE ──
          Reemplaza al antiguo bloque de "Clases 1 a 1". Las tres tarjetas salen
          de t.planes.items: para cambiar textos se edita translations.ts, no
          este archivo. El acceso a English for You es igual en los tres, así
          que va aparte al pie de cada tarjeta y no repetido en la lista. */}
      <section id="planes" className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-gray-100" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full mb-4 sm:mb-5 border border-primary/20">
                {t.planes.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
                {t.planes.title}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {t.planes.subtitle}
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {t.planes.items.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  variants={fadeInUp}
                  className={`bg-background/90 border-2 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-shadow flex flex-col ${
                    i === t.planes.items.length - 1
                      ? 'border-primary sm:col-span-2 lg:col-span-1'
                      : 'border-border/50'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#4C1D95] flex items-center justify-center text-2xl shadow-lg mb-4">
                    {plan.emoji}
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full inline-block w-fit mb-2">
                    {plan.tag}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">{plan.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-5">{plan.desc}</p>

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <span className="mt-1 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                        </span>
                        <span className="text-sm text-foreground/80 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-muted-foreground leading-snug border-t border-border/50 mt-5 pt-4">
                    {t.planes.englishForYou}
                  </p>

                  <Button
                    className="w-full mt-5 rounded-xl py-5 font-bold text-sm bg-[#111111] hover:bg-[#111111]/90 text-white transition-colors gap-2 shadow-lg"
                    onClick={() => onOpenAuth?.('register')}
                  >
                    {t.planes.cta}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* El bloque de marca "Speak Up and Stand Out with BLANG" vivía aquí.
          Ahora está solo en el inicio (Home.tsx): en esta página el visitante
          ya eligió idioma y módulo, así que lo que necesita son los planes. */}

      {/* ── CÓMO FUNCIONA (4 pilares) ── */}
      <section className="py-16 bg-white/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t.comoFunciona.title}</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t.comoFunciona.subtitlePre}<strong className="text-foreground">{t.comoFunciona.subtitleStrong}</strong>{t.comoFunciona.subtitlePost}</p>
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
                {t.cincoPasos.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t.cincoPasos.title}</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {t.cincoPasos.subtitle}
              </p>
            </motion.div>

            {/* Dos columnas: antes era una lista en zigzag a todo el ancho, que
                alargaba mucho la página. Cada paso es ahora una tarjeta entera
                (cabecera + descripción + detalles) y las tarjetas se apilan de
                dos en dos. Con 5 pasos, el último ocupa las dos columnas. */}
            <div className="grid sm:grid-cols-2 gap-5">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  className={`bg-background/80 border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col ${
                    i === STEPS.length - 1 && STEPS.length % 2 === 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  {/* Cabecera del paso */}
                  <div className={`flex items-center gap-4 rounded-2xl bg-gradient-to-br ${step.bg} border-2 p-4 mb-5`}>
                    <div className={`w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {step.emoji}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${step.tag} inline-block mb-1`}>
                        {t.cincoPasos.pasoLabel} {step.number}
                      </span>
                      <h3 className="text-xl font-extrabold leading-tight">{step.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>
                  <ul className={`grid gap-2 ${i === STEPS.length - 1 && STEPS.length % 2 === 1 ? 'sm:grid-cols-2' : ''}`}>
                    {step.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-1 w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                        </span>
                        <span className="text-sm text-foreground/80">{d}</span>
                      </li>
                    ))}
                  </ul>
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
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t.niveles.title}</h2>
              <p className="text-muted-foreground text-lg">{t.niveles.subtitle}</p>
            </motion.div>

            {/* Language transition note */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-5 py-2">
                <span className="text-sm font-semibold text-violet-700">{t.niveles.esBadge}</span>
              </div>
              <span className="text-muted-foreground font-bold text-lg hidden sm:block">→</span>
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-900 rounded-full px-5 py-2">
                <span className="text-sm font-semibold text-white">{t.niveles.enBadge}</span>
              </div>
            </motion.div>

            {/* Dos columnas en vez de cinco en fila: a 5 por fila las tarjetas
                quedaban estrechas y el texto ilegible. El último curso (C1)
                ocupa las dos columnas para que no quede una tarjeta suelta. */}
            <motion.div variants={stagger} className="grid sm:grid-cols-2 gap-4">
              {LEVELS.map((lv, i) => (
                <motion.div key={lv.level} variants={fadeUp}
                  className={`rounded-2xl border-2 p-5 bg-background/80 hover:shadow-md transition-shadow flex flex-col cursor-pointer ${lv.color} ${
                    i === LEVELS.length - 1 && LEVELS.length % 2 === 1 ? 'sm:col-span-2' : ''
                  }`}
                  onClick={() => onOpenAuth?.('register')}
                >
                  <div className="text-3xl mb-2">{lv.emoji}</div>
                  <span className="text-xs font-bold uppercase tracking-wide">{lv.level}</span>
                  <h3 className="font-bold text-base mt-0.5 mb-1">{lv.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug mb-3 flex-1">{lv.desc}</p>
                  <span className="text-xs font-semibold block mb-2">{lv.units} {t.niveles.unidadesSuffix}</span>
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
                <Sparkles className="w-3.5 h-3.5" /> {t.englishForYou.badge}
              </span>
              {/* "English for you!" es el nombre de marca de este módulo — se mantiene en inglés siempre */}
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
                English for <span className="text-primary">you!</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
                {t.englishForYou.subtitle}
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
                  {t.englishForYou.accessBanner}
                </p>
              </div>
              <button
                onClick={() => onOpenAuth?.('register')}
                className="shrink-0 bg-[#111111] hover:bg-[#111111]/90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-colors whitespace-nowrap"
              >
                {t.englishForYou.accessCta}
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
                          <p className="text-xs font-semibold text-muted-foreground">{t.englishForYou.comingSoon}</p>
                          <p className="text-[11px] text-muted-foreground/60">{t.englishForYou.comingSoonSub}</p>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col gap-2">

                          {/* ── Primer elemento: visible (preview) ── */}
                          <div className="rounded-xl bg-background/70 border border-border/40 p-3 flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                              <span className="text-primary text-sm font-black mt-0.5 shrink-0">✓</span>
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
                        className="mt-auto w-full rounded-xl bg-[#111111] hover:bg-[#111111]/90 text-white font-semibold text-sm py-2.5 shadow-sm hover:shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {t.englishForYou.unlockCta}
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
                className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#111111]/90 text-white font-extrabold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-lg transition-colors"
              >
                {t.englishForYou.finalCta}
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-muted-foreground mt-3">{t.englishForYou.finalSub}</p>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* El test "Conoce tu nivel de inglés" vivía aquí. Ahora tiene su propia
          página (/nivel-ingles), enlazada desde el botón de la barra superior,
          para que se pueda compartir el enlace suelto. */}

      {/* ── CÓMO FUNCIONA EL PAGO ── */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                {t.comoFuncionaPago.badge}
              </span>
              <h2 className="text-3xl font-bold">{t.comoFuncionaPago.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{t.comoFuncionaPago.subtitle}</p>
            </motion.div>
            <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5">
              {['📝', '💬', '🚀'].map((icon, i) => ({ icon, step: String(i + 1), ...t.comoFuncionaPago.steps[i] })).map(({ icon, step, title, desc }) => (
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
                {t.comoFuncionaPago.whatsappPrefix}{' '}
                <a href="https://wa.me/573236405246" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                  {t.comoFuncionaPago.whatsappLink}
                </a>
                {' '}{t.comoFuncionaPago.whatsappSuffix}
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
              <h2 className="text-3xl font-bold">{t.faqTitle}</h2>
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
                <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-violet-200">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" /> {t.reviews.badge}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  {t.reviews.titlePre}<span className="text-primary">{t.reviews.titleHighlight}</span>{t.reviews.titlePost}
                </h2>
                <p className="text-muted-foreground text-base max-w-xl mx-auto">
                  {t.reviews.subtitle}
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
                          className={`w-4 h-4 ${s <= r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`}
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
                        {t.reviews.anonName}
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-700 to-black" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-2xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">{t.ctaFinal.emoji}</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              {t.ctaFinal.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8">
              {t.ctaFinal.subtitle(PRECIO_MENSUAL_USD_DESC, PRECIO_MENSUAL_COP_DESC)}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg"
                className="bg-[#111111] hover:bg-[#111111]/90 text-white rounded-full font-bold px-10 py-6 text-lg shadow-lg transition-colors"
                onClick={() => onOpenAuth?.('register')}
              >
                {t.ctaFinal.register}
              </Button>
              <Button size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 rounded-full px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('login')}
              >
                {t.ctaFinal.login}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
