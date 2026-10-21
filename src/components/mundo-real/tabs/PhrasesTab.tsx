import { phraseItems } from '@/lib/mundoRealExercises';
import { Choice, BlockScore } from '../ExercisePieces';
import type { MRTabProps } from '../types';

export function PhrasesTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  const items = phraseItems(topic.id, topic.phrases ?? []);

  return (
    <div className="space-y-4">
      {mode === 'estudiar' && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
          {(topic.phrases ?? []).map((p, i) => (
            <div key={i} className="p-4 flex gap-3 items-start">
              <button onClick={() => speak(p.phrase.replace('___', p.missing))} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary mt-0.5" title="Escuchar">🔊</button>
              <div>
                <p className="font-bold text-sm">{p.phrase.replace('___', p.missing)}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{p.meaning}</p>
                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Cuándo: {p.when}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-sm">🎯 Completa la frase</h3>
        {items.map(item => (
          <Choice key={item.key} item={item} cols={2} answers={answers} onAnswer={onAnswer} />
        ))}
        <BlockScore items={items} prefix="p:" answers={answers} onResetBlock={onResetBlock} />
      </div>
    </div>
  );
}
