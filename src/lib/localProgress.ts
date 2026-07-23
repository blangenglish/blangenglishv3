// Progreso de unidades guardado en el navegador del estudiante.
// Es la fuente de verdad para la UI: no depende de que Supabase responda.

export type StageProgress = { completed: boolean; completed_at: string; quiz_passed: boolean };

const PREFIX = 'blang_progress';

function keyFor(studentId: string, unitId: string) {
  return `${PREFIX}::${studentId}::${unitId}`;
}

export function getUnitProgress(studentId: string, unitId: string): Record<string, StageProgress> {
  if (!studentId || !unitId) return {};
  try {
    const raw = localStorage.getItem(keyFor(studentId, unitId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setStageCompleted(
  studentId: string,
  unitId: string,
  stage: string,
  data: StageProgress,
): Record<string, StageProgress> {
  const current = getUnitProgress(studentId, unitId);
  const updated = { ...current, [stage]: data };
  try {
    localStorage.setItem(keyFor(studentId, unitId), JSON.stringify(updated));
  } catch {
    // localStorage lleno o deshabilitado: no hay nada más que intentar aquí
  }
  return updated;
}

// ── Migración única: trae a localStorage el progreso que ya existía en Supabase ──
// antes de este cambio, para que un estudiante no "pierda" lo que ya había completado.
const MIGRATED_PREFIX = 'blang_progress_migrated';

export function hasMigrated(studentId: string): boolean {
  if (!studentId) return true;
  try {
    return localStorage.getItem(`${MIGRATED_PREFIX}::${studentId}`) === '1';
  } catch {
    return true; // si no hay localStorage disponible, no insistir
  }
}

export function markMigrated(studentId: string): void {
  try {
    localStorage.setItem(`${MIGRATED_PREFIX}::${studentId}`, '1');
  } catch {
    // ignorar
  }
}

export function mergeFromRemote(
  studentId: string,
  rows: Array<{ unit_id: string; stage: string; completed: boolean; completed_at: string; quiz_passed?: boolean }>,
): void {
  rows.forEach(row => {
    if (!row.completed) return;
    const current = getUnitProgress(studentId, row.unit_id);
    if (current[row.stage]?.completed) return; // ya existe localmente, no sobreescribir
    setStageCompleted(studentId, row.unit_id, row.stage, {
      completed: true,
      completed_at: row.completed_at,
      quiz_passed: !!row.quiz_passed,
    });
  });
}

export function getAllProgressForStudent(
  studentId: string,
): Array<{ unitId: string; stage: string; completed: boolean; completed_at: string }> {
  if (!studentId) return [];
  const prefix = `${PREFIX}::${studentId}::`;
  const result: Array<{ unitId: string; stage: string; completed: boolean; completed_at: string }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    try {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const unitId = key.slice(prefix.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const stages = JSON.parse(raw) as Record<string, StageProgress>;
      Object.entries(stages).forEach(([stage, p]) => {
        result.push({ unitId, stage, completed: !!p.completed, completed_at: p.completed_at });
      });
    } catch {
      // ignorar error de esta clave puntual, seguir con las demás
      continue;
    }
  }
  return result;
}
