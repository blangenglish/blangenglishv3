/**
 * El reproductor de los bloques de opción múltiple.
 *
 * Sustituye al apilado anterior, donde los cuatro bloques pintaban TODOS sus
 * ejercicios de golpe, uno debajo de otro. Con los temas ampliados eso son 74
 * preguntas de vocabulario y 37 de frases en un mismo scroll: el alumno no sabe
 * cuánto le queda y la pantalla no tiene forma.
 *
 * Aquí se ve una pregunta a la vez, con su avance arriba y un resumen al final.
 * El estado de verdad siguen siendo las `answers` de la sección, idénticas a
 * antes (clave por contenido, respuesta por texto): este componente solo
 * recuerda en qué pregunta va, así que el progreso guardado no cambia.
 */
import { useState, useEffect, useRef } from 'react';
import type { MCItem } from '@/lib/mundoRealExercises';
import type { MRBlockId } from './types';
import { BLOCK_THEME, SectionCard, ProgressTrack, ScoreRing, EmptyNote } from './ui';

interface QuizRunnerProps {
  block: MRBlockId;
  items: MCItem[];
  /** La pregunta que se repite, p. ej. «¿Cuál es la traducción?». */
  question: string;
  /** Una columna para textos largos (significados), dos para palabras. */
  cols: 1 | 2;
  answers: Record<string, string>;
  onAnswer: (key: string, text: string) => void;
  /**
   * Borra las respuestas de ESTOS ítems. Lo decide quien usa el reproductor,
   * porque con secciones hay que poder repetir una sin perder las demás.
   */
  onReset: () => void;
  /** Si se puede escuchar el enunciado (vocabulario, expresiones, verbos). */
  speak?: (text: string) => void;
}

/** La primera sin responder: al volver al tema se retoma donde se dejó. */
function firstUnanswered(items: MCItem[], answers: Record<string, string>): number {
  const i = items.findIndex(it => answers[it.key] === undefined);
  return i === -1 ? Math.max(0, items.length - 1) : i;
}

export function QuizRunner({
  block, items, question, cols,
  answers, onAnswer, onReset, speak,
}: QuizRunnerProps) {
  const th = BLOCK_THEME[block];

  const [idx, setIdx] = useState(() => firstUnanswered(items, answers));
  const answeredCount = items.filter(it => answers[it.key] !== undefined).length;

  // Al pulsar «Repetir» las respuestas se borran desde arriba; el cursor tiene
  // que volver a la primera o el alumno se quedaría mirando la última.
  const prevAnswered = useRef(answeredCount);
  useEffect(() => {
    if (prevAnswered.current > 0 && answeredCount === 0) setIdx(0);
    prevAnswered.current = answeredCount;
  }, [answeredCount]);

  if (items.length === 0) {
    return <EmptyNote>Este bloque todavía no tiene ejercicios.</EmptyNote>;
  }

  const hits = items.filter(it => answers[it.key] === it.correct).length;
  const allDone = answeredCount === items.length;

  /* ── Resumen final ── */
  if (allDone) {
    const misses = items.filter(it => answers[it.key] !== it.correct);
    return (
      <SectionCard>
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7">
          <ScoreRing hits={hits} total={items.length} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
              {hits === items.length ? '¡Perfecto!' : hits * 2 >= items.length ? '¡Buen trabajo!' : 'Sigue practicando'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Acertaste <strong className="text-foreground tabular-nums">{hits}</strong> de{' '}
              <span className="tabular-nums">{items.length}</span>.
            </p>
            <button
              onClick={onReset}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${th.grad} px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-95`}
            >
              <span aria-hidden="true">↻</span> Repetir el bloque
            </button>
          </div>
        </div>

        {misses.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border/50">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Para repasar ({misses.length})
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {misses.map(it => (
                <li key={it.key} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                  <p className="text-sm font-bold leading-snug break-words">{it.prompt}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 leading-snug">✓ {it.correct}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Tu respuesta: {answers[it.key] || '—'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>
    );
  }

  /* ── Una pregunta ── */
  const safeIdx = Math.min(idx, items.length - 1);
  const item = items[safeIdx];
  const chosen = answers[item.key];
  const ok = chosen === item.correct;
  const isLast = safeIdx === items.length - 1;

  const goNext = () => setIdx(i => Math.min(i + 1, items.length - 1));
  const goPrev = () => setIdx(i => Math.max(i - 1, 0));

  return (
    <SectionCard>
      {/* Avance */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold tabular-nums text-muted-foreground">
            Pregunta {safeIdx + 1} <span className="opacity-60">de {items.length}</span>
          </span>
          <span className="tabular-nums text-muted-foreground">
            {answeredCount > 0 && <>✓ {hits} / {answeredCount} </>}
          </span>
        </div>
        <ProgressTrack value={answeredCount} total={items.length} block={block} />
      </div>

      {/* Enunciado */}
      <p className={`text-xs font-bold uppercase tracking-wide ${th.text} mb-2`}>{question}</p>
      <div className="flex items-start gap-3 mb-5">
        <h3 className="flex-1 text-xl sm:text-2xl font-extrabold leading-snug tracking-tight break-words">
          {item.prompt}
        </h3>
        {speak && (
          <button
            onClick={() => speak(item.prompt)}
            aria-label={`Escuchar «${item.prompt}»`}
            title="Escuchar"
            className={`shrink-0 w-11 h-11 grid place-items-center rounded-full border ${th.ring} ${th.soft} ${th.text} text-lg transition-transform hover:scale-110 active:scale-95`}
          >
            <span aria-hidden="true">🔊</span>
          </button>
        )}
      </div>

      {/* Opciones */}
      <div className={`grid gap-2.5 ${cols === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {item.options.map(opt => {
          const state = chosen === undefined
            ? 'idle'
            : opt === item.correct ? 'right'
            : chosen === opt ? 'wrong'
            : 'muted';

          return (
            <button
              key={opt}
              disabled={chosen !== undefined}
              onClick={() => onAnswer(item.key, opt)}
              className={`rounded-2xl border px-4 py-3.5 text-left text-sm font-medium leading-snug transition-all ${
                state === 'idle'
                  ? 'border-border/60 bg-background hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]'
                  : state === 'right'
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                    : state === 'wrong'
                      ? 'border-rose-400 bg-rose-400 text-white'
                      : 'border-border/40 bg-muted/30 text-muted-foreground opacity-70'
              }`}
            >
              {state === 'right' && <span aria-hidden="true" className="mr-1.5">✓</span>}
              {state === 'wrong' && <span aria-hidden="true" className="mr-1.5">✗</span>}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Reacción y navegación */}
      <div className="mt-5 flex items-center gap-3 min-h-[44px]">
        {chosen !== undefined ? (
          <>
            <p className={`flex-1 text-sm font-bold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {ok ? '¡Correcto!' : `La respuesta era: ${item.correct}`}
            </p>
            {!isLast && (
              <button
                onClick={goNext}
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${th.grad} px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-95`}
              >
                Siguiente <span aria-hidden="true">→</span>
              </button>
            )}
          </>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground">Elige una opción para continuar.</p>
        )}
      </div>

      {/* Saltar de pregunta sin responder, para no quedarse atascado. */}
      {items.length > 1 && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={safeIdx === 0}
            className="text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-40 disabled:hover:text-muted-foreground"
          >
            ← Anterior
          </button>
          {answeredCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground underline hover:text-primary"
            >
              Empezar de nuevo
            </button>
          )}
          <button
            onClick={goNext}
            disabled={isLast}
            className="text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-40 disabled:hover:text-muted-foreground"
          >
            Saltar →
          </button>
        </div>
      )}
    </SectionCard>
  );
}
