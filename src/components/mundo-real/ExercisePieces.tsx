/**
 * Las dos piezas que comparten los cuatro bloques de opción múltiple
 * (vocabulario, frases, expresiones y phrasal verbs).
 */
import type { MCItem } from '@/lib/mundoRealExercises';

interface ChoiceProps {
  item: MCItem;
  cols: 1 | 2;
  answers: Record<string, string>;
  onAnswer: (key: string, text: string) => void;
}

/** Un ejercicio de opción múltiple. La respuesta se guarda y se compara por texto. */
export function Choice({ item, cols, answers, onAnswer }: ChoiceProps) {
  const chosen = answers[item.key];
  const ok = chosen === item.correct;

  return (
    <div
      className={`rounded-xl border p-3 ${
        chosen !== undefined
          ? ok
            ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
            : 'border-red-400 bg-red-50 dark:bg-red-950/20'
          : 'border-border/40'
      }`}
    >
      <p className="font-semibold text-sm mb-2">"{item.prompt}"</p>
      <div className={`grid gap-1.5 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {item.options.map(opt => (
          <button
            key={opt}
            disabled={chosen !== undefined}
            onClick={() => onAnswer(item.key, opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
              chosen !== undefined
                ? opt === item.correct
                  ? 'bg-green-500 text-white border-green-500'
                  : chosen === opt
                    ? 'bg-red-400 text-white border-red-400'
                    : 'bg-muted/40 text-muted-foreground border-border/40'
                : 'bg-background border-border/60 hover:border-primary/60 hover:bg-primary/5'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {chosen !== undefined && (
        <p className={`text-xs mt-1.5 font-semibold ${ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {ok ? '✅ ¡Correcto!' : `❌ Era: ${item.correct}`}
        </p>
      )}
    </div>
  );
}

interface BlockScoreProps {
  items: MCItem[];
  prefix: string;
  answers: Record<string, string>;
  onResetBlock: (prefix: string) => void;
}

/** Marcador del bloque y botón para repetirlo sin salir del tema. */
export function BlockScore({ items, prefix, answers, onResetBlock }: BlockScoreProps) {
  const done = items.filter(it => answers[it.key] !== undefined).length;
  const hits = items.filter(it => answers[it.key] === it.correct).length;
  if (done === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-xs pt-1">
      <span className={done === items.length ? 'font-bold text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
        {done === items.length ? `🎉 ${hits} de ${items.length} correctas` : `${done} de ${items.length} respondidas`}
      </span>
      <button onClick={() => onResetBlock(prefix)} className="underline text-muted-foreground hover:text-primary">
        Repetir
      </button>
    </div>
  );
}
