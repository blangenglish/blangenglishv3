// @ts-nocheck
/**
 * Secciones de la página de inicio.
 *
 * Cada una recibe su `content` y su `style` ya resueltos. El marcado es el
 * mismo que tenía Home.tsx; lo único que cambia es que los colores que estaban
 * escritos a mano ahora salen de los tokens de index.css, para que el panel de
 * admin pueda cambiarlos.
 *
 * HOME_DEFAULTS al final es la fuente de verdad por defecto: si la base de
 * datos está vacía o falla, la home se pinta exactamente igual que siempre.
 */
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StudentReviews from '@/components/StudentReviews';
import { tx, bgClass, padClass, withDefaults } from '@/lib/pageSections';
import type { Lang, PageSection, SectionStyle } from '@/lib/pageSections';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

interface SectionProps {
  content: Record<string, unknown>;
  style: SectionStyle;
  lang: Lang;
}

/* ── HERO ─────────────────────────────────────────────────────────────── */
export function HomeHero({ content, style, lang }: SectionProps) {
  const c = withDefaults(content, HOME_DEFAULT_CONTENT.hero);
  const oscuro = style?.bg === 'brand' || style?.bg === 'ink';

  return (
    <section className={`relative overflow-hidden ${padClass(style)}`}>
      <div className={`absolute inset-0 ${bgClass(style)}`} />
      <div className="absolute top-0 left-0 w-[300px] sm:w-[550px] h-[300px] sm:h-[550px] bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] bg-white/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden" animate="visible" variants={staggerContainer}
        >
          {tx(c.badge, lang) && (
            <motion.div variants={staggerItem} className="mb-5 sm:mb-7">
              <span className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 rounded-full border backdrop-blur ${
                oscuro ? 'bg-white/10 text-white/90 border-white/20'
                       : 'bg-primary/10 text-primary border-primary/20'}`}>
                {tx(c.badge, lang)}
              </span>
            </motion.div>
          )}

          {/* Saludo bilingüe de marca: se muestra siempre igual, sin importar
              el idioma de interfaz. Por eso no es un campo traducible. */}
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
            <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight ${oscuro ? 'text-white' : 'text-foreground'}`}>
              {c.greeting_left}
            </h1>
            {c.greeting_right && (
              <>
                <span className={`hidden sm:block text-4xl md:text-5xl font-light ${oscuro ? 'text-white/30' : 'text-foreground/30'}`}>/</span>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight">
                  <span className={oscuro ? 'text-white/70' : 'text-primary'}>{c.greeting_right}</span>
                </h1>
              </>
            )}
          </motion.div>

          {tx(c.subtitle, lang) && (
            <motion.p variants={staggerItem} className={`text-base sm:text-xl max-w-xl mx-auto mt-5 sm:mt-6 ${oscuro ? 'text-white/80' : 'text-muted-foreground'}`}>
              {tx(c.subtitle, lang)}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ── BLOQUE DE MARCA ──────────────────────────────────────────────────── */
export function HomeBrand({ content, style, lang }: SectionProps) {
  const c = withDefaults(content, HOME_DEFAULT_CONTENT.brand);

  return (
    <section className={`relative overflow-hidden ${padClass(style)} ${bgClass(style)}`}>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="hidden" animate="visible" variants={staggerContainer}
        >
          {tx(c.badge, lang) && (
            <motion.div variants={staggerItem} className="mb-6">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-primary/20">
                {tx(c.badge, lang)}
              </span>
            </motion.div>
          )}

          <motion.div variants={staggerItem}>
            {/* El eslogan va siempre en inglés, es marca. Son cuatro trozos
                para poder colorear solo la parte central. */}
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-balance">
              <span className="italic text-foreground/70">{c.slogan_pre}</span>
              <span className="text-primary">{c.slogan_accent}</span>
              <span className="italic text-foreground/70">{c.slogan_mid}</span>
              <span className="bg-gradient-to-r from-primary to-[var(--brand-via)] bg-clip-text text-transparent">{c.slogan_brand}</span>
            </h2>
            {tx(c.subtitle, lang) && (
              <p className="text-base sm:text-lg text-muted-foreground font-medium mt-4 sm:mt-5">
                {tx(c.subtitle, lang)}
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── TARJETAS DE PROGRAMA ─────────────────────────────────────────────── */
export function HomePrograms({ content, style, lang }: SectionProps) {
  const navigate = useNavigate();
  const c = withDefaults(content, HOME_DEFAULT_CONTENT.programs);
  const items = Array.isArray(c.items) ? c.items : [];

  return (
    <section className={`relative z-10 ${padClass(style)} ${bgClass(style)}`}>
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
          initial="hidden" animate="visible" variants={staggerContainer}
        >
          {items.map((p: Record<string, unknown>, i: number) => (
            <motion.div
              key={(p.id as string) ?? i}
              variants={staggerItem}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => navigate(p.route as string)}
              className="relative cursor-pointer bg-white border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all flex flex-col overflow-hidden"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[var(--badge-bg)] flex items-center justify-center text-3xl sm:text-4xl shadow-lg mb-5">
                {p.emoji as string}
              </div>
              <h2 className="relative text-xl sm:text-2xl font-black text-foreground leading-tight">{tx(p.title, lang)}</h2>
              <p className="relative text-sm font-semibold text-muted-foreground mb-3">{tx(p.subtitle, lang)}</p>
              <p className="relative text-sm sm:text-base text-muted-foreground leading-relaxed flex-1 mb-6">{tx(p.desc, lang)}</p>
              <Button
                className="relative w-full rounded-xl py-5 sm:py-6 font-bold text-sm sm:text-base bg-[var(--ink)] hover:opacity-90 text-white transition-opacity gap-2 shadow-lg"
                onClick={(e) => { e.stopPropagation(); navigate(p.route as string); }}
              >
                {tx(c.cta, lang)}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── RESEÑAS ──────────────────────────────────────────────────────────── */
export function HomeReviews({ content }: SectionProps) {
  const limit = Number(content?.limit) || 6;
  return <StudentReviews limit={limit} className="pb-16 sm:pb-20" />;
}

/* ── Registro y valores por defecto ───────────────────────────────────── */

export const HOME_DEFAULT_CONTENT = {
  hero: {
    greeting_left: 'Bienvenido/a',
    greeting_right: 'Welcome',
    badge: { es: '🎉 ¡25% de descuento en tu primer mes!', en: '🎉 25% off your first month!' },
    subtitle: { es: 'Aprende un nuevo idioma desde ya 🌎', en: 'Start learning a new language today 🌎' },
  },
  brand: {
    badge: { es: '👋 BLANG Academy', en: '👋 BLANG Academy' },
    slogan_pre: '"Speak Up and ',
    slogan_accent: 'Stand Out ',
    slogan_mid: 'with ',
    slogan_brand: 'BLANG"',
    subtitle: { es: 'Elige el programa que mejor se adapte a ti', en: 'Choose the program that fits you best' },
  },
  programs: {
    cta: { es: 'Conoce precios', en: 'See pricing' },
    items: [
      {
        id: 'spanish', emoji: '🇪🇸', route: '/espanol',
        title: { es: 'Español para extranjeros', en: 'Spanish for Foreigners' },
        subtitle: { es: 'Spanish for Foreigners', en: 'Español para extranjeros' },
        desc: {
          es: 'Aprende español bajo inmersión. Metodología que desarrolla primero comprensión (lectura y escucha) y luego producción (habla y escritura).',
          en: 'Learn Spanish through immersion. A method that builds comprehension first (reading and listening) and then production (speaking and writing).',
        },
      },
      {
        id: 'english', emoji: '🇬🇧', route: '/ingles',
        title: { es: 'Inglés para hispanohablantes', en: 'English for Spanish Speakers' },
        subtitle: { es: 'Niños, jóvenes y adultos', en: 'Kids, teens and adults' },
        desc: {
          es: 'Tres módulos según la edad, cada uno con su propia metodología, contenidos y ritmo. Entra y elige el que te corresponde.',
          en: 'Three modules by age, each with its own method, content and pace. Come in and pick the one that fits you.',
        },
      },
    ],
  },
  reviews: { limit: 6 },
} as const;

/** Qué componente pinta cada sección, y cómo se llama en el panel. */
export const HOME_REGISTRY = {
  hero:     { Component: HomeHero,     label: 'Hero de bienvenida' },
  brand:    { Component: HomeBrand,    label: 'Bloque de marca' },
  programs: { Component: HomePrograms, label: 'Tarjetas de programa' },
  reviews:  { Component: HomeReviews,  label: 'Reseñas de alumnos' },
} as const;

export type HomeSectionKey = keyof typeof HOME_REGISTRY;

/** Orden y estilo por defecto: lo que se pinta si la base está vacía. */
export const HOME_DEFAULTS: PageSection[] = [
  { page_key: 'home', section_key: 'hero',     sort_order: 1, is_visible: true, content: HOME_DEFAULT_CONTENT.hero,     style: { bg: 'brand', pad: 'lg' } },
  { page_key: 'home', section_key: 'brand',    sort_order: 2, is_visible: true, content: HOME_DEFAULT_CONTENT.brand,    style: { bg: 'none',  pad: 'md' } },
  { page_key: 'home', section_key: 'programs', sort_order: 3, is_visible: true, content: HOME_DEFAULT_CONTENT.programs, style: { bg: 'none',  pad: 'md' } },
  { page_key: 'home', section_key: 'reviews',  sort_order: 4, is_visible: true, content: HOME_DEFAULT_CONTENT.reviews,  style: { bg: 'none',  pad: 'md' } },
];
