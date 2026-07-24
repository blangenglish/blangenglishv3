// @ts-nocheck
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';

interface SpanishProgramProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

export default function SpanishProgram({ onOpenAuth, isLoggedIn }: SpanishProgramProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="back">

      {/* PAGE BG */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-50 via-rose-50/60 to-background pointer-events-none" />

      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-xl mx-auto text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 flex items-center justify-center text-4xl sm:text-5xl shadow-lg mb-6">
              🇪🇸
            </div>
            <span className="inline-block bg-orange-100 text-orange-700 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Español para extranjeros
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight mb-4">
              ¡Muy pronto! 🚧
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
              Estamos preparando el programa de Español para Extranjeros — inmersión total, con comprensión primero (lectura y escucha) y producción después (habla y escritura). Vuelve pronto para conocer los detalles.
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 py-6 font-bold gap-2"
              onClick={() => navigate(ROUTE_PATHS.HOME)}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al menú principal
            </Button>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
}
