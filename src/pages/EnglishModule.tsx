// @ts-nocheck
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { MODULES } from '@/components/EnglishForYou';
import { ROUTE_PATHS } from '@/lib/index';

interface EnglishModuleProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: any) => void;
  onLogout?: () => void;
  userName?: string;
}

export default function EnglishModule({ isLoggedIn, onOpenAuth, onLogout, userName }: EnglishModuleProps) {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const navigate = useNavigate();

  const mod = MODULES.find((m) => m.slug === moduleSlug);

  // Si el slug no existe, redirigir al dashboard
  if (!mod) {
    return (
      <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <span className="text-5xl">🔍</span>
          <h1 className="text-2xl font-bold">Módulo no encontrado</h1>
          <Button onClick={() => navigate(ROUTE_PATHS.DASHBOARD)} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Botón volver */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <button
            onClick={() => navigate(ROUTE_PATHS.DASHBOARD + '?tab=english')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a English for you!
          </button>
        </motion.div>

        {/* Hero del módulo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl overflow-hidden border border-border/50 shadow-lg"
        >
          {/* Banner con gradiente */}
          <div className={`relative h-52 bg-gradient-to-br ${mod.gradient} flex items-center justify-center overflow-hidden`}>
            {/* Círculos decorativos */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute top-4 left-6 w-12 h-12 rounded-full bg-white/10" />
            <div className="absolute bottom-6 right-10 w-8 h-8 rounded-full bg-white/10" />
            {/* Emoji + título */}
            <div className="text-center z-10">
              <span className="text-7xl drop-shadow-lg block mb-3">{mod.emoji}</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md px-4">
                {mod.title}
              </h1>
            </div>
          </div>

          {/* Contenido inferior */}
          <div className={`bg-gradient-to-br ${mod.cardBg} p-6 md:p-8`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${mod.badge}`}>
                {mod.category}
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-base text-foreground/80 leading-relaxed">
              {mod.description}
            </p>
          </div>
        </motion.div>

        {/* Sección "Próximamente" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-background rounded-2xl border border-border/50 p-8 shadow-sm text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">¡Contenido en camino! 🚀</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Estamos preparando lecciones, ejercicios y recursos especialmente diseñados para este módulo. Pronto tendrás acceso completo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => navigate(ROUTE_PATHS.DASHBOARD + '?tab=english')}
              variant="outline"
              className="rounded-xl border-primary/30 text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Explorar más módulos
            </Button>
            <Button
              onClick={() => navigate(ROUTE_PATHS.DASHBOARD)}
              className="rounded-xl"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Ir a Mis Cursos
            </Button>
          </div>
        </motion.div>

      </div>
    </Layout>
  );
}
