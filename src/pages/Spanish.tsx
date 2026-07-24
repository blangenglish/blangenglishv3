// @ts-nocheck
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { openWhatsApp } from '@/lib/whatsapp';

// ── PENDIENTE POR DEFINIR (no inventar, solo dejar nota) ──────────────────────
// 1. Precios reales del curso de Español para Extranjeros — por ahora el
//    bloque "Arma tu plan" muestra "Consultar" y el CTA lleva a WhatsApp.
// 2. Niveles reales del curso (¿misma escala A1–C1 que inglés, o una escala
//    propia?) — por ahora la sección de niveles queda en placeholder.
// 3. Si existen módulos especiales equivalentes a "English for you"
//    (Pronunciación, Contextos, Mundo Real, etc.) para español — por ahora
//    esta página no incluye esa sección.

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 30 } },
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

interface SpanishProgramProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

// Comprensión antes que producción: primero se entiende (leer/escuchar),
// luego se produce (hablar/escribir) — ajustar orden/nombres si el negocio
// define una secuencia distinta.
const STEPS = [
  {
    number: '01',
    emoji: '📖',
    title: 'Comprensión de lectura',
    color: 'from-orange-500 to-red-600',
    bg: 'from-orange-50 to-red-50 border-orange-200',
    tag: 'bg-orange-100 text-orange-700',
    desc: 'Empiezas por entender textos reales y graduales. Leer antes de producir te da el vocabulario y las estructuras que luego vas a usar.',
    details: [
      'Textos cortos adaptados a tu nivel',
      'Vocabulario nuevo resaltado con traducción',
      'Preguntas guía de comprensión',
      'Temas cotidianos y de cultura hispana',
    ],
  },
  {
    number: '02',
    emoji: '🎧',
    title: 'Comprensión auditiva',
    color: 'from-rose-500 to-pink-600',
    bg: 'from-rose-50 to-pink-50 border-rose-200',
    tag: 'bg-rose-100 text-rose-700',
    desc: 'Entrenas el oído con hablantes nativos en situaciones reales, antes de tener que hablar tú — así como aprenden los niños su lengua materna.',
    details: [
      'Audios con distintos acentos hispanos',
      'Velocidad ajustable para practicar',
      'Transcripciones para comparar',
      'Diálogos de la vida real',
    ],
  },
  {
    number: '03',
    emoji: '🗂️',
    title: 'Vocabulario',
    color: 'from-amber-500 to-orange-600',
    bg: 'from-amber-50 to-orange-50 border-amber-200',
    tag: 'bg-amber-100 text-amber-700',
    desc: 'Con la base de comprensión ya construida, consolidas el vocabulario y las estructuras que reconociste leyendo y escuchando.',
    details: [
      'Palabras agrupadas por temas prácticos',
      'Frases completas, no solo palabras sueltas',
      'Flashcards y repetición espaciada',
      'Pronunciación incluida en cada palabra',
    ],
  },
  {
    number: '04',
    emoji: '🗣️',
    title: 'Producción oral',
    color: 'from-red-500 to-rose-600',
    bg: 'from-red-50 to-rose-50 border-red-200',
    tag: 'bg-red-100 text-red-700',
    desc: 'Ahora que ya entiendes, empiezas a hablar: primero frases guiadas, luego conversación libre, con corrección de pronunciación.',
    details: [
      'Práctica guiada antes de conversación libre',
      'Corrección de pronunciación',
      'Situaciones cotidianas reales',
      'Sin miedo a equivocarte',
    ],
  },
  {
    number: '05',
    emoji: '✍️',
    title: 'Producción escrita',
    color: 'from-pink-500 to-fuchsia-600',
    bg: 'from-pink-50 to-fuchsia-50 border-pink-200',
    tag: 'bg-pink-100 text-pink-700',
    desc: 'El último paso: escribir con lo aprendido. Cierras el ciclo produciendo tu propio texto, con corrección y retroalimentación.',
    details: [
      'Ejercicios de escritura guiada',
      'Corrección de gramática y estilo',
      'Frases y párrafos según tu nivel',
      'Retroalimentación personalizada',
    ],
  },
];

export default function SpanishProgram({ onOpenAuth, isLoggedIn }: SpanishProgramProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const contactWhatsApp = () => {
    openWhatsApp('Hola! 🇪🇸 Quiero información sobre el curso de Español para Extranjeros (Spanish for Foreigners).');
  };

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="back">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-50 via-rose-50/60 to-background pointer-events-none" />

      {/* ── ENCABEZADO ── */}
      <section className="pt-12 sm:pt-16 pb-4">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-4">
              <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full border border-orange-200">
                🇪🇸 Español para extranjeros
              </span>
            </motion.div>
            <motion.h1 variants={staggerItem} className="text-3xl sm:text-5xl font-black text-foreground leading-tight">
              Aprende <span className="text-orange-600">español</span>
              <span className="text-muted-foreground"> / </span>
              <span className="italic text-muted-foreground">Learn Spanish</span>
            </motion.h1>
            <motion.p variants={staggerItem} className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mt-4">
              Metodología de inmersión: primero desarrollas comprensión (lectura y escucha), luego producción (habla y escritura).
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── ARMA TU PLAN — PRIMER BLOQUE DE CONTENIDO ── */}
      <section className="py-10 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full mb-4 sm:mb-5 border border-orange-200">
                📅 Arma tu plan
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground leading-tight mb-3 sm:mb-4">
                Clases <span className="text-orange-600">1 a 1</span> con nuestros profes
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto">
                Inmersión total, a tu horario y a tu ritmo
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">

              {/* Columna izquierda: beneficios */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-5">
                {[
                  { icon: '🗣️', title: 'Comprensión antes que producción', desc: 'Primero entiendes leyendo y escuchando, luego produces hablando y escribiendo — así se aprende una lengua de forma natural.' },
                  { icon: '🎯', title: 'A tu ritmo', desc: 'Contenido estructurado para avanzar según tu nivel real, sin saltarte pasos.' },
                  { icon: '💻', title: 'Google Meet', desc: 'Sesiones cómodas por videollamada, desde cualquier lugar del mundo.' },
                  { icon: '🔓', title: 'Sin matrícula obligatoria', desc: 'No necesitas estar matriculado en un curso para tomar clases en vivo.' },
                  { icon: 'ℹ️', title: 'Planes y precios muy pronto', desc: 'Estamos definiendo los planes del curso de Español para Extranjeros. Escríbenos por WhatsApp y te avisamos apenas estén listos.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-4 sm:gap-5 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm sm:text-base text-foreground mb-1">{item.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Columna derecha: tarjeta precio (placeholder) + CTA */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-6">
                <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-3xl p-5 sm:p-8 text-white shadow-2xl shadow-orange-500/30 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl sm:text-2xl">👩‍🏫</div>
                      <div>
                        <p className="font-extrabold text-base sm:text-lg">Clase individual</p>
                        <p className="text-white/70 text-xs sm:text-sm">Con profesor nativo / bilingüe</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl sm:text-5xl font-black leading-none">Consultar</span>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6">Precio próximamente · Escríbenos para más información</p>
                    <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8">
                      {[
                        '✓  Corrección en tiempo real',
                        '✓  Feedback personalizado',
                        '✓  Horario flexible',
                      ].map((f, i) => (
                        <li key={i} className="text-white/90 font-medium text-xs sm:text-sm">{f}</li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      className="w-full bg-white text-orange-600 hover:bg-white/90 font-extrabold text-base sm:text-lg py-5 sm:py-6 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
                      onClick={contactWhatsApp}
                    >
                      📩 Contáctanos por WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-3 sm:p-4 shadow-sm">
                  <span className="text-2xl sm:text-3xl">⭐</span>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-foreground">Profesores verificados</p>
                    <p className="text-xs text-muted-foreground">Nativos o bilingües con experiencia en enseñanza de español</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5 PASOS ── */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                El ciclo completo
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Los 5 pasos de la inmersión</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Primero comprensión, luego producción — así se aprende un idioma de forma natural.
              </p>
            </motion.div>

            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={i % 2 === 0 ? fadeLeft : fadeRight}
                  className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 items-center`}
                >
                  <div className={`flex-shrink-0 w-full md:w-64 rounded-3xl bg-gradient-to-br ${step.bg} border-2 p-8 flex flex-col items-center text-center shadow-sm`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl mb-3 shadow-lg`}>
                      {step.emoji}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${step.tag} mb-2`}>Paso {step.number}</span>
                    <h3 className="text-2xl font-extrabold">{step.title}</h3>
                  </div>

                  <div className="flex-1 bg-background/80 border border-border/40 rounded-3xl p-7 shadow-sm">
                    <p className="text-base text-muted-foreground leading-relaxed mb-5">{step.desc}</p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1 w-4 h-4 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 block" />
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

      {/* ── NIVELES (placeholder — aún no definidos) ── */}
      <section className="py-16 bg-orange-50/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-3xl shadow-lg mb-4">
              📊
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Niveles próximamente</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Estamos definiendo la escala de niveles del curso de Español para Extranjeros. En cuanto estén listos, los vas a ver acá con el mismo formato de tarjetas que usamos para inglés.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">🇪🇸</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              ¿Tienes preguntas?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-white/80 mb-8">
              Escríbenos por WhatsApp y te contamos todo sobre el curso de Español para Extranjeros.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 rounded-full font-bold px-10 py-6 text-lg"
                onClick={contactWhatsApp}
              >
                📩 Escríbenos por WhatsApp
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
