// @ts-nocheck
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODULES = [
  {
    slug: 'fonetica',
    title: 'Aprende Fonética',
    description: 'Domina los sonidos del inglés, mejora tu pronunciación y habla con confianza desde el primer día.',
    category: 'Pronunciación',
    emoji: '🔊',
    gradient: 'from-blue-500 via-blue-400 to-cyan-400',
    cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'ring-blue-200',
  },
  {
    slug: 'mundo-real',
    title: 'Inglés para el Mundo Real',
    description: 'Situaciones cotidianas: compras, salud, transporte y más. Inglés que realmente usas cada día.',
    category: 'Contextos',
    emoji: '🌍',
    gradient: 'from-emerald-500 via-green-400 to-teal-400',
    cardBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'ring-emerald-200',
  },
  {
    slug: 'escritura',
    title: 'Habilidades de Escritura',
    description: 'Redacta textos claros, emails profesionales y mensajes naturales en inglés.',
    category: 'Habilidades',
    emoji: '✍️',
    gradient: 'from-violet-500 via-purple-400 to-fuchsia-400',
    cardBg: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30',
    badge: 'bg-violet-100 text-violet-700',
    ring: 'ring-violet-200',
  },
  {
    slug: 'lectura',
    title: 'Habilidades de Lectura',
    description: 'Comprende textos, artículos y materiales auténticos en inglés con técnicas efectivas.',
    category: 'Habilidades',
    emoji: '📖',
    gradient: 'from-amber-500 via-yellow-400 to-orange-400',
    cardBg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    badge: 'bg-amber-100 text-amber-700',
    ring: 'ring-amber-200',
  },
  {
    slug: 'gramatica',
    title: 'Habilidades de Gramática',
    description: 'Refuerza las estructuras del inglés con ejercicios prácticos y explicaciones claras.',
    category: 'Habilidades',
    emoji: '📝',
    gradient: 'from-pink-500 via-rose-400 to-red-400',
    cardBg: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    badge: 'bg-pink-100 text-pink-700',
    ring: 'ring-pink-200',
  },
  {
    slug: 'listening',
    title: 'Habilidades de Listening',
    description: 'Entrena tu oído con audios y conversaciones reales para entender el inglés como nativo.',
    category: 'Habilidades',
    emoji: '🎧',
    gradient: 'from-orange-500 via-amber-400 to-yellow-400',
    cardBg: 'from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30',
    badge: 'bg-orange-100 text-orange-700',
    ring: 'ring-orange-200',
  },
  {
    slug: 'clases-en-vivo',
    title: 'Clases en Vivo',
    description: 'Practica el habla con instructores en tiempo real y mejora tu fluidez en conversación real.',
    category: 'En Vivo',
    emoji: '🎙️',
    gradient: 'from-red-500 via-rose-500 to-pink-500',
    cardBg: 'from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30',
    badge: 'bg-red-100 text-red-700',
    ring: 'ring-red-200',
  },
  {
    slug: 'vocabulario',
    title: 'Mejora tu Vocabulario',
    description: 'Expande tus palabras con ejercicios interactivos y aprende las más usadas en el inglés real.',
    category: 'Vocabulario',
    emoji: '📚',
    gradient: 'from-teal-500 via-cyan-400 to-sky-400',
    cardBg: 'from-teal-50 to-sky-50 dark:from-teal-950/30 dark:to-sky-950/30',
    badge: 'bg-teal-100 text-teal-700',
    ring: 'ring-teal-200',
  },
];

export function EnglishForYou() {
  const navigate = useNavigate();

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
            onClick={() => navigate(mod.slug === 'fonetica' ? '/phonetics' : `/english/${mod.slug}`)}
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
                  navigate(mod.slug === 'fonetica' ? '/phonetics' : `/english/${mod.slug}`);
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
