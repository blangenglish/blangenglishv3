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
      .select('topic_id, vocabulary, phrases, structure, dialogue, expressions, phrasal_verbs')
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
        if (!ov) return t;
        return {
          ...t,
          vocabulary:   dedupe([...(t.vocabulary ?? []), ...((ov.vocabulary as any[]) ?? [])], (v: any) => v.word),
          phrases:      dedupe([...(t.phrases ?? []),    ...((ov.phrases as any[]) ?? [])],    (p: any) => p.phrase),
          structure:    (ov.structure as any)     ?? t.structure,
          dialogue:     (ov.dialogue as any[])    ?? t.dialogue,
          expressions:  (ov.expressions as any[]) ?? t.expressions  ?? [],
          phrasalVerbs: (ov.phrasal_verbs as any[]) ?? t.phrasalVerbs ?? [],
        } as MRTopic;
      }),
    [overrides],
  );

  return { topics, loading, error, reload };
}
