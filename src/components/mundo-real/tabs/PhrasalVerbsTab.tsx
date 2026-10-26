import { phrasalItems } from '@/lib/mundoRealExercises';
import { QuizRunner } from '../QuizRunner';
import { SectionCard, SectionHeader, CountPill, StudyGrid, TermCard, FilterField, useTextFilter, EmptyNote } from '../ui';
import type { MRTabProps } from '../types';

export function PhrasalVerbsTab({ topic, allTopics, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  const pool = allTopics
    .filter(t => t.category === topic.category && t.id !== topic.id)
    .flatMap(t => (t.phrasalVerbs ?? []).map(p => p.meaning));
  const items = phrasalItems(topic.id, topic.phrasalVerbs ?? [], pool);
  const phrasalVerbs = topic.phrasalVerbs ?? [];
  const { query, setQuery, filtered } = useTextFilter(phrasalVerbs, p => [p.verb, p.meaning]);

  if (mode === 'practicar') {
    return (
      <QuizRunner
        block="phrasal"
        items={items}
        question="¿Cuál es el significado?"
        cols={1}
        answers={answers}
        onAnswer={onAnswer}
        onReset={() => onResetBlock('pv:')}
        speak={speak}
      />
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        block="phrasal"
        title="Phrasal Verbs"
        subtitle="Verbo más partícula: el significado cambia por completo."
        right={<CountPill block="phrasal">{phrasalVerbs.length}</CountPill>}
      />

      {phrasalVerbs.length === 0 ? (
        <EmptyNote>Este tema todavía no tiene phrasal verbs.</EmptyNote>
      ) : (
        <>
          {phrasalVerbs.length > 12 && (
            <FilterField
              value={query}
              onChange={setQuery}
              placeholder="Buscar un verbo o su significado…"
              shown={filtered.length}
              total={phrasalVerbs.length}
            />
          )}

          {filtered.length === 0 ? (
            <EmptyNote>Ningún phrasal verb coincide con «{query}».</EmptyNote>
          ) : (
            <StudyGrid>
              {filtered.map((pv, i) => (
                <TermCard
                  key={`${pv.verb}-${i}`}
                  block="phrasal"
                  term={pv.verb}
                  gloss={pv.meaning}
                  example={pv.example ? `"${pv.example}"` : undefined}
                  onSpeak={() => speak(pv.verb)}
                />
              ))}
            </StudyGrid>
          )}
        </>
      )}
    </SectionCard>
  );
}
