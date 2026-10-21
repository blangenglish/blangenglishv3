/**
 * Progreso de Inglés para el Mundo Real, local-first.
 *
 * Misma idea que `src/lib/localProgress.ts`, que es el precedente del repo: el
 * navegador es la fuente de verdad para pintar la pantalla, y Supabase es la
 * copia que permite retomar desde otro dispositivo. La UI nunca espera a la
 * red; si la red falla, el estudiante no se entera.
 *
 * Grano: una entrada por (alumno, tema, bloque).
 */
import { supabase } from '@/integrations/supabase/client';

export type MRBlock =
  | 'vocab' | 'frases' | 'expresiones' | 'phrasal' | 'estructura' | 'dialogo' | 'practica';

export interface MRBlockProgress {
  correct: number;
  total: number;
  bestPct: number;
  attempts: number;
  completed: boolean;
  /** Las respuestas elegidas, por su clave de contenido. Permite retomar a medias. */
  answers: Record<string, string>;
  updatedAt: string;
  completedAt?: string | null;
}

export type MRTopicProgress = Partial<Record<MRBlock, MRBlockProgress>>;

const PREFIX = 'blang_mr_progress';

function keyFor(studentId: string, topicId: string) {
  return `${PREFIX}::${studentId}::${topicId}`;
}

export function getTopicProgress(studentId: string, topicId: string): MRTopicProgress {
  if (!studentId || !topicId) return {};
  try {
    const raw = localStorage.getItem(keyFor(studentId, topicId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveBlockProgress(
  studentId: string,
  topicId: string,
  block: MRBlock,
  progress: MRBlockProgress,
): MRTopicProgress {
  const current = getTopicProgress(studentId, topicId);
  const updated = { ...current, [block]: progress };
  try {
    localStorage.setItem(keyFor(studentId, topicId), JSON.stringify(updated));
  } catch {
    // localStorage lleno o deshabilitado: no hay nada más que intentar
  }
  return updated;
}

/** Todo el progreso del alumno, para pintar los anillos de la lista de temas. */
export function getAllTopicsProgress(studentId: string): Record<string, MRTopicProgress> {
  if (!studentId) return {};
  const prefix = `${PREFIX}::${studentId}::`;
  const out: Record<string, MRTopicProgress> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const topicId = key.slice(prefix.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        out[topicId] = JSON.parse(raw);
      } catch {
        continue; // una clave corrupta no debe tumbar el resto
      }
    }
  } catch {
    return out;
  }
  return out;
}

/* ── Supabase ─────────────────────────────────────────────────────────────── */

export interface MRProgressRow {
  topic_id: string;
  block: MRBlock;
  correct: number;
  total: number;
  best_pct: number;
  attempts: number;
  completed: boolean;
  answers: Record<string, string>;
  updated_at: string;
  completed_at: string | null;
}

export async function pullAllFromRemote(studentId: string): Promise<MRProgressRow[]> {
  if (!studentId) return [];
  const { data, error } = await supabase
    .from('mundo_real_progress')
    .select('topic_id, block, correct, total, best_pct, attempts, completed, answers, updated_at, completed_at')
    .eq('student_id', studentId);
  if (error || !data) return [];
  return data as MRProgressRow[];
}

/**
 * Trae lo remoto a local. Gana lo más reciente por `updatedAt`: así, si el
 * alumno avanzó en el móvil y luego abre el portátil, no pierde lo del móvil,
 * pero tampoco se le machaca lo que acaba de hacer aquí.
 */
export function mergeFromRemote(studentId: string, rows: MRProgressRow[]): void {
  rows.forEach(row => {
    const current = getTopicProgress(studentId, row.topic_id);
    const mine = current[row.block];
    if (mine && mine.updatedAt >= row.updated_at) return;
    saveBlockProgress(studentId, row.topic_id, row.block, {
      correct: row.correct,
      total: row.total,
      bestPct: row.best_pct,
      attempts: row.attempts,
      completed: row.completed,
      answers: row.answers ?? {},
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    });
  });
}

export async function pushBlockProgress(
  studentId: string,
  topicId: string,
  block: MRBlock,
  p: MRBlockProgress,
): Promise<void> {
  if (!studentId) return;
  try {
    await supabase.from('mundo_real_progress').upsert(
      {
        student_id: studentId,
        topic_id: topicId,
        block,
        correct: p.correct,
        total: p.total,
        best_pct: p.bestPct,
        attempts: p.attempts,
        completed: p.completed,
        answers: p.answers,
        updated_at: p.updatedAt,
        completed_at: p.completedAt ?? null,
      },
      { onConflict: 'student_id,topic_id,block' },
    );
  } catch {
    // Sin red el alumno sigue teniendo su progreso local; se subirá la próxima vez.
  }
}

/* ── Resumen ──────────────────────────────────────────────────────────────── */

export interface MRSummary {
  temasEmpezados: number;
  temasCompletados: number;
  bloquesCompletados: number;
  aciertos: number;
  respuestas: number;
}

/** Un tema cuenta como completado cuando todos sus bloques con ejercicios lo están. */
export function summarize(
  all: Record<string, MRTopicProgress>,
  blocksPerTopic: Record<string, number>,
): MRSummary {
  let temasEmpezados = 0;
  let temasCompletados = 0;
  let bloquesCompletados = 0;
  let aciertos = 0;
  let respuestas = 0;

  for (const [topicId, blocks] of Object.entries(all)) {
    const entries = Object.values(blocks);
    if (entries.length === 0) continue;
    temasEmpezados++;
    const done = entries.filter(b => b.completed).length;
    bloquesCompletados += done;
    aciertos += entries.reduce((s, b) => s + b.correct, 0);
    respuestas += entries.reduce((s, b) => s + b.total, 0);
    const expected = blocksPerTopic[topicId];
    if (expected && done >= expected) temasCompletados++;
  }

  return { temasEmpezados, temasCompletados, bloquesCompletados, aciertos, respuestas };
}
