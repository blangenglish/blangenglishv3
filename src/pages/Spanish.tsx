// @ts-nocheck
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ROUTE_PATHS, OPEN_PLAN_AFTER_AUTH_KEY, SPANISH_PLAN_FLAG } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { openWhatsApp } from '@/lib/whatsapp';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';

// ── PENDIENTE POR DEFINIR (no inventar, solo dejar nota) ──────────────────────
// 1. Esta tarjeta de precio pública sigue mostrando "Consultar" como copy de
//    marketing — desde la Parte 17 el precio real (USD, con profesor) sí
//    existe dentro de PlanEspanolModal.tsx, que se abre desde Dashboard tras
//    iniciar sesión/registrarse (ver botones del CTA abajo). No se actualizó
//    el copy de esta tarjeta porque la Parte 17 no lo pidió — solo el
//    comportamiento del formulario.
// 2. Niveles reales del curso (¿misma escala A1–C1 que inglés, o una escala
//    propia?) — por ahora la sección de niveles queda en placeholder.
// 3. Si existen módulos especiales equivalentes a "English for you"
//    (Pronunciación, Contextos, Mundo Real, etc.) para español — por ahora
//    esta página no incluye esa sección.
// 4. El 50% de descuento del primer mes (Parte 8) es exclusivo del curso de
//    inglés — confirmado en la Parte 17 que NUNCA aplica a español, bajo
//    ninguna circunstancia (no hay botón ni badge de descuento en
//    PlanEspanolModal.tsx).

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
// Paleta limitada a blanco/negro/morado (Parte 7): cada paso se diferencia por
// tono e intensidad dentro de esas 3 familias, no por colores distintos.
const STEPS_STYLE = [
  { number: '01', emoji: '📖', color: 'from-purple-500 to-violet-700', bg: 'from-purple-50 to-violet-50 border-purple-200', tag: 'bg-purple-100 text-purple-700' },
  { number: '02', emoji: '🎧', color: 'from-violet-600 to-purple-800', bg: 'from-violet-50 to-purple-100 border-violet-300', tag: 'bg-violet-200 text-violet-900' },
  { number: '03', emoji: '🗂️', color: 'from-neutral-600 to-neutral-800', bg: 'from-neutral-50 to-gray-100 border-neutral-300', tag: 'bg-neutral-200 text-neutral-800' },
  { number: '04', emoji: '🗣️', color: 'from-purple-700 to-black', bg: 'from-purple-100 to-neutral-100 border-purple-400', tag: 'bg-purple-900 text-white' },
  { number: '05', emoji: '✍️', color: 'from-neutral-800 to-black', bg: 'from-neutral-100 to-neutral-200 border-neutral-400', tag: 'bg-black text-white' },
];

export default function SpanishProgram({ onOpenAuth, isLoggedIn }: SpanishProgramProps) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang].spanish;
  const STEPS = STEPS_STYLE.map((s, i) => ({ ...s, ...t.cincoPasos.steps[i] }));

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const contactWhatsApp = () => {
    openWhatsApp(t.whatsappMessage);
  };

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="back">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-violet-50 via-purple-50/60 to-background pointer-events-none" />

      {/* ── ENCABEZADO ── */}
      <section className="pt-12 sm:pt-16 pb-4">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-4">
              <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full border border-violet-200">
                {t.header.badge}
              </span>
            </motion.div>
            {/* "Aprende español / Learn Spanish" es un título bilingüe intencional
                (mismo patrón que "Bienvenido/a / Welcome" en Home) — se mantiene
                siempre igual, sin importar el idioma de interfaz elegido. */}
            <motion.h1 variants={staggerItem} className="text-3xl sm:text-5xl font-black text-foreground leading-tight">
              Aprende <span className="text-violet-600">español</span>
              <span className="text-muted-foreground"> / </span>
              <span className="italic text-muted-foreground">Learn Spanish</span>
            </motion.h1>
            <motion.p variants={staggerItem} className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mt-4">
              {t.header.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── ARMA TU PLAN — PRIMER BLOQUE DE CONTENIDO ── */}
      <section className="py-10 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-neutral-100" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full mb-4 sm:mb-5 border border-violet-200">
                {t.armaTuPlan.badge}
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground leading-tight mb-3 sm:mb-4">
                {t.armaTuPlan.titlePre} <span className="text-violet-600">{t.armaTuPlan.titleHighlight}</span> {t.armaTuPlan.titlePost}
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-xl mx-auto">
                {t.armaTuPlan.subtitle}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">

              {/* Columna izquierda: beneficios */}
              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:gap-5">
                {['🗣️', '🎯', '💻', '🔓', 'ℹ️'].map((icon, i) => ({ icon, ...t.armaTuPlan.benefits[i] })).map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-4 sm:gap-5 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
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
                <div className="relative bg-gradient-to-br from-violet-500 via-violet-700 to-purple-700 rounded-3xl p-5 sm:p-8 text-white shadow-2xl shadow-violet-500/30 overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl sm:text-2xl">🔒</div>
                      <div>
                        <p className="font-extrabold text-base sm:text-lg">{t.armaTuPlan.priceCard.lockedTitle}</p>
                        <p className="text-white/70 text-xs sm:text-sm">{t.armaTuPlan.priceCard.lockedDesc}</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl sm:text-5xl font-black leading-none">{t.armaTuPlan.priceCard.priceLabel}</span>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6">{t.armaTuPlan.priceCard.per}</p>
                    <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8">
                      {t.armaTuPlan.priceCard.bullets.map((f, i) => (
                        <li key={i} className="text-white/90 font-medium text-xs sm:text-sm">✓  {f}</li>
                      ))}
                    </ul>
                    {/* Parte 17: registrarse/iniciar sesión ahora sí lleva directo al
                        armador de plan de español (PlanEspanolModal, abierto desde
                        Dashboard tras la autenticación) — mismo mecanismo que inglés
                        (Parte 8), señalizado con SPANISH_PLAN_FLAG en vez de un grupo
                        de edad. */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        size="lg"
                        className="flex-1 bg-[#111111] hover:bg-[#111111]/90 text-white font-extrabold text-sm sm:text-base py-5 sm:py-6 rounded-2xl shadow-xl transition-colors active:scale-[0.98]"
                        onClick={() => {
                          sessionStorage.setItem(OPEN_PLAN_AFTER_AUTH_KEY, SPANISH_PLAN_FLAG);
                          onOpenAuth?.('register');
                        }}
                      >
                        {t.armaTuPlan.priceCard.cta}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 border-white/40 text-white hover:bg-white/10 font-bold text-sm sm:text-base py-5 sm:py-6 rounded-2xl"
                        onClick={() => {
                          sessionStorage.setItem(OPEN_PLAN_AFTER_AUTH_KEY, SPANISH_PLAN_FLAG);
                          onOpenAuth?.('login');
                        }}
                      >
                        {t.armaTuPlan.priceCard.loginCta}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur border border-border/50 rounded-2xl p-3 sm:p-4 shadow-sm">
                  <span className="text-2xl sm:text-3xl">⭐</span>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-foreground">{t.armaTuPlan.trust.title}</p>
                    <p className="text-xs text-muted-foreground">{t.armaTuPlan.trust.desc}</p>
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
              <span className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                {t.cincoPasos.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{t.cincoPasos.title}</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {t.cincoPasos.subtitle}
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
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${step.tag} mb-2`}>{t.cincoPasos.pasoLabel} {step.number}</span>
                    <h3 className="text-2xl font-extrabold">{step.title}</h3>
                  </div>

                  <div className="flex-1 bg-background/80 border border-border/40 rounded-3xl p-7 shadow-sm">
                    <p className="text-base text-muted-foreground leading-relaxed mb-5">{step.desc}</p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1 w-4 h-4 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 block" />
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
      <section className="py-16 bg-violet-50/60">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-3xl shadow-lg mb-4">
              📊
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">{t.niveles.title}</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {t.niveles.desc}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-violet-700 to-purple-700" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">{t.ctaFinal.emoji}</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              {t.ctaFinal.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-white/80 mb-8">
              {t.ctaFinal.subtitle}
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button
                size="lg"
                className="bg-[#111111] hover:bg-[#111111]/90 text-white rounded-full font-bold px-10 py-6 text-lg shadow-lg transition-colors"
                onClick={contactWhatsApp}
              >
                {t.ctaFinal.cta}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
