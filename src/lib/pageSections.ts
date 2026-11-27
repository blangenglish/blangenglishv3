/**
 * Secciones editables de las páginas públicas.
 *
 * Patrón deliberado, el mismo que ya usa Mundo Real: **el código manda por
 * defecto y la base manda si hay fila**. Si la tabla está vacía, si la consulta
 * falla o si a una fila le falta un campo, la página se pinta igual que antes
 * usando los valores por defecto del registro. La web nunca se queda en blanco
 * por un problema de datos.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adminSelect } from '@/lib/adminWrite';

export type Lang = 'es' | 'en';

/** Texto bilingüe tal como se guarda en el jsonb. */
export type Localized = { es?: string; en?: string };

export interface SectionStyle {
  /** Fondo de la sección. Mapea a las utilidades de index.css. */
  bg?: 'none' | 'tint' | 'brand' | 'ink';
  /** Altura vertical. */
  pad?: 'sm' | 'md' | 'lg';
}

export interface PageSection {
  id?: string;
  page_key: string;
  section_key: string;
  sort_order: number;
  is_visible: boolean;
  content: Record<string, unknown>;
  style: SectionStyle;
}

/** Resuelve un campo bilingüe con caída a español y luego a cadena vacía. */
export function tx(node: unknown, lang: Lang): string {
  if (typeof node === 'string') return node;
  if (node && typeof node === 'object') {
    const n = node as Localized;
    return n[lang] ?? n.es ?? n.en ?? '';
  }
  return '';
}

/** Clase de fondo para una sección. */
export function bgClass(style: SectionStyle | undefined): string {
  switch (style?.bg) {
    case 'brand': return 'surface-brand';
    case 'tint':  return 'surface-tint';
    case 'ink':   return 'surface-ink';
    default:      return '';
  }
}

/** Clase de altura para una sección. */
export function padClass(style: SectionStyle | undefined): string {
  switch (style?.pad) {
    case 'sm': return 'section-pad-sm';
    case 'lg': return 'section-pad-lg';
    default:   return 'section-pad-md';
  }
}

interface Options {
  /** En vista previa se leen los borradores, y hace falta ser admin. */
  preview?: boolean;
}

export interface UsePageSections {
  sections: PageSection[];
  loading: boolean;
  /** true si lo que se está pintando viene del código, no de la base. */
  usingDefaults: boolean;
  reload: () => void;
}

/**
 * Trae las secciones de una página ya ordenadas y filtradas por visibilidad.
 * `defaults` es la lista del código y se usa como respaldo y como relleno.
 */
export function usePageSections(
  pageKey: string,
  defaults: PageSection[],
  options: Options = {},
): UsePageSections {
  const { preview = false } = options;
  const [rows, setRows] = useState<PageSection[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (preview) {
        // Los borradores no son legibles con la clave pública: se piden por la
        // edge function, que valida que quien mira es admin.
        const data = await adminSelect('page_sections', {
          filters: { page_key: pageKey },
          order: { column: 'sort_order', ascending: true },
        });
        const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
          page_key: r.page_key as string,
          section_key: r.section_key as string,
          sort_order: (r.draft_sort_order ?? r.sort_order) as number,
          is_visible: (r.draft_is_visible ?? r.is_visible) as boolean,
          content: (r.draft_content ?? r.content ?? {}) as Record<string, unknown>,
          style: (r.draft_style ?? r.style ?? {}) as SectionStyle,
        }));
        setRows(mapped.length ? mapped : null);
      } else {
        const { data, error } = await supabase
          .from('page_sections')
          .select('page_key, section_key, sort_order, is_visible, content, style')
          .eq('page_key', pageKey)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setRows(data?.length ? (data as PageSection[]) : null);
      }
    } catch {
      setRows(null); // nos quedamos con los valores del código
    } finally {
      setLoading(false);
    }
  }, [pageKey, preview]);

  useEffect(() => { void load(); }, [load]);

  const usingDefaults = rows === null;
  const source = rows ?? defaults;

  // Una sección nueva en el código que todavía no tenga fila se añade al final,
  // para que al desplegarla no quede invisible hasta que alguien siembre la BD.
  const known = new Set(source.map((s) => s.section_key));
  const faltantes = defaults.filter((d) => !known.has(d.section_key));

  const sections = [...source, ...faltantes]
    .filter((s) => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  return { sections, loading, usingDefaults, reload: load };
}

/**
 * Mezcla el contenido de la base con el del código, campo a campo. Así una
 * fila a medio rellenar sigue pintando bien: lo que falte lo pone el código.
 */
export function withDefaults<T extends Record<string, unknown>>(
  content: Record<string, unknown> | undefined,
  defaults: T,
): T {
  if (!content) return defaults;
  const out = { ...defaults } as Record<string, unknown>;
  for (const [k, v] of Object.entries(content)) {
    if (v !== null && v !== undefined && v !== '') out[k] = v;
  }
  return out as T;
}
