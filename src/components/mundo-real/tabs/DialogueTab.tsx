import { dialogueChoice } from '@/lib/mundoRealExercises';
import type { MRTabProps } from '../types';

export function DialogueTab({ topic, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  // Cada turno interactivo se precalcula con sus opciones ya barajadas y la
  // correcta capturada como texto. Antes las opciones salían en el orden del
  // array y la correcta era siempre la primera.
  let bIndex = 0;
  const lines = (topic.dialogue ?? []).map(line => {
    const choice = line.speaker === 'B' ? dialogueChoice(topic.id, line, bIndex) : null;
    if (choice) bIndex++;
    return { line, choice };
  });

  const choices = lines.map(l => l.choice).filter(Boolean) as NonNullable<ReturnType<typeof dialogueChoice>>[];
  const answered = choices.filter(c => answers[c.key] !== undefined).length;
  const allDone = choices.length > 0 && answered === choices.length;

  return (
    <div className="space-y-4">
      {/* Mientras queden turnos por responder solo se leen las líneas de la otra
          persona: leer la conversación entera sería cantar las respuestas. */}
      <div className="flex justify-end">
        <button
          onClick={() => speak(
            lines
              .map(({ line, choice }) => (choice ? (allDone ? answers[choice.key] : '') : line.text))
              .filter(t => t && t !== '___')
              .join('. '),
          )}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >🔊 {allDone ? 'Escuchar la conversación' : 'Escuchar a la otra persona'}</button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
        {lines.map(({ line, choice }, li) => {
          const isB = line.speaker === 'B';
          const chosen = choice ? answers[choice.key] : undefined;
          // Los turnos del alumno se revelan de uno en uno.
          const myIdx = choice ? choices.findIndex(c => c.key === choice.key) : -1;
          const prevAnswered = myIdx <= 0 || answers[choices[myIdx - 1].key] !== undefined;
          if (choice && !prevAnswered) return null;

          return (
            <div key={li} className={`flex ${isB ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${isB ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <span className="text-xs text-muted-foreground px-1">{isB ? 'Tú' : 'A'}</span>

                {!choice ? (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium flex items-start gap-2 ${isB ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                    <span className="flex-1">{line.text}</span>
                    <button onClick={() => speak(line.text)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity" title="Escuchar">🔊</button>
                  </div>
                ) : chosen !== undefined ? (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${chosen === choice.correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'} rounded-br-sm`}>
                    <span className="flex items-start gap-2">
                      <span className="flex-1">{chosen}</span>
                      <button onClick={() => speak(choice.correct)} className="shrink-0 opacity-80 hover:opacity-100" title="Escuchar">🔊</button>
                    </span>
                    {chosen !== choice.correct && (
                      <span className="block text-xs mt-0.5 opacity-80">✓ {choice.correct}</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {choice.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => onAnswer(choice.key, opt)}
                        className="block w-full text-left px-4 py-2 rounded-xl border border-border/60 bg-background text-sm hover:border-primary/60 hover:bg-primary/5 transition-all"
                      >{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="rounded-2xl border border-green-400 bg-green-50 dark:bg-green-950/20 p-4 text-center">
          <p className="font-bold text-green-700 dark:text-green-400">
            🎉 ¡Diálogo completado! Acertaste {choices.filter(c => answers[c.key] === c.correct).length} de {choices.length} respuestas.
          </p>
          <button onClick={() => onResetBlock('d:')} className="mt-2 text-xs text-green-700 dark:text-green-400 underline">
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
