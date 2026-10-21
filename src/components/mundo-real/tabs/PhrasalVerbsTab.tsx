import { phrasalItems } from '@/lib/mundoRealExercises';
import { Choice, BlockScore } from '../ExercisePieces';
import type { MRTabProps } from '../types';

export function PhrasalVerbsTab({ topic, allTopics, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  const pool = allTopics
    .filter(t => t.category === topic.category && t.id !== topic.id)
    .flatMap(t => (t.phrasalVerbs ?? []).map(p => p.meaning));
  const items = phrasalItems(topic.id, topic.phrasalVerbs ?? [], pool);

  return (
    <div className="space-y-3">
      {mode === 'estudiar' && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
          {(topic.phrasalVerbs ?? []).map((pv, i) => (
            <div key={i} className="p-4 flex gap-3 items-start">
              <button onClick={() => speak(pv.verb)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary mt-0.5 shrink-0" title="Escuchar">🔊</button>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-bold text-sm text-primary">{pv.verb}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="text-sm text-muted-foreground">{pv.meaning}</span>
                </div>
                <p className="text-xs italic text-muted-foreground/80 mt-1 border-l-2 border-primary/30 pl-2">"{pv.example}"</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">🎯 ¿Cuál es el significado?</h3>
          {items.map(item => (
            <Choice key={item.key} item={item} cols={1} answers={answers} onAnswer={onAnswer} />
          ))}
          <BlockScore items={items} prefix="pv:" answers={answers} onResetBlock={onResetBlock} />
        </div>
      )}
    </div>
  );
}
