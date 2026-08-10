// @ts-nocheck
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';
import { openWhatsApp } from '@/lib/whatsapp';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 30 } },
};

interface EnglishAgeModuleProps {
  // 'teens' | 'kids' — 'adults' tiene su propia página (EnglishProgram).
  moduleId: string;
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

const EMOJI = { adults: '🎓', teens: '🧑', kids: '🧒' };

// Página de un módulo de inglés por edad. Hoy muestra la cabecera del módulo y
// un aviso de "en preparación": el contenido de Jóvenes y Niños está pendiente
// de definir. Cuando llegue, se añade debajo del bloque `soon` y se retira ese
// bloque, sin tocar rutas ni navegación.
export default function EnglishAgeModule({ moduleId, onOpenAuth }: EnglishAgeModuleProps) {
  const { lang } = useLanguage();
  const t = translations[lang];
  const h = t.englishHub;
  const mod = h.modules[moduleId];

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="minimal">

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* ── HERO DEL MÓDULO ── */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[300px] sm:w-[550px] h-[300px] sm:h-[550px] bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] bg-white/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="mb-6">
              <Link
                to={ROUTE_PATHS.ENGLISH_HUB}
                className="inline-flex items-center gap-1 text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {h.back.replace('← ', '')}
              </Link>
            </motion.div>
            <motion.div variants={staggerItem} className="mb-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-4xl sm:text-5xl shadow-lg">
                {EMOJI[moduleId]}
              </div>
            </motion.div>
            <motion.h1
              variants={staggerItem}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-none tracking-tight"
            >
              {mod.title}
            </motion.h1>
            <motion.p variants={staggerItem} className="text-sm sm:text-base font-bold text-violet-200 mt-3">
              {mod.subtitle}
            </motion.p>
            <motion.p variants={staggerItem} className="text-base sm:text-xl text-white/80 max-w-xl mx-auto mt-5">
              {mod.desc}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENIDO EN PREPARACIÓN ── */}
      <section className="py-12 sm:py-16 -mt-8 sm:-mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto bg-white border border-[#E5E7EB] rounded-3xl p-8 sm:p-10 shadow-lg text-center"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <span className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-violet-200">
              {h.soon.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-5 leading-tight">{h.soon.title}</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3">{h.soon.desc}</p>
            <Button
              className="w-full sm:w-auto mt-7 rounded-xl px-8 py-6 font-bold text-sm sm:text-base bg-[#111111] hover:bg-[#111111]/90 text-white transition-colors shadow-lg"
              onClick={() => openWhatsApp(
                lang === 'en'
                  ? `Hi! I'd like information about ${mod.title} at BLANG.`
                  : `Hola! Quiero información sobre ${mod.title} en BLANG.`,
              )}
            >
              {h.soon.cta}
            </Button>
          </motion.div>

          <div className="max-w-2xl mx-auto mt-10 text-center">
            <Link
              to={ROUTE_PATHS.ENGLISH_HUB}
              className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {h.back.replace('← ', '')}
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
}
