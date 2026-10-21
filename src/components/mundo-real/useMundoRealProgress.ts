/**
 * Progreso del estudiante en Mundo Real, listo para la UI.
 *
 * Escribe a `localStorage` de forma sincrónica (la pantalla se actualiza al
 * instante, sin esperar a la red) y sube a Supabase con un pequeño retardo,
 * para no mandar una petición por cada clic.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type MRBlock, type MRBlockProgress, type MRTopicProgress,
  getAllTopicsProgress, getTopicProgress, saveBlockProgress,
  pullAllFromRemote, mergeFromRemote, pushBlockProgress,
} from '@/lib/mundoRealProgress';

const PUSH_DELAY_MS = 1500;

export interface UseMundoRealProgress {
  /** Todo el progreso del alumno, por tema. */
  all: Record<string, MRTopicProgress>;
  /** Guarda el resultado de un bloque y lo sube con retardo. */
  saveBlock: (topicId: string, block: MRBlock, data: {
    correct: number; total: number; answers: Record<string, string>; completed: boolean;
  }) => void;
  /** Borra un bloque (cuando el alumno pulsa «Repetir»). */
  clearBlock: (topicId: string, block: MRBlock) => void;
  syncing: boolean;
}

export function useMundoRealProgress(studentId?: string): UseMundoRealProgress {
  const [all, setAll] = useState<Record<string, MRTopicProgress>>({});
  const [syncing, setSyncing] = useState(false);
  const timers = useRef<Record<string, number>>({});

  // Al entrar: primero lo local (instantáneo) y después lo remoto por si el
  // alumno venía de otro dispositivo.
  useEffect(() => {
    if (!studentId) { setAll({}); return; }
    setAll(getAllTopicsProgress(studentId));

    let cancelled = false;
    setSyncing(true);
    pullAllFromRemote(studentId)
      .then(rows => {
        if (cancelled) return;
        if (rows.length) {
          mergeFromRemote(studentId, rows);
          setAll(getAllTopicsProgress(studentId));
        }
      })
      .finally(() => { if (!cancelled) setSyncing(false); });

    return () => { cancelled = true; };
  }, [studentId]);

  // Los temporizadores pendientes se cancelan al desmontar.
  useEffect(() => {
    const pending = timers.current;
    return () => { Object.values(pending).forEach(t => window.clearTimeout(t)); };
  }, []);

  const saveBlock = useCallback<UseMundoRealProgress['saveBlock']>((topicId, block, data) => {
    if (!studentId) return;

    const previous = getTopicProgress(studentId, topicId)[block];
    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const now = new Date().toISOString();

    const next: MRBlockProgress = {
      correct: data.correct,
      total: data.total,
      // El mejor porcentaje no baja: repetir un bloque para mejorarlo no debe
      // poder empeorar lo ya conseguido.
      bestPct: Math.max(previous?.bestPct ?? 0, pct),
      // Un intento cuenta cuando el bloque se termina, no en cada respuesta.
      attempts: (previous?.attempts ?? 0) + (data.completed && !previous?.completed ? 1 : 0),
      completed: data.completed || !!previous?.completed,
      answers: data.answers,
      updatedAt: now,
      completedAt: data.completed ? (previous?.completedAt ?? now) : previous?.completedAt ?? null,
    };

    saveBlockProgress(studentId, topicId, block, next);
    setAll(getAllTopicsProgress(studentId));

    const key = `${topicId}::${block}`;
    if (timers.current[key]) window.clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(() => {
      delete timers.current[key];
      void pushBlockProgress(studentId, topicId, block, next);
    }, PUSH_DELAY_MS);
  }, [studentId]);

  const clearBlock = useCallback<UseMundoRealProgress['clearBlock']>((topicId, block) => {
    if (!studentId) return;
    const previous = getTopicProgress(studentId, topicId)[block];
    // Se conserva el histórico (bestPct, attempts, completed): repetir un
    // bloque limpia las respuestas en pantalla, no borra lo ya logrado.
    const next: MRBlockProgress = {
      correct: 0,
      total: 0,
      bestPct: previous?.bestPct ?? 0,
      attempts: previous?.attempts ?? 0,
      completed: !!previous?.completed,
      answers: {},
      updatedAt: new Date().toISOString(),
      completedAt: previous?.completedAt ?? null,
    };
    saveBlockProgress(studentId, topicId, block, next);
    setAll(getAllTopicsProgress(studentId));
    void pushBlockProgress(studentId, topicId, block, next);
  }, [studentId]);

  return { all, saveBlock, clearBlock, syncing };
}
