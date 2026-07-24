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

// Paleta limitada a blanco/negro/morado (Parte 7): cada tarjeta se diferencia
// por tono e intensidad dentro de esas 3 familias, no por colores distintos.
const PROGRAMS_STYLE = [
  { id: 'spanish', emoji: '🇪🇸', gradient: 'from-neutral-700 via-neutral-800 to-black', softBg: 'from-neutral-50 to-gray-100 border-neutral-300', route: ROUTE_PATHS.SPANISH },
  { id: 'kids', emoji: '🧒', gradient: 'from-violet-400 via-purple-500 to-violet-600', softBg: 'from-violet-50 to-purple-50 border-violet-200', route: ROUTE_PATHS.ENGLISH },
  { id: 'teens', emoji: '🧑', gradient: 'from-purple-600 via-violet-700 to-purple-800', softBg: 'from-purple-50 to-violet-100 border-purple-300', route: ROUTE_PATHS.ENGLISH },
  { id: 'adults', emoji: '🎓', gradient: 'from-primary via-violet-800 to-black', softBg: 'from-primary/5 to-purple-50 border-primary/30', route: ROUTE_PATHS.ENGLISH },
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

      {/* ── TARJETAS DE PROGRAMA ── */}
      <section className="py-12 sm:py-16 -mt-8 sm:-mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {PROGRAMS.map((p) => {
              // Para los 3 programas de inglés, llevamos el grupo de edad como query param
              // (?age=kids|teens|adults) para preseleccionarlo en "Arma tu plan mensual".
              const targetUrl = p.route === ROUTE_PATHS.ENGLISH ? `${p.route}?age=${p.id}` : p.route;
              return (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => navigate(targetUrl)}
                  className={`relative cursor-pointer bg-gradient-to-br ${p.softBg} border-2 rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all flex flex-col overflow-hidden`}
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/50 rounded-full blur-2xl pointer-events-none" />
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-3xl sm:text-4xl shadow-lg mb-5`}>
                    {p.emoji}
                  </div>
                  <h2 className="relative text-xl sm:text-2xl font-black text-foreground leading-tight">{p.title}</h2>
                  <p className="relative text-sm font-semibold text-muted-foreground mb-3">{p.subtitle}</p>
                  <p className="relative text-sm sm:text-base text-muted-foreground leading-relaxed flex-1 mb-6">{p.desc}</p>
                  <Button
                    className={`relative w-full rounded-xl py-5 sm:py-6 font-bold text-sm sm:text-base bg-gradient-to-r ${p.gradient} text-white hover:opacity-90 transition-opacity gap-2 shadow-lg`}
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

    </Layout>
  );
}
