import { phraseItems } from '@/lib/mundoRealExercises';
import { QuizRunner } from '../QuizRunner';
import { SectionCard, SectionHeader, CountPill, StudyGrid, TermCard, FilterField, useTextFilter, EmptyNote } from '../ui';
import type { MRTabProps } from '../types';

export function PhrasesTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  const items = phraseItems(topic.id, topic.phrases ?? []);
  const phrases = topic.phrases ?? [];
  const { query, setQuery, filtered } = useTextFilter(phrases, p => [p.phrase, p.meaning, p.missing]);

  if (mode === 'practicar') {
    return (
      <QuizRunner
        block="frases"
        items={items}
        question="Completa la frase"
        prefix="p:"
        cols={2}
        answers={answers}
        onAnswer={onAnswer}
        onResetBlock={onResetBlock}
      />
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        block="frases"
        title="Frases útiles"
        subtitle="Frases completas, con cuándo se usa cada una."
        right={<CountPill block="frases">{phrases.length} frases</CountPill>}
      />

      {phrases.length === 0 ? (
        <EmptyNote>Este tema todavía no tiene frases.</EmptyNote>
      ) : (
        <>
          {phrases.length > 12 && (
            <FilterField
              value={query}
              onChange={setQuery}
              placeholder="Buscar una frase o su significado…"
              shown={filtered.length}
              total={phrases.length}
            />
          )}

          {filtered.length === 0 ? (
            <EmptyNote>Ninguna frase coincide con «{query}».</EmptyNote>
          ) : (
            <StudyGrid>
              {filtered.map((p, i) => {
                // En la lista de estudio la frase se ve COMPLETA; el hueco solo
                // tiene sentido en el ejercicio.
                const full = p.phrase.replace('___', p.missing);
                return (
                  <TermCard
                    key={`${p.phrase}-${i}`}
                    block="frases"
                    term={full}
                    gloss={p.meaning}
                    tag={p.when ? `Cuándo: ${p.when}` : undefined}
                    onSpeak={() => speak(full)}
                  />
                );
              })}
            </StudyGrid>
          )}
        </>
      )}
    </SectionCard>
  );
}
