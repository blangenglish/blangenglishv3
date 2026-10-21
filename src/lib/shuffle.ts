/**
 * Barajado determinista.
 *
 * El problema que resuelve: si las opciones de un ejercicio se barajan con
 * `Math.random()` dentro del render, vuelven a cambiar de orden en cada
 * re-render. Cualquier respuesta guardada por posición deja de significar lo
 * mismo medio segundo después.
 *
 * Aquí el orden depende solo de una semilla de texto, así que es estable entre
 * renders, entre sesiones y entre dispositivos: la misma palabra del mismo tema
 * siempre sale barajada igual.
 *
 * También evita `sort(() => Math.random() - 0.5)`, que parece un barajado pero
 * está sesgado: no todas las permutaciones salen con la misma probabilidad.
 */

/** Hash de texto a entero de 32 bits (FNV-1a). Rápido y bien distribuido. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generador pseudoaleatorio con estado de 32 bits. Devuelve [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Baraja una copia de `items` con Fisher-Yates. Mismo `seed`, mismo resultado.
 * No muta el array original.
 */
export function shuffleSeeded<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice();
  const rand = mulberry32(hashSeed(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Los primeros `n` de una baraja determinista. Útil para elegir distractores. */
export function pickSeeded<T>(items: readonly T[], n: number, seed: string): T[] {
  return shuffleSeeded(items, seed).slice(0, Math.max(0, n));
}

/**
 * Se sube cuando se quiere forzar que todo el mundo vuelva a ver otro orden
 * (por ejemplo si un tema se queda demasiado memorizado). Va dentro de la
 * semilla, así que cambiarlo reordena todos los ejercicios de golpe.
 */
export const MR_SHUFFLE_VERSION = 'v1';

/** Semilla canónica de un ítem de Mundo Real. */
export function mrSeed(topicId: string, block: string, key: string): string {
  return `${MR_SHUFFLE_VERSION}|${topicId}|${block}|${key}`;
}
