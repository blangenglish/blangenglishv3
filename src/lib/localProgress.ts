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

export function getAllProgressForStudent(
  studentId: string,
): Array<{ unitId: string; stage: string; completed: boolean; completed_at: string }> {
  if (!studentId) return [];
  const prefix = `${PREFIX}::${studentId}::`;
  const result: Array<{ unitId: string; stage: string; completed: boolean; completed_at: string }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const unitId = key.slice(prefix.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const stages = JSON.parse(raw) as Record<string, StageProgress>;
      Object.entries(stages).forEach(([stage, p]) => {
        result.push({ unitId, stage, completed: !!p.completed, completed_at: p.completed_at });
      });
    }
  } catch {
    // ignorar errores de parseo/acceso
  }
  return result;
}
