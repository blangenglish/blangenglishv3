/**
 * Agrupación de los ítems de un bloque.
 *
 * Los temas grandes se escriben por secciones (Al llegar, Pedir, Pagar…), pero
 * al cargarlos esa estructura se perdía y quedaba una lista plana: 51 palabras
 * seguidas en Estudiar y 51 preguntas seguidas en Practicar.
 *
 * El grupo es solo presentación y navegación: el progreso se sigue guardando
 * por bloque, con las respuestas por clave de contenido, así que el avance de
 * cada grupo se deduce de esas mismas respuestas sin tocar la base de datos.
 *
 * Los 130 temas que no tienen grupos devuelven un solo grupo sin nombre, y las
 * pestañas los pintan igual que antes.
 */

export interface ItemGroup<T> {
  /** Vacío cuando el bloque no está agrupado. */
  name: string;
  items: T[];
}

/**
 * Reparte los ítems en grupos, respetando el orden en que los grupos aparecen
 * por primera vez (que es el orden en que el profesor los escribió).
 */
export function groupItems<T extends { group?: string }>(
  items: readonly T[],
  /** Nombre para los ítems sin grupo, cuando convive con ítems que sí lo tienen. */
  fallback = 'Otras',
): ItemGroup<T>[] {
  const anyGrouped = items.some(it => (it.group ?? '').trim());
  if (!anyGrouped) return items.length ? [{ name: '', items: [...items] }] : [];

  const order: string[] = [];
  const bucket = new Map<string, T[]>();

  for (const it of items) {
    const name = (it.group ?? '').trim() || fallback;
    if (!bucket.has(name)) {
      bucket.set(name, []);
      order.push(name);
    }
    bucket.get(name)!.push(it);
  }

  // El cajón de los sueltos va al final, aunque haya aparecido antes.
  const named = order.filter(n => n !== fallback);
  if (order.includes(fallback)) named.push(fallback);

  return named.map(name => ({ name, items: bucket.get(name)! }));
}

/** ¿Está este bloque realmente dividido en secciones? */
export function isGrouped<T>(groups: readonly ItemGroup<T>[]): boolean {
  return groups.length > 1 || (groups.length === 1 && groups[0].name !== '');
}
