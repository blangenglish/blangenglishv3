/**
 * Configuración del sitio editable desde el panel de admin.
 *
 * Lee `site_settings` (clave/valor) UNA vez al arrancar y la deja en un caché
 * de módulo. Así `cfg()` es síncrona y la pueden usar helpers que no son
 * componentes, como `whatsapp.ts`, sin convertirlos en hooks.
 *
 * Dos reglas que hacen esto seguro:
 *
 *  1. **Siempre con fallback.** Cada lectura pasa el literal que había antes en
 *     el código. Si Supabase está caído, si la clave no existe o si está vacía,
 *     la página se ve exactamente igual que antes. Nunca se pinta un hueco.
 *
 *  2. **No bloquea el arranque.** La carga se dispara desde App.tsx en paralelo
 *     con la sesión y nadie la espera. Mientras no haya respuesta, `cfg()`
 *     devuelve el fallback. Ver la nota de App.tsx sobre no bloquear
 *     `sessionReady`.
 */
import { supabase } from '@/integrations/supabase/client';

type Config = Record<string, string>;

let CACHE: Config | null = null;
let loaded = false;

// Suscriptores para que los componentes se re-rendericen cuando llegue la
// configuración (si no, el primer render se quedaría con el fallback).
const listeners = new Set<() => void>();
let snapshotVersion = 0;

function notify() {
  snapshotVersion += 1;
  listeners.forEach((l) => l());
}

/** Valores que en la base significan «sin configurar». */
function isBlank(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim();
  return v === '' || v === '#';
}

/**
 * Devuelve el valor de una clave, o el fallback si no hay nada usable.
 * Síncrona a propósito: se puede llamar desde cualquier sitio.
 */
export function cfg(key: string, fallback: string): string {
  const value = CACHE?.[key];
  return isBlank(value) ? fallback : (value as string).trim();
}

/** Carga la configuración. Idempotente y silenciosa ante fallos. */
export async function loadSiteConfig(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error || !data) return; // nos quedamos con los fallbacks

    const next: Config = {};
    for (const row of data as Array<{ key: string; value: string | null }>) {
      if (row?.key) next[row.key] = row.value ?? '';
    }
    CACHE = next;
    notify();
  } catch {
    // Silencio deliberado: la web debe funcionar sin esta tabla.
  }
}

// ── Integración con React ──────────────────────────────────────────────
export function subscribeSiteConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSiteConfigVersion(): number {
  return snapshotVersion;
}
