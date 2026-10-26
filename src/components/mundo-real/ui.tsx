/**
 * El sistema visual de Inglés para el Mundo Real.
 *
 * Antes cada pestaña dibujaba sus propias filas: un `divide-y` en una sola
 * columna, todo a `text-xs` y `text-muted-foreground`, con el mismo peso para
 * la palabra que para su ejemplo. Con los temas ampliados (el primero tiene 74
 * palabras y 37 frases) eso es un scroll plano de 74 filas idénticas.
 *
 * Aquí viven las piezas que usan las seis pestañas, y con ellas los tres
 * arreglos de fondo:
 *   - REJILLA en vez de columna, para que el contenido se distribuya.
 *   - JERARQUÍA: el término en grande, el significado en medio, el ejemplo
 *     subordinado dentro de su propio recuadro.
 *   - IDENTIDAD por bloque: cada pestaña tiene su color, así que vocabulario y
 *     phrasal verbs ya no son la misma pantalla gris.
 */
import { useState, useMemo } from 'react';
import type { MRBlockId } from './types';

/* ── Color por bloque ─────────────────────────────────────────────────────── */

export interface BlockTheme {
  icon: string;
  label: string;
  /** Degradado para las cabeceras y el estado activo de la pestaña. */
  grad: string;
  /** Texto de acento. */
  text: string;
  /** Fondo tenue para chips, cabeceras y el recuadro del ejemplo. */
  soft: string;
  /** Borde a tono con `soft`. */
  ring: string;
  dot: string;
}

/**
 * Las clases van escritas completas a propósito: Tailwind las descubre leyendo
 * el código, así que un `` `bg-${color}-50` `` no llegaría al CSS final.
 */
export const BLOCK_THEME: Record<MRBlockId, BlockTheme> = {
  vocab: {
    icon: '📖', label: 'Vocabulario',
    grad: 'from-indigo-500 to-blue-500',
    text: 'text-indigo-600 dark:text-indigo-300',
    soft: 'bg-indigo-50 dark:bg-indigo-950/40',
    ring: 'border-indigo-200/70 dark:border-indigo-900/70',
    dot: 'bg-indigo-500',
  },
  frases: {
    icon: '💬', label: 'Frases',
    grad: 'from-teal-500 to-emerald-500',
    text: 'text-teal-600 dark:text-teal-300',
    soft: 'bg-teal-50 dark:bg-teal-950/40',
    ring: 'border-teal-200/70 dark:border-teal-900/70',
    dot: 'bg-teal-500',
  },
  expresiones: {
    icon: '🗣️', label: 'Expresiones',
    grad: 'from-amber-500 to-orange-500',
    text: 'text-amber-600 dark:text-amber-300',
    soft: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'border-amber-200/70 dark:border-amber-900/70',
    dot: 'bg-amber-500',
  },
  phrasal: {
    icon: '🔀', label: 'Phrasal Verbs',
    grad: 'from-violet-500 to-purple-500',
    text: 'text-violet-600 dark:text-violet-300',
    soft: 'bg-violet-50 dark:bg-violet-950/40',
    ring: 'border-violet-200/70 dark:border-violet-900/70',
    dot: 'bg-violet-500',
  },
  estructura: {
    icon: '🏗️', label: 'Estructura',
    grad: 'from-rose-500 to-pink-500',
    text: 'text-rose-600 dark:text-rose-300',
    soft: 'bg-rose-50 dark:bg-rose-950/40',
    ring: 'border-rose-200/70 dark:border-rose-900/70',
    dot: 'bg-rose-500',
  },
  dialogo: {
    icon: '🎭', label: 'Diálogo',
    grad: 'from-cyan-500 to-sky-500',
    text: 'text-cyan-600 dark:text-cyan-300',
    soft: 'bg-cyan-50 dark:bg-cyan-950/40',
    ring: 'border-cyan-200/70 dark:border-cyan-900/70',
    dot: 'bg-cyan-500',
  },
};

/* ── Contenedores ─────────────────────────────────────────────────────────── */

/** El panel estándar. Todo lo que es un bloque de contenido va dentro de uno. */
export function SectionCard({
  children, className = '', padded = true,
}: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section
      className={`rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * Cabecera de sección: azulejo con el icono del bloque, título, subtítulo y un
 * hueco a la derecha para el contador o un botón.
 */
export function SectionHeader({
  block, title, subtitle, right,
}: {
  block: MRBlockId;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const th = BLOCK_THEME[block];
  return (
    <header className="flex items-start gap-4 mb-5">
      <div className={`shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${th.grad} grid place-items-center text-lg shadow-sm`}>
        <span aria-hidden="true">{th.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

/** Contador discreto para el hueco derecho de la cabecera. */
export function CountPill({ block, children }: { block: MRBlockId; children: React.ReactNode }) {
  const th = BLOCK_THEME[block];
  return (
    <span className={`inline-flex items-center rounded-full border ${th.ring} ${th.soft} ${th.text} px-3 py-1 text-xs font-bold tabular-nums`}>
      {children}
    </span>
  );
}

/**
 * La rejilla que sustituye a la columna infinita. Una sola columna en el móvil,
 * dos desde tablet y tres en pantallas anchas.
 */
export function StudyGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

/* ── Tarjeta de término ───────────────────────────────────────────────────── */

/**
 * La tarjeta de estudio de vocabulario, expresiones y phrasal verbs.
 *
 * La jerarquía es el punto: `term` es lo que se aprende y va en grande;
 * `gloss` es el significado y va legible pero secundario; `example` queda
 * dentro de su propio recuadro a tono, claramente subordinado.
 */
export function TermCard({
  block, term, gloss, example, tag, onSpeak,
}: {
  block: MRBlockId;
  term: string;
  gloss: string;
  example?: string;
  /** Etiqueta corta a tono, p. ej. el «cuándo» de una frase. */
  tag?: string;
  onSpeak?: () => void;
}) {
  const th = BLOCK_THEME[block];
  return (
    <article className="group flex flex-col rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:border-border">
      <div className="flex items-start gap-3">
        <h4 className="flex-1 font-extrabold text-[17px] sm:text-lg leading-snug tracking-tight break-words">
          {term}
        </h4>
        {onSpeak && (
          <button
            onClick={onSpeak}
            aria-label={`Escuchar «${term}»`}
            title="Escuchar"
            className={`shrink-0 w-9 h-9 grid place-items-center rounded-full border ${th.ring} ${th.soft} ${th.text} transition-transform hover:scale-110 active:scale-95`}
          >
            <span aria-hidden="true">🔊</span>
          </button>
        )}
      </div>

      <p className="text-sm sm:text-[15px] text-foreground/75 mt-2 leading-relaxed">{gloss}</p>

      {tag && (
        <span className={`mt-2.5 self-start inline-flex items-center rounded-full border ${th.ring} ${th.soft} ${th.text} px-2.5 py-0.5 text-[11px] font-bold`}>
          {tag}
        </span>
      )}

      {example && (
        <p className={`mt-3 rounded-xl ${th.soft} px-3 py-2 text-xs sm:text-[13px] italic text-muted-foreground leading-relaxed`}>
          {example}
        </p>
      )}
    </article>
  );
}

/* ── Filtro ───────────────────────────────────────────────────────────────── */

/**
 * Buscador local de la lista de estudio. Solo aparece cuando hay bastantes
 * elementos: con 74 palabras, recorrer la rejilla a ojo no es razonable.
 */
export function FilterField({
  value, onChange, placeholder, shown, total,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  shown: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true">🔎</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 rounded-xl border border-border/60 bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary/60"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Limpiar el filtro"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {shown === total ? `${total}` : `${shown} / ${total}`}
      </span>
    </div>
  );
}

/** Filtra una lista por varios campos de texto, sin distinguir mayúsculas. */
export function useTextFilter<T>(items: readonly T[], fields: (item: T) => string[]) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items as T[];
    return (items as T[]).filter(item =>
      fields(item).some(f => String(f ?? '').toLowerCase().includes(q)),
    );
    // `fields` se redefine en cada render; la dependencia real es la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);
  return { query, setQuery, filtered };
}

/* ── Avisos ───────────────────────────────────────────────────────────────── */

/** Lo que se ve cuando un bloque no tiene contenido o el filtro no encuentra nada. */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

/** Barra de avance de un ejercicio. */
export function ProgressTrack({ value, total, block }: { value: number; total: number; block: MRBlockId }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const th = BLOCK_THEME[block];
  return (
    <div
      className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${th.grad} transition-[width] duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Anillo de puntaje para el resumen final de un bloque. */
export function ScoreRing({ hits, total }: { hits: number; total: number }) {
  const pct = total > 0 ? Math.round((hits / total) * 100) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  const tone = pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          className={`${tone} transition-[stroke-dashoffset] duration-700 ease-out`}
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={`text-xl font-extrabold tabular-nums ${tone}`}>{pct}%</span>
      </div>
    </div>
  );
}
