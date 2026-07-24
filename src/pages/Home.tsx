// @ts-nocheck
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';

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

const PROGRAMS = [
  {
    id: 'spanish',
    emoji: '🇪🇸',
    title: 'Español para extranjeros',
    subtitle: 'Spanish for Foreigners',
    desc: 'Aprende español bajo inmersión. Metodología que desarrolla primero comprensión (lectura y escucha) y luego producción (habla y escritura).',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    softBg: 'from-orange-50 to-rose-50 border-orange-200',
    route: ROUTE_PATHS.SPANISH,
  },
  {
    id: 'kids',
    emoji: '🧒',
    title: 'Inglés para niños',
    subtitle: '8–13 años',
    desc: 'Aprendizaje divertido y visual, con juegos, canciones e historias cortas. Sesiones breves, vocabulario básico a través del juego.',
    gradient: 'from-teal-500 via-cyan-500 to-sky-600',
    softBg: 'from-teal-50 to-sky-50 border-teal-200',
    route: ROUTE_PATHS.ENGLISH,
  },
  {
    id: 'teens',
    emoji: '🧑',
    title: 'Inglés jóvenes',
    subtitle: '14–17 años',
    desc: 'Conversación real, preparación académica y vocabulario para exámenes o intercambios. Contenido dinámico y social.',
    gradient: 'from-fuchsia-500 via-purple-500 to-violet-600',
    softBg: 'from-fuchsia-50 to-violet-50 border-fuchsia-200',
    route: ROUTE_PATHS.ENGLISH,
  },
  {
    id: 'adults',
    emoji: '🎓',
    title: 'Inglés para adultos',
    subtitle: 'Todos los niveles',
    desc: 'Metodología por niveles (A1–C1), práctica con IA, clases en vivo opcionales, horario flexible.',
    gradient: 'from-primary via-violet-600 to-purple-700',
    softBg: 'from-primary/5 to-purple-50 border-primary/30',
    route: ROUTE_PATHS.ENGLISH,
  },
];

export default function Home({ onOpenAuth, isLoggedIn }: HomeProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="minimal">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      <section className="py-14 sm:py-20 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden" animate="visible" variants={staggerContainer}
          >
            {/* Título */}
            <motion.div variants={staggerItem} className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full mb-4 sm:mb-5 border border-primary/20">
                👋 BLANG Academy
              </span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-foreground leading-tight mb-3">
                Bienvenido/a
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground font-medium italic">Welcome</p>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mt-4">
                Elige el programa que mejor se adapte a ti
              </p>
            </motion.div>

            {/* Tarjetas de programa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {PROGRAMS.map((p) => (
                <motion.div
                  key={p.id}
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => navigate(p.route)}
                  className={`relative cursor-pointer bg-gradient-to-br ${p.softBg} border-2 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all flex flex-col`}
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-3xl sm:text-4xl shadow-lg mb-5`}>
                    {p.emoji}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{p.title}</h2>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">{p.subtitle}</p>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed flex-1 mb-6">{p.desc}</p>
                  <Button
                    className={`w-full rounded-xl py-5 sm:py-6 font-bold text-sm sm:text-base bg-gradient-to-r ${p.gradient} text-white hover:opacity-90 transition-opacity gap-2`}
                    onClick={(e) => { e.stopPropagation(); navigate(p.route); }}
                  >
                    Conoce precios
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
