import { vocabItems } from '@/lib/mundoRealExercises';
import { Choice, BlockScore } from '../ExercisePieces';
import type { MRTabProps } from '../types';

export function VocabTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  // Función pura con barajado determinista: recalcular en cada render devuelve
  // siempre el mismo orden, así que no hace falta memorizarla.
  const items = vocabItems(topic.id, topic.vocabulary ?? []);

  return (
    <div className="space-y-4">
      {mode === 'estudiar' && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
          {(topic.vocabulary ?? []).map((v, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <button onClick={() => speak(v.word)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary" title="Escuchar">🔊</button>
              <div className="flex-1">
                <span className="font-bold text-base">{v.word}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="text-muted-foreground text-sm">{v.translation}</span>
                <p className="text-xs text-muted-foreground/80 italic mt-0.5">"{v.example}"</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-sm">🎯 ¿Cuál es la traducción?</h3>
        {items.map(item => (
          <Choice key={item.key} item={item} cols={2} answers={answers} onAnswer={onAnswer} />
        ))}
        <BlockScore items={items} prefix="v:" answers={answers} onResetBlock={onResetBlock} />
      </div>
    </div>
  );
}
