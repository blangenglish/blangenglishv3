// @ts-nocheck
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
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

interface EnglishHubProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

// Los 3 módulos de inglés, en el orden en que se muestran. Mismo sistema de
// diseño que las tarjetas del inicio (Home.tsx): misma tarjeta, solo cambian
// emoji, texto y ruta. Cada uno tiene su propia página para poder compartir
// el enlace directo.
const MODULES_STYLE = [
  { id: 'adults', emoji: '🎓', route: ROUTE_PATHS.ENGLISH_ADULTS },
  { id: 'teens', emoji: '🧑', route: ROUTE_PATHS.ENGLISH_TEENS },
  { id: 'kids', emoji: '🧒', route: ROUTE_PATHS.ENGLISH_KIDS },
];

export default function EnglishHub({ onOpenAuth }: EnglishHubProps) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const h = t.englishHub;
  const MODULES = MODULES_STYLE.map((m) => ({ ...m, ...h.modules[m.id] }));

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="minimal">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[300px] sm:w-[550px] h-[300px] sm:h-[550px] bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] bg-white/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-5 sm:mb-7">
              <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full border border-white/20 backdrop-blur">
                {h.badge}
              </span>
            </motion.div>
            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight"
            >
              {h.title}
            </motion.h1>
            <motion.p variants={staggerItem} className="text-base sm:text-xl text-white/80 max-w-xl mx-auto mt-5 sm:mt-6">
              {h.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── TARJETAS DE MÓDULO ── */}
      <section className="py-12 sm:py-16 -mt-8 sm:-mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {MODULES.map((m) => (
              <motion.div
                key={m.id}
                variants={staggerItem}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => navigate(m.route)}
                className="relative cursor-pointer bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all flex flex-col overflow-hidden"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#4C1D95] flex items-center justify-center text-3xl sm:text-4xl shadow-lg mb-5">
                  {m.emoji}
                </div>
                <h2 className="relative text-xl sm:text-2xl font-black text-foreground leading-tight">{m.title}</h2>
                <p className="relative text-sm font-semibold text-muted-foreground mb-3">{m.subtitle}</p>
                <p className="relative text-sm sm:text-base text-muted-foreground leading-relaxed flex-1 mb-6">{m.desc}</p>
                <Button
                  className="relative w-full rounded-xl py-5 sm:py-6 font-bold text-sm sm:text-base bg-[#111111] hover:bg-[#111111]/90 text-white transition-colors gap-2 shadow-lg"
                  onClick={(e) => { e.stopPropagation(); navigate(m.route); }}
                >
                  {h.cta}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <div className="max-w-6xl mx-auto mt-10 text-center">
            <Link
              to={ROUTE_PATHS.HOME}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {lang === 'en' ? 'Back to home' : 'Volver al inicio'}
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
}
