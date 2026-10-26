import { expressionItems } from '@/lib/mundoRealExercises';
import { QuizRunner } from '../QuizRunner';
import { SectionCard, SectionHeader, CountPill, StudyGrid, TermCard, FilterField, useTextFilter, EmptyNote } from '../ui';
import type { MRTabProps } from '../types';

export function ExpressionsTab({ topic, allTopics, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  // Los distractores salen también de otros temas de la misma categoría: con 5
  // expresiones por tema, si solo se usaran las del propio tema las cuatro
  // opciones serían idénticas en todos los ítems y se acertaría por descarte.
  const pool = allTopics
    .filter(t => t.category === topic.category && t.id !== topic.id)
    .flatMap(t => (t.expressions ?? []).map(e => e.meaning));
  const items = expressionItems(topic.id, topic.expressions ?? [], pool);
  const expressions = topic.expressions ?? [];
  const { query, setQuery, filtered } = useTextFilter(expressions, e => [e.expression, e.meaning]);

  if (mode === 'practicar') {
    return (
      <QuizRunner
        block="expresiones"
        items={items}
        question="¿Qué significa esta expresión?"
        cols={1}
        answers={answers}
        onAnswer={onAnswer}
        onReset={() => onResetBlock('e:')}
        speak={speak}
      />
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        block="expresiones"
        title="Expresiones"
        subtitle="Lo que se dice de verdad, no la traducción literal."
        right={<CountPill block="expresiones">{expressions.length}</CountPill>}
      />

      {expressions.length === 0 ? (
        <EmptyNote>Este tema todavía no tiene expresiones.</EmptyNote>
      ) : (
        <>
          {expressions.length > 12 && (
            <FilterField
              value={query}
              onChange={setQuery}
              placeholder="Buscar una expresión o su significado…"
              shown={filtered.length}
              total={expressions.length}
            />
          )}

          {filtered.length === 0 ? (
            <EmptyNote>Ninguna expresión coincide con «{query}».</EmptyNote>
          ) : (
            <StudyGrid>
              {filtered.map((e, i) => (
                <TermCard
                  key={`${e.expression}-${i}`}
                  block="expresiones"
                  term={e.expression}
                  gloss={e.meaning}
                  example={e.example ? `"${e.example}"` : undefined}
                  onSpeak={() => speak(e.expression)}
                />
              ))}
            </StudyGrid>
          )}
        </>
      )}
    </SectionCard>
  );
}
