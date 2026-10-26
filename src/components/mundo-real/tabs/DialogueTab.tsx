import { useState, useEffect } from 'react';
import { dialogueChoice } from '@/lib/mundoRealExercises';
import {
  BLOCK_THEME, SectionCard, SectionHeader, CountPill, ProgressTrack, ScoreRing, EmptyNote,
} from '../ui';
import type { MRTabProps } from '../types';

const TH = BLOCK_THEME.dialogo;

export function DialogueTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  // Un tema puede traer varias conversaciones (pedir mesa, reclamar, pagar…).
  const dialogues = topic.dialogues ?? (topic.dialogue?.length
    ? [{ id: 'base', title: 'Conversación principal', lines: topic.dialogue }]
    : []);
  const [current, setCurrent] = useState(0);
  useEffect(() => { setCurrent(c => Math.min(c, Math.max(0, dialogues.length - 1))); }, [dialogues.length]);

  const dialogue = dialogues[Math.min(current, Math.max(0, dialogues.length - 1))];

  if (!dialogue) {
    return (
      <SectionCard>
        <EmptyNote>Este tema todavía no tiene conversaciones.</EmptyNote>
      </SectionCard>
    );
  }

  // Cada turno interactivo se precalcula con sus opciones ya barajadas y la
  // correcta capturada como texto.
  let bIndex = 0;
  const lines = (dialogue.lines ?? []).map(line => {
    const choice = line.speaker === 'B' ? dialogueChoice(topic.id, line, bIndex, current) : null;
    if (choice) bIndex++;
    return { line, choice };
  });

  const choices = lines.map(l => l.choice).filter(Boolean) as NonNullable<ReturnType<typeof dialogueChoice>>[];
  const answered = choices.filter(c => answers[c.key] !== undefined).length;
  const hits = choices.filter(c => answers[c.key] === c.correct).length;
  const allDone = choices.length > 0 && answered === choices.length;

  /** El texto que corresponde a una línea: el del dato, o la opción correcta. */
  const textOf = (line: { text: string }, choice: { correct: string } | null) =>
    choice ? choice.correct : line.text;

  /* ── Selector de conversación ── */
  const selector = dialogues.length > 1 && (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {dialogues.map((d, i) => {
        const dDone = (() => {
          let b = 0;
          const cs = (d.lines ?? []).map(l => {
            const c = l.speaker === 'B' ? dialogueChoice(topic.id, l, b, i) : null;
            if (c) b++;
            return c;
          }).filter(Boolean) as { key: string }[];
          return cs.length > 0 && cs.every(c => answers[c.key] !== undefined);
        })();

        return (
          <button
            key={d.id ?? i}
            onClick={() => setCurrent(i)}
            title={d.title}
            className={`shrink-0 max-w-[14rem] rounded-xl border px-3.5 py-2 text-left transition-all ${
              i === current
                ? `bg-gradient-to-r ${TH.grad} text-white border-transparent shadow-sm`
                : 'bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">
              {dDone ? '✓ Completada' : `Conversación ${i + 1}`}
            </span>
            <span className="block text-xs font-bold truncate">{d.title}</span>
          </button>
        );
      })}
    </div>
  );

  /* ── Estudiar: leer y escuchar la conversación entera ── */
  if (mode === 'estudiar') {
    return (
      <div className="space-y-4">
        {selector}

        <SectionCard>
          <SectionHeader
            block="dialogo"
            title={dialogue.title || 'Conversación'}
            subtitle="Léela y escúchala completa antes de practicarla."
            right={
              <button
                onClick={() => speak(lines.map(({ line, choice }) => textOf(line, choice)).filter(t => t && t !== '___').join('. '))}
                className={`inline-flex items-center gap-1.5 rounded-xl border ${TH.ring} ${TH.soft} ${TH.text} px-3.5 py-2 text-xs font-bold transition-transform hover:scale-105 active:scale-95`}
              >
                <span aria-hidden="true">🔊</span> Escuchar todo
              </button>
            }
          />

          <div className="space-y-3">
            {lines.map(({ line, choice }, li) => {
              const isB = line.speaker === 'B';
              const text = textOf(line, choice);
              return (
                <div key={li} className={`flex ${isB ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col gap-1 max-w-[88%] sm:max-w-[75%] ${isB ? 'items-end' : 'items-start'}`}>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground px-1">
                      {isB ? 'Tú' : 'La otra persona'}
                    </span>
                    <div
                      className={`flex items-start gap-2.5 px-4 py-3 text-sm sm:text-[15px] font-medium leading-relaxed shadow-sm ${
                        isB
                          ? `bg-gradient-to-br ${TH.grad} text-white rounded-2xl rounded-br-md`
                          : 'bg-muted text-foreground rounded-2xl rounded-bl-md'
                      }`}
                    >
                      <span className="flex-1">{text}</span>
                      <button
                        onClick={() => speak(text)}
                        aria-label="Escuchar esta línea"
                        title="Escuchar"
                        className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
                      >
                        <span aria-hidden="true">🔊</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    );
  }

  /* ── Practicar: elegir qué dices tú ── */
  return (
    <div className="space-y-4">
      {selector}

      <SectionCard>
        <SectionHeader
          block="dialogo"
          title={dialogue.title || 'Conversación'}
          subtitle="Elige en cada turno qué dirías tú."
          right={<CountPill block="dialogo">{answered} / {choices.length}</CountPill>}
        />

        {choices.length > 0 && (
          <div className="mb-5">
            <ProgressTrack value={answered} total={choices.length} block="dialogo" />
          </div>
        )}

        {/* Mientras queden turnos por responder solo se puede escuchar a la otra
            persona: leer la conversación entera sería cantar las respuestas. */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => speak(
              lines
                .map(({ line, choice }) => (choice ? (allDone ? answers[choice.key] : '') : line.text))
                .filter(t => t && t !== '___')
                .join('. '),
            )}
            className={`inline-flex items-center gap-1.5 rounded-xl border ${TH.ring} ${TH.soft} ${TH.text} px-3.5 py-2 text-xs font-bold transition-transform hover:scale-105 active:scale-95`}
          >
            <span aria-hidden="true">🔊</span>
            {allDone ? 'Escuchar la conversación' : 'Escuchar a la otra persona'}
          </button>
        </div>

        <div className="space-y-3">
          {lines.map(({ line, choice }, li) => {
            const isB = line.speaker === 'B';
            const chosen = choice ? answers[choice.key] : undefined;

            // Los turnos del alumno se revelan de uno en uno.
            const myIdx = choice ? choices.findIndex(c => c.key === choice.key) : -1;
            const prevAnswered = myIdx <= 0 || answers[choices[myIdx - 1].key] !== undefined;
            if (choice && !prevAnswered) return null;

            return (
              <div key={li} className={`flex ${isB ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-1 max-w-[88%] sm:max-w-[75%] ${isB ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground px-1">
                    {isB ? 'Tú' : 'La otra persona'}
                  </span>

                  {!choice ? (
                    <div className="flex items-start gap-2.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm sm:text-[15px] font-medium leading-relaxed shadow-sm">
                      <span className="flex-1">{line.text}</span>
                      <button
                        onClick={() => speak(line.text)}
                        aria-label="Escuchar esta línea"
                        title="Escuchar"
                        className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
                      >
                        <span aria-hidden="true">🔊</span>
                      </button>
                    </div>
                  ) : chosen !== undefined ? (
                    <div
                      className={`rounded-2xl rounded-br-md px-4 py-3 text-sm sm:text-[15px] font-medium leading-relaxed shadow-sm ${
                        chosen === choice.correct ? 'bg-emerald-500 text-white' : 'bg-rose-400 text-white'
                      }`}
                    >
                      <span className="flex items-start gap-2.5">
                        <span className="flex-1">{chosen}</span>
                        <button
                          onClick={() => speak(choice.correct)}
                          aria-label="Escuchar la respuesta correcta"
                          title="Escuchar"
                          className="shrink-0 opacity-80 transition-opacity hover:opacity-100"
                        >
                          <span aria-hidden="true">🔊</span>
                        </button>
                      </span>
                      {chosen !== choice.correct && (
                        <span className="mt-1.5 block border-t border-white/25 pt-1.5 text-xs opacity-95">
                          ✓ {choice.correct}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      {choice.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => onAnswer(choice.key, opt)}
                          className="block w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-left text-sm font-medium leading-snug transition-all hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {choices.length === 0 && (
          <EmptyNote>Esta conversación no tiene turnos para practicar. Léela en «Estudiar».</EmptyNote>
        )}

        {allDone && (
          <div className="mt-6 pt-5 border-t border-border/50 flex flex-col sm:flex-row items-center gap-5">
            <ScoreRing hits={hits} total={choices.length} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-extrabold text-lg tracking-tight">
                {hits === choices.length ? '¡Conversación perfecta!' : '¡Conversación completada!'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Acertaste <strong className="text-foreground tabular-nums">{hits}</strong> de{' '}
                <span className="tabular-nums">{choices.length}</span> respuestas.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <button
                  onClick={() => onResetBlock(`d:${current}.`)}
                  className="rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  ↻ Intentar de nuevo
                </button>
                {current < dialogues.length - 1 && (
                  <button
                    onClick={() => setCurrent(current + 1)}
                    className={`rounded-xl bg-gradient-to-r ${TH.grad} px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-95`}
                  >
                    Siguiente conversación →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
