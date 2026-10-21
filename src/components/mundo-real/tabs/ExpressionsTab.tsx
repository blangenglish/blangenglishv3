import { expressionItems } from '@/lib/mundoRealExercises';
import { Choice, BlockScore } from '../ExercisePieces';
import type { MRTabProps } from '../types';

export function ExpressionsTab({ topic, allTopics, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  // Los distractores salen también de otros temas de la misma categoría: con 5
  // expresiones por tema, si solo se usaran las del propio tema las cuatro
  // opciones serían idénticas en todos los ítems y se acertaría por descarte.
  const pool = allTopics
    .filter(t => t.category === topic.category && t.id !== topic.id)
    .flatMap(t => (t.expressions ?? []).map(e => e.meaning));
  const items = expressionItems(topic.id, topic.expressions ?? [], pool);

  return (
    <div className="space-y-3">
      {mode === 'estudiar' && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
          {(topic.expressions ?? []).map((e, i) => (
            <div key={i} className="p-4 flex gap-3 items-start">
              <button onClick={() => speak(e.expression)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary mt-0.5 shrink-0" title="Escuchar">🔊</button>
              <div className="flex-1">
                <p className="font-bold text-sm">"{e.expression}"</p>
                <p className="text-muted-foreground text-xs mt-0.5">💡 {e.meaning}</p>
                <p className="text-xs italic text-muted-foreground/80 mt-1 border-l-2 border-primary/30 pl-2">"{e.example}"</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">🎯 ¿Qué significa esta expresión?</h3>
          {items.map(item => (
            <Choice key={item.key} item={item} cols={1} answers={answers} onAnswer={onAnswer} />
          ))}
          <BlockScore items={items} prefix="e:" answers={answers} onResetBlock={onResetBlock} />
        </div>
      )}
    </div>
  );
}
