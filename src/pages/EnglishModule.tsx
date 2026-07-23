// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Clock, BookOpen, Download, FileText, Headphones, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { MODULES } from '@/components/EnglishForYou';
import { ROUTE_PATHS } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';

const DB_MODULES = ['escritura', 'lectura', 'listening', 'gramatica', 'vocabulario'];
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/english-for-students`;

function storageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${STORAGE_BASE}/${path}`;
}

interface Section {
  id: string;
  module_id: string;
  title: string;
  rich_text: string | null;
  image_path: string | null;
  audio_path: string | null;
  pdf_path: string | null;
  sort_order: number;
}

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
  const isDBModule = DB_MODULES.includes(moduleSlug || '');

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isDBModule || !moduleSlug) return;
    setLoading(true);
    supabase
      .from('english_for_students_sections')
      .select('*')
      .eq('module_id', moduleSlug)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setSections(data as Section[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('english_for_students_sections load error', err);
        setLoading(false);
      });
  }, [moduleSlug, isDBModule]);

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
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute top-4 left-6 w-12 h-12 rounded-full bg-white/10" />
            <div className="absolute bottom-6 right-10 w-8 h-8 rounded-full bg-white/10" />
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

        {/* Contenido del módulo */}
        {isDBModule ? (
          loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Cargando contenido...</p>
            </motion.div>
          ) : sections.length === 0 ? (
            /* Placeholder "próximamente" cuando no hay contenido publicado */
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
          ) : (
            /* Secciones publicadas por el admin */
            <div className="space-y-6">
              {sections.map((section, i) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden"
                >
                  {/* Título de la sección */}
                  <div className="px-6 pt-6 pb-4 border-b border-border/40">
                    <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                  </div>

                  <div className="p-6 space-y-5">

                    {/* Texto enriquecido */}
                    {section.rich_text && (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: section.rich_text }}
                      />
                    )}

                    {/* Imagen */}
                    {section.image_path && (
                      <div className="rounded-xl overflow-hidden border border-border/40">
                        <img
                          src={storageUrl(section.image_path)}
                          alt={section.title}
                          className="w-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Audio */}
                    {section.audio_path && (
                      <div className="bg-muted/40 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Headphones className="w-4 h-4 text-primary" />
                          Audio
                        </div>
                        <audio
                          controls
                          className="w-full"
                          src={storageUrl(section.audio_path)}
                        >
                          Tu navegador no soporta la reproducción de audio.
                        </audio>
                      </div>
                    )}

                    {/* PDF */}
                    {section.pdf_path && (
                      <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <FileText className="w-4 h-4 text-primary" />
                            Worksheet / PDF
                          </div>
                          <a
                            href={storageUrl(section.pdf_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs">
                              <Download className="w-3.5 h-3.5" />
                              Descargar
                            </Button>
                          </a>
                        </div>
                        <iframe
                          src={`${storageUrl(section.pdf_path)}#toolbar=0`}
                          className="w-full rounded-lg border border-border/40"
                          style={{ height: '480px' }}
                          title={section.title}
                        />
                      </div>
                    )}

                  </div>
                </motion.div>
              ))}

              {/* Botones de navegación al final */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-4"
              >
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
              </motion.div>
            </div>
          )
        ) : (
          /* Módulos que no son DB (fonetica, mundo-real, etc.) — placeholder original */
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
        )}

      </div>
    </Layout>
  );
}
