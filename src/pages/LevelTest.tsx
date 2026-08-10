// @ts-nocheck
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import LevelQuiz from '@/components/LevelQuiz';
import type { AuthModal } from '@/lib/index';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } },
};

interface LevelTestProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

// Escala decorativa de niveles. Es la misma que se mostraba en la sección
// "Conoce tu nivel" dentro de la página de Inglés, que ahora vive aquí.
const LEVEL_SCALE = [
  { lv: 'A1', emoji: '🌱', from: 'from-violet-300', to: 'to-purple-400' },
  { lv: 'A2', emoji: '📗', from: 'from-violet-400', to: 'to-purple-500' },
  { lv: 'B1', emoji: '📘', from: 'from-purple-500', to: 'to-violet-600' },
  { lv: 'B2', emoji: '📙', from: 'from-violet-600', to: 'to-purple-800' },
  { lv: 'C1', emoji: '🏆', from: 'from-neutral-800', to: 'to-black' },
];

export default function LevelTest({ onOpenAuth, isLoggedIn }: LevelTestProps) {
  const { lang } = useLanguage();
  const t = translations[lang].english;

  // El test se abre solo al pulsar el botón, no al entrar: así el visitante
  // primero lee de qué se trata y cuánto dura.
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <Layout onOpenAuth={onOpenAuth} isLoggedIn={isLoggedIn} navMode="back">

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-violet-50 to-purple-50/60 pointer-events-none" />

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden" animate="visible" variants={stagger}
          >
            <motion.div variants={fadeUp}
              className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-primary p-1 shadow-xl shadow-purple-200"
            >
              <div className="rounded-[22px] bg-background/95 backdrop-blur px-6 sm:px-8 py-10 text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h1 className="text-2xl md:text-3xl font-extrabold mb-3">
                  {t.nivelTest.title}
                </h1>
                <p className="text-muted-foreground text-base mb-2 max-w-xl mx-auto">
                  {t.nivelTest.desc}
                </p>
                <p className="text-sm text-muted-foreground mb-7">
                  {t.nivelTest.meta}
                </p>

                <div className="flex gap-2 justify-center mb-8">
                  {LEVEL_SCALE.map(({ lv, emoji, from, to }) => (
                    <div key={lv} className={`flex-1 max-w-[80px] rounded-2xl bg-gradient-to-br ${from} ${to} py-3 text-center shadow-sm`}>
                      <p className="text-lg">{emoji}</p>
                      <p className="text-white font-black text-sm mt-0.5">{lv}</p>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="bg-[#111111] hover:bg-[#111111]/90 text-white rounded-full px-10 py-6 font-extrabold text-base shadow-lg transition-colors gap-2"
                  onClick={() => setQuizOpen(true)}
                >
                  {t.nivelTest.cta}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <LevelQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onRegister={() => onOpenAuth?.('register')}
      />

    </Layout>
  );
}
