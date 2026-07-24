// @ts-nocheck
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Paleta limitada a blanco/negro/morado (Parte 7): cada módulo se diferencia por
// tono e intensidad dentro de esas 3 familias, no por colores distintos.
const MODULES = [
  {
    slug: 'fonetica',
    title: 'Aprende Fonética',
    description: 'Domina los sonidos del inglés, mejora tu pronunciación y habla con confianza desde el primer día.',
    category: 'Pronunciación',
    emoji: '🔊',
    gradient: 'from-violet-300 via-violet-400 to-purple-400',
    cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
    badge: 'bg-violet-100 text-violet-700',
    ring: 'ring-violet-200',
  },
  {
    slug: 'mundo-real',
    title: 'Inglés para el Mundo Real',
    description: 'Situaciones cotidianas: compras, salud, transporte y más. Inglés que realmente usas cada día.',
    category: 'Contextos',
    emoji: '🌍',
    gradient: 'from-purple-400 via-purple-500 to-violet-600',
    cardBg: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
    badge: 'bg-purple-100 text-purple-700',
    ring: 'ring-purple-200',
  },
  {
    slug: 'escritura',
    title: 'Habilidades de Escritura',
    description: 'Redacta textos claros, emails profesionales y mensajes naturales en inglés.',
    category: 'Habilidades',
    emoji: '✍️',
    gradient: 'from-violet-500 via-purple-600 to-violet-700',
    cardBg: 'from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40',
    badge: 'bg-violet-200 text-violet-800',
    ring: 'ring-violet-300',
  },
  {
    slug: 'lectura',
    title: 'Habilidades de Lectura',
    description: 'Comprende textos, artículos y materiales auténticos en inglés con técnicas efectivas.',
    category: 'Habilidades',
    emoji: '📖',
    gradient: 'from-neutral-400 via-neutral-500 to-neutral-600',
    cardBg: 'from-neutral-50 to-gray-100 dark:from-neutral-900/40 dark:to-neutral-800/40',
    badge: 'bg-neutral-200 text-neutral-800',
    ring: 'ring-neutral-300',
  },
  {
    slug: 'gramatica',
    title: 'Habilidades de Gramática',
    description: 'Refuerza las estructuras del inglés con ejercicios prácticos y explicaciones claras.',
    category: 'Habilidades',
    emoji: '📝',
    gradient: 'from-purple-600 via-violet-700 to-purple-800',
    cardBg: 'from-purple-100 to-violet-100 dark:from-purple-950/40 dark:to-violet-950/40',
    badge: 'bg-purple-200 text-purple-900',
    ring: 'ring-purple-300',
  },
  {
    slug: 'listening',
    title: 'Habilidades de Listening',
    description: 'Entrena tu oído con audios y conversaciones reales para entender el inglés como nativo.',
    category: 'Habilidades',
    emoji: '🎧',
    gradient: 'from-neutral-600 via-neutral-700 to-neutral-900',
    cardBg: 'from-neutral-100 to-neutral-200 dark:from-neutral-900/50 dark:to-neutral-800/50',
    badge: 'bg-neutral-300 text-neutral-900',
    ring: 'ring-neutral-400',
  },
  {
    slug: 'clases-en-vivo',
    title: 'Clases en Vivo',
    description: 'Practica el habla con instructores en tiempo real y mejora tu fluidez en conversación real.',
    category: 'En Vivo',
    emoji: '🎙️',
    gradient: 'from-violet-700 via-purple-800 to-black',
    cardBg: 'from-violet-100 to-neutral-100 dark:from-violet-950/50 dark:to-neutral-900/50',
    badge: 'bg-neutral-800 text-white',
    ring: 'ring-neutral-500',
  },
  {
    slug: 'vocabulario',
    title: 'Mejora tu Vocabulario',
    description: 'Expande tus palabras con ejercicios interactivos y aprende las más usadas en el inglés real.',
    category: 'Vocabulario',
    emoji: '📚',
    gradient: 'from-neutral-800 via-neutral-900 to-black',
    cardBg: 'from-neutral-200 to-neutral-300 dark:from-neutral-900/60 dark:to-black/40',
    badge: 'bg-black text-white',
    ring: 'ring-neutral-600',
  },
];

export function EnglishForYou({ onMundoReal, onClasesEnVivo }: { onMundoReal?: () => void; onClasesEnVivo?: () => void }) {
  const navigate = useNavigate();

  const handleClick = (slug: string) => {
    if (slug === 'fonetica') { navigate('/phonetics'); return; }
    if (slug === 'mundo-real' && onMundoReal) { onMundoReal(); return; }
    if (slug === 'clases-en-vivo' && onClasesEnVivo) { onClasesEnVivo(); return; }
    navigate(`/english/${slug}`);
  };

  return (
    <motion.div
      key="english"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-extrabold">English for you!</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Explora nuestros módulos de aprendizaje y lleva tu inglés al siguiente nivel.
        </p>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULES.map((mod, i) => (
          <motion.div
            key={mod.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`
              group relative rounded-2xl overflow-hidden border border-border/50
              bg-gradient-to-br ${mod.cardBg}
              shadow-sm hover:shadow-xl transition-shadow duration-300
              ring-1 ${mod.ring} ring-offset-0
              flex flex-col cursor-pointer
            `}
            onClick={() => handleClick(mod.slug)}
          >
            {/* Imagen / gradiente superior */}
            <div className={`relative h-36 bg-gradient-to-br ${mod.gradient} flex items-center justify-center overflow-hidden`}>
              {/* Círculos decorativos de fondo */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
              <div className="absolute top-2 left-3 w-8 h-8 rounded-full bg-white/10" />
              {/* Emoji central */}
              <span className="text-5xl drop-shadow-md select-none z-10">{mod.emoji}</span>
            </div>

            {/* Contenido */}
            <div className="flex flex-col flex-1 p-4 gap-2">
              {/* Badge de categoría */}
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit ${mod.badge}`}>
                {mod.category}
              </span>

              {/* Título */}
              <h3 className="font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors">
                {mod.title}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {mod.description}
              </p>

              {/* Botón Ingresa */}
              <Button
                className={`mt-2 w-full rounded-xl bg-gradient-to-r ${mod.gradient} text-white font-semibold shadow-sm hover:shadow-md hover:opacity-90 transition-all border-0`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(mod.slug);
                }}
              >
                Ingresa
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export { MODULES };
