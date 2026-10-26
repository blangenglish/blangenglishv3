/**
 * Carga de los temas de Inglés para el Mundo Real.
 *
 * Los temas viven en dos sitios y hay que fusionarlos:
 *   - `src/pages/MundoRealData.ts`: la línea base versionada en git.
 *   - tabla `mundo_real_overrides`: lo que edita el admin.
 *
 * No es contenido opcional. Las expresiones y los phrasal verbs de los 132
 * temas viven ENTEROS en la tabla (el archivo no trae ninguno), así que si la
 * consulta falla esas dos pestañas desaparecen sin avisar. Por eso el hook
 * expone `error` y `reload`.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MUNDO_REAL_TOPICS, type MRTopic } from '@/pages/MundoRealData';

type OverrideRow = {
  topic_id: string;
  vocabulary?: unknown[] | null;
  phrases?: unknown[] | null;
  structure?: unknown | null;
  dialogue?: unknown[] | null;
  expressions?: unknown[] | null;
  phrasal_verbs?: unknown[] | null;
  /** Se SUMAN a structure/dialogue, no los reemplazan. */
  structures_extra?: unknown[] | null;
  dialogues_extra?: unknown[] | null;
};

/**
 * El vocabulario y las frases se CONCATENAN (el admin añade, no reemplaza), y
 * por eso hay que quitar los repetidos: el editor del admin se inicializa con
 * los datos del archivo, así que si alguien abre un tema y le da a guardar sin
 * tocar nada, esas mismas palabras quedan también en el override y el
 * estudiante las vería dos veces.
 */
function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const k = (key(item) ?? '').trim().toLowerCase();
    if (!k) return true;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Reordena los ítems por sección.
 *
 * El merge pone primero lo del archivo, así que sin esto el orden de las
 * secciones lo decidirían las pocas palabras heredadas: en «En el Restaurante»
 * «Pagar y problemas» saldría segunda y «Llegar y la mesa» tercera, porque el
 * archivo empieza por `bill` y `tip`. El orden correcto es el del override, que
 * es donde el profesor escribió las secciones en secuencia; lo del archivo se
 * coloca dentro de la sección que le toca.
 *
 * Para los temas sin secciones no hace nada.
 */
function sortByGroupOrder<T extends { group?: string }>(merged: T[], reference: readonly T[]): T[] {
  const order = new Map<string, number>();
  const nameOf = (it: T) => (it.group ?? '').trim();

  for (const it of reference) {
    const g = nameOf(it);
    if (g && !order.has(g)) order.set(g, order.size);
  }
  if (order.size === 0) return merged;

  // Una sección que solo exista en el archivo va detrás, en su orden original.
  for (const it of merged) {
    const g = nameOf(it);
    if (g && !order.has(g)) order.set(g, order.size);
  }

  return merged
    .map((it, i) => ({ it, i, rank: order.get(nameOf(it)) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(x => x.it);
}

export interface UseMundoRealTopics {
  topics: MRTopic[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useMundoRealTopics(): UseMundoRealTopics {
  const [overrides, setOverrides] = useState<Record<string, OverrideRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(() => {
    setError(false);
    setLoading(true);
    supabase
      .from('mundo_real_overrides')
      .select('topic_id, vocabulary, phrases, structure, dialogue, expressions, phrasal_verbs, structures_extra, dialogues_extra')
      .then(({ data, error: err }) => {
        if (err) { setError(true); setLoading(false); return; }
        if (data?.length) {
          const map: Record<string, OverrideRow> = {};
          (data as OverrideRow[]).forEach(row => { map[row.topic_id] = row; });
          setOverrides(map);
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const topics = useMemo(
    () =>
      MUNDO_REAL_TOPICS.map(t => {
        const ov = overrides[t.id];

        // `structure` y `dialogue` siguen siendo singulares en el archivo. El
        // visor trabaja siempre con las listas, así que lo del archivo se
        // envuelve como el primer elemento y lo de `*_extra` se añade detrás.
        const baseStructure = (ov?.structure as any) ?? t.structure;
        const baseDialogue  = (ov?.dialogue as any[]) ?? t.dialogue;

        const structures = [
          ...(baseStructure ? [baseStructure] : []),
          ...(((ov?.structures_extra as any[]) ?? [])),
        ];
        const dialogues = [
          ...(baseDialogue?.length ? [{ id: 'base', title: 'Conversación principal', lines: baseDialogue }] : []),
          ...(((ov?.dialogues_extra as any[]) ?? [])),
        ];

        if (!ov) return { ...t, structures, dialogues } as MRTopic;

        return {
          ...t,
          vocabulary: sortByGroupOrder(
            dedupe([...(t.vocabulary ?? []), ...((ov.vocabulary as any[]) ?? [])], (v: any) => v.word),
            (ov.vocabulary as any[]) ?? [],
          ),
          phrases: sortByGroupOrder(
            dedupe([...(t.phrases ?? []), ...((ov.phrases as any[]) ?? [])], (p: any) => p.phrase),
            (ov.phrases as any[]) ?? [],
          ),
          structure:    baseStructure,
          dialogue:     baseDialogue,
          expressions:  (ov.expressions as any[]) ?? t.expressions  ?? [],
          phrasalVerbs: (ov.phrasal_verbs as any[]) ?? t.phrasalVerbs ?? [],
          structures,
          dialogues,
        } as MRTopic;
      }),
    [overrides],
  );

  return { topics, loading, error, reload };
}
