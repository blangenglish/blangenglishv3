// @ts-nocheck
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';
import StudentReviews from '@/components/StudentReviews';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 30 } },
};

interface HomeProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

// Parte 9 — sistema de diseño: las tarjetas son estructuralmente idénticas
// (mismo fondo, radio, sombra, padding, ícono y botón). No hay degradados ni
// colores distintos por tarjeta — solo cambian el emoji, el texto y la ruta.
// PENDIENTE POR DEFINIR: cuál tarjeta/plan es la "Más popular" — hasta que se
// confirme, ninguna tarjeta lleva el badge/borde plateado o dorado de acento
// (ver también ClasesVirtualesModal.tsx para el mismo pendiente en los planes).
//
// El inicio ofrece los dos idiomas. Los 3 módulos de inglés (niños, jóvenes y
// adultos) ya no viven aquí: están un nivel más abajo, en /ingles.
const PROGRAMS_STYLE = [
  { id: 'spanish', emoji: '🇪🇸', route: ROUTE_PATHS.SPANISH },
  { id: 'english', emoji: '🇬🇧', route: ROUTE_PATHS.ENGLISH_HUB },
];

export default function Home({ onOpenAuth, isLoggedIn }: HomeProps) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const PROGRAMS = PROGRAMS_STYLE.map((p) => ({ ...p, ...t.welcome.programs[p.id] }));

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="minimal">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[300px] sm:w-[550px] h-[300px] sm:h-[550px] bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-5 sm:mb-7">
              <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full border border-white/20 backdrop-blur">
                {t.welcome.badge}
              </span>
            </motion.div>
            {/* "Bienvenido/a / Welcome" es un saludo bilingüe intencional (branding) y
                se muestra siempre igual, sin importar el idioma de interfaz elegido. */}
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight">
                Bienvenido/a
              </h1>
              <span className="hidden sm:block text-white/30 text-4xl md:text-5xl font-light">/</span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight">
                <span className="text-violet-200">Welcome</span>
              </h1>
            </motion.div>
            <motion.p variants={staggerItem} className="text-base sm:text-xl text-white/80 max-w-xl mx-auto mt-5 sm:mt-6">
              {t.welcome.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── BLOQUE DE MARCA ──
          Mismo bloque que estaba en la página de Inglés, pero aquí sin botón de
          registro: en el inicio la acción que buscamos es que elijan programa. */}
      <section className="relative pt-10 sm:pt-14 pb-2 sm:pb-4 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-neutral-300/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-5xl mx-auto text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-6">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-primary/20">
                {t.welcome.hero.badge}
              </span>
            </motion.div>

            <motion.div variants={staggerItem}>
              {/* Slogan de marca — se mantiene siempre en inglés, sin importar el idioma de interfaz.
                  Va en h2 y no en h1: el h1 de esta página es el "Bienvenido/a / Welcome" de arriba.
                  En una sola línea (sin <br />): en pantallas pequeñas el texto fluye solo. */}
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-balance">
                <span className="italic text-foreground/70">&quot;Speak Up and </span>
                <span className="text-primary">Stand Out </span>
                <span className="italic text-foreground/70">with </span>
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">BLANG&quot;</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground font-medium mt-4 sm:mt-5">
                {t.welcome.hero.subtitle}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TARJETAS DE PROGRAMA ──
          El margen negativo que subía las tarjetas sobre el hero morado ya no
          aplica: ahora entre los dos está el bloque de marca. */}
      <section className="py-12 sm:py-16 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {PROGRAMS.map((p) => {
              const targetUrl = p.route;
              return (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => navigate(targetUrl)}
                  className="relative cursor-pointer bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all flex flex-col overflow-hidden"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#4C1D95] flex items-center justify-center text-3xl sm:text-4xl shadow-lg mb-5">
                    {p.emoji}
                  </div>
                  <h2 className="relative text-xl sm:text-2xl font-black text-foreground leading-tight">{p.title}</h2>
                  <p className="relative text-sm font-semibold text-muted-foreground mb-3">{p.subtitle}</p>
                  <p className="relative text-sm sm:text-base text-muted-foreground leading-relaxed flex-1 mb-6">{p.desc}</p>
                  <Button
                    className="relative w-full rounded-xl py-5 sm:py-6 font-bold text-sm sm:text-base bg-[#111111] hover:bg-[#111111]/90 text-white transition-colors gap-2 shadow-lg"
                    onClick={(e) => { e.stopPropagation(); navigate(targetUrl); }}
                  >
                    {t.welcome.cta}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── RESEÑAS REALES ──
          Van debajo de las tarjetas: primero que elijan programa, y la prueba
          social después, como refuerzo. Si no hay reseñas publicadas, el
          componente no pinta nada. */}
      <StudentReviews limit={6} className="pb-16 sm:pb-20" />

    </Layout>
  );
}
