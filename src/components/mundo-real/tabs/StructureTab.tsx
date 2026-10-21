import { orderExercises, isOrderCorrect } from '@/lib/mundoRealExercises';
import type { MRTabProps } from '../types';

interface StructureTabProps extends MRTabProps {
  /** Fichas colocadas por ejercicio, por su id. Vive arriba para sobrevivir al cambio de pestaña. */
  order: Record<string, number[]>;
  orderDone: Record<string, boolean>;
  onOrder: (key: string, ids: number[]) => void;
  onOrderDone: (key: string, done: boolean) => void;
}

export function StructureTab({
  topic, speak, order, orderDone, onOrder, onOrderDone,
}: StructureTabProps) {
  const exercises = orderExercises(topic.id, topic.structure?.examples ?? []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 space-y-3">
        <h2 className="font-extrabold text-base">{topic.structure?.title}</h2>
        <p className="text-sm text-muted-foreground">{topic.structure?.explanation}</p>
        <div className="space-y-1.5">
          {(topic.structure?.examples ?? []).map((ex, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => speak(ex)} className="text-primary hover:opacity-70 transition-opacity" title="Escuchar">🔊</button>
              <p className="text-sm font-medium italic">"{ex}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ordenar las palabras.
          Antes había un solo ejercicio por tema y era imposible: mostraba
          examples[2] como objetivo pero repartía las fichas de structure.words,
          que formaban otra frase. Y si el tema no llegaba a tres ejemplos, el
          objetivo era literalmente "undefined". Ahora las fichas salen de la
          propia frase objetivo, con la puntuación pegada a su palabra. */}
      {exercises.map(ex => {
        const placedIds = order[ex.key] ?? [];
        const done = orderDone[ex.key] ?? false;
        const placed = placedIds.map(id => ex.tiles.find(t => t.id === id)!).filter(Boolean);
        const ok = isOrderCorrect(placed, ex.target);
        const available = ex.tiles.filter(t => !placedIds.includes(t.id));

        return (
          <div key={ex.key} className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-sm">🎯 Ordena las palabras</h3>

            <div className="flex flex-wrap gap-2">
              {available.map(t => (
                <button
                  key={t.id}
                  disabled={done}
                  onClick={() => onOrder(ex.key, [...placedIds, t.id])}
                  className="px-3 py-1 rounded-lg border border-border/60 bg-background text-sm font-medium hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-40"
                >{t.text}</button>
              ))}
            </div>

            <div className="min-h-[40px] flex flex-wrap gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 p-2">
              {placed.map((t, i) => (
                <button
                  key={`${ex.key}-${t.id}`}
                  disabled={done}
                  onClick={() => onOrder(ex.key, placedIds.filter((_, j) => j !== i))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${
                    done
                      ? ok ? 'bg-green-500 text-white border-green-500' : 'bg-red-400 text-white border-red-400'
                      : 'bg-primary/10 text-primary border-primary/40 hover:bg-red-50 hover:border-red-300'
                  }`}
                >{t.text}</button>
              ))}
              {placed.length === 0 && (
                <span className="text-xs text-muted-foreground/60 self-center">Haz clic en las palabras para ordenarlas</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                disabled={placed.length !== ex.tiles.length || done}
                onClick={() => onOrderDone(ex.key, true)}
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40"
              >Verificar</button>
              <button
                onClick={() => { onOrder(ex.key, []); onOrderDone(ex.key, false); }}
                className="px-4 py-1.5 rounded-xl border border-border/60 text-xs font-medium hover:bg-muted"
              >Reiniciar</button>
            </div>

            {done && (
              <p className={`text-sm font-semibold ${ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {ok ? '✅ ¡Perfecto!' : `❌ La respuesta correcta es: "${ex.target}"`}
              </p>
            )}
          </div>
        );
      })}

      {exercises.length === 0 && (
        <p className="text-xs text-muted-foreground">Este tema todavía no tiene frases largas para ordenar.</p>
      )}
    </div>
  );
}
