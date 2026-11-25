import { useSyncExternalStore } from 'react';
import { cfg, subscribeSiteConfig, getSiteConfigVersion } from '@/lib/siteConfig';

/**
 * Versión hook de `cfg()`. Úsala dentro de componentes para que la vista se
 * actualice cuando llegue la configuración; fuera de componentes usa `cfg()`
 * directamente.
 *
 * El primer render devuelve el fallback y se re-renderiza solo cuando la
 * carga termina, así que nunca hay un parpadeo con el valor vacío.
 */
export function useSetting(key: string, fallback: string): string {
  useSyncExternalStore(subscribeSiteConfig, getSiteConfigVersion, () => 0);
  return cfg(key, fallback);
}
