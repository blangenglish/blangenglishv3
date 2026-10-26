import { useState, useEffect } from 'react';
import { orderExercises, isOrderCorrect } from '@/lib/mundoRealExercises';
import {
  BLOCK_THEME, SectionCard, SectionHeader, CountPill, ProgressTrack, EmptyNote,
} from '../ui';
import type { MRTabProps } from '../types';

interface StructureTabProps extends MRTabProps {
  /** Fichas colocadas por ejercicio, por su id. Vive arriba para sobrevivir al cambio de pestaña. */
  order: Record<string, number[]>;
  orderDone: Record<string, boolean>;
  onOrder: (key: string, ids: number[]) => void;
  onOrderDone: (key: string, done: boolean) => void;
}

const TH = BLOCK_THEME.estructura;

export function StructureTab({
  topic, mode, speak, order, orderDone, onOrder, onOrderDone,
}: StructureTabProps) {
  // El tema puede traer varias estructuras (pedir, modificar, comparar…).
  const structures = topic.structures ?? (topic.structure ? [topic.structure] : []);
  const [current, setCurrent] = useState(0);
  const structure = structures[current];

  const exercises = orderExercises(topic.id, structure?.examples ?? [], 4, current);

  // Un ejercicio a la vez: antes se apilaban los cuatro de la estructura, y con
  // las siete del primer tema eso era un scroll de tableros idénticos.
  const [exIdx, setExIdx] = useState(0);
  useEffect(() => { setExIdx(0); }, [current]);

  if (!structure) {
    return (
      <SectionCard>
        <EmptyNote>Este tema todavía no tiene estructuras.</EmptyNote>
      </SectionCard>
    );
  }

  /* ── Selector de estructura ── */
  const selector = structures.length > 1 && (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {structures.map((s, i) => (
        <button
          key={i}
          onClick={() => setCurrent(i)}
          title={s.title}
          className={`shrink-0 max-w-[14rem] rounded-xl border px-3.5 py-2 text-left transition-all ${
            i === current
              ? `bg-gradient-to-r ${TH.grad} text-white border-transparent shadow-sm`
              : 'bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">
            Patrón {i + 1}
          </span>
          <span className="block text-xs font-bold truncate">{s.title}</span>
        </button>
      ))}
    </div>
  );

  /* ── Estudiar: la explicación y sus ejemplos ── */
  if (mode === 'estudiar') {
    return (
      <div className="space-y-4">
        {selector}

        <SectionCard>
          <SectionHeader
            block="estructura"
            title={structure.title}
            subtitle={structure.explanation}
            right={
              structures.length > 1
                ? <CountPill block="estructura">{current + 1} / {structures.length}</CountPill>
                : undefined
            }
          />

          {(structure.examples ?? []).length === 0 ? (
            <EmptyNote>Esta estructura todavía no tiene ejemplos.</EmptyNote>
          ) : (
            <ol className="space-y-2.5">
              {(structure.examples ?? []).map((ex, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 rounded-2xl border ${TH.ring} ${TH.soft} px-4 py-3`}
                >
                  <span className={`shrink-0 w-6 h-6 grid place-items-center rounded-full bg-card text-[11px] font-extrabold ${TH.text} tabular-nums`}>
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm sm:text-[15px] font-semibold leading-snug">{ex}</p>
                  <button
                    onClick={() => speak(ex)}
                    aria-label={`Escuchar «${ex}»`}
                    title="Escuchar"
                    className={`shrink-0 w-9 h-9 grid place-items-center rounded-full border ${TH.ring} bg-card ${TH.text} transition-transform hover:scale-110 active:scale-95`}
                  >
                    <span aria-hidden="true">🔊</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>
    );
  }

  /* ── Practicar: ordenar las palabras, de uno en uno ── */
  if (exercises.length === 0) {
    return (
      <div className="space-y-4">
        {selector}
        <SectionCard>
          <EmptyNote>Esta estructura no tiene frases lo bastante largas para ordenar.</EmptyNote>
        </SectionCard>
      </div>
    );
  }

  const safeIdx = Math.min(exIdx, exercises.length - 1);
  const ex = exercises[safeIdx];
  const placedIds = order[ex.key] ?? [];
  const done = orderDone[ex.key] ?? false;
  const placed = placedIds.map(id => ex.tiles.find(t => t.id === id)!).filter(Boolean);
  const ok = isOrderCorrect(placed, ex.target);
  const available = ex.tiles.filter(t => !placedIds.includes(t.id));
  const doneCount = exercises.filter(e => orderDone[e.key]).length;
  const isLast = safeIdx === exercises.length - 1;

  return (
    <div className="space-y-4">
      {selector}

      <SectionCard>
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold tabular-nums text-muted-foreground">
              Ejercicio {safeIdx + 1} <span className="opacity-60">de {exercises.length}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">✓ {doneCount}</span>
          </div>
          <ProgressTrack value={doneCount} total={exercises.length} block="estructura" />
        </div>

        <p className={`text-xs font-bold uppercase tracking-wide ${TH.text} mb-1`}>Ordena las palabras</p>
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight mb-5">
          Arma la frase tocando las fichas en orden
        </h3>

        {/* Lo que el alumno va montando */}
        <div
          className={`min-h-[64px] flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${
            done
              ? ok
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
              : `${TH.ring} ${TH.soft}`
          }`}
        >
          {placed.length === 0 && (
            <span className="text-xs text-muted-foreground/70 px-1">
              Toca las palabras de abajo para colocarlas aquí.
            </span>
          )}
          {placed.map((t, i) => (
            <button
              key={`${ex.key}-p-${t.id}`}
              disabled={done}
              onClick={() => onOrder(ex.key, placedIds.filter((_, j) => j !== i))}
              title={done ? undefined : 'Quitar'}
              className={`rounded-xl px-3.5 py-2 text-sm font-bold shadow-sm transition-all ${
                done
                  ? ok
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-400 text-white'
                  : 'bg-card border border-border/60 hover:border-rose-300 hover:text-rose-600 active:scale-95'
              }`}
            >
              {t.text}
            </button>
          ))}
        </div>

        {/* Las fichas por colocar */}
        <div className="flex flex-wrap gap-2 mt-4 min-h-[44px]">
          {available.map(t => (
            <button
              key={`${ex.key}-a-${t.id}`}
              disabled={done}
              onClick={() => onOrder(ex.key, [...placedIds, t.id])}
              className="rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm font-semibold transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm active:scale-95 disabled:opacity-40"
            >
              {t.text}
            </button>
          ))}
          {available.length === 0 && !done && (
            <span className="text-xs text-muted-foreground/70 self-center">
              Ya colocaste todas. Pulsa «Verificar».
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {!done ? (
            <>
              <button
                disabled={placed.length !== ex.tiles.length}
                onClick={() => onOrderDone(ex.key, true)}
                className={`rounded-xl bg-gradient-to-r ${TH.grad} px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-40`}
              >
                Verificar
              </button>
              {placed.length > 0 && (
                <button
                  onClick={() => onOrder(ex.key, [])}
                  className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Vaciar
                </button>
              )}
            </>
          ) : (
            <>
              <p className={`flex-1 text-sm font-bold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {ok ? '¡Perfecto!' : <>La frase era: <span className="font-extrabold">{ex.target}</span></>}
              </p>
              <button
                onClick={() => speak(ex.target)}
                aria-label="Escuchar la frase correcta"
                title="Escuchar"
                className={`shrink-0 w-10 h-10 grid place-items-center rounded-full border ${TH.ring} ${TH.soft} ${TH.text} transition-transform hover:scale-110 active:scale-95`}
              >
                <span aria-hidden="true">🔊</span>
              </button>
              <button
                onClick={() => { onOrder(ex.key, []); onOrderDone(ex.key, false); }}
                className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Reintentar
              </button>
              {!isLast && (
                <button
                  onClick={() => setExIdx(i => Math.min(i + 1, exercises.length - 1))}
                  className={`rounded-xl bg-gradient-to-r ${TH.grad} px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-95`}
                >
                  Siguiente →
                </button>
              )}
            </>
          )}
        </div>

        {exercises.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <button
              onClick={() => setExIdx(i => Math.max(i - 1, 0))}
              disabled={safeIdx === 0}
              className="text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-40 disabled:hover:text-muted-foreground"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setExIdx(i => Math.min(i + 1, exercises.length - 1))}
              disabled={isLast}
              className="text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-40 disabled:hover:text-muted-foreground"
            >
              Saltar →
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
