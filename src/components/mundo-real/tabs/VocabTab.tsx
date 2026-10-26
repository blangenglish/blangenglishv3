import { vocabItems } from '@/lib/mundoRealExercises';
import { QuizRunner } from '../QuizRunner';
import { SectionCard, SectionHeader, CountPill, StudyGrid, TermCard, FilterField, useTextFilter, EmptyNote } from '../ui';
import type { MRTabProps } from '../types';

export function VocabTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  // Función pura con barajado determinista: recalcular en cada render devuelve
  // siempre el mismo orden, así que no hace falta memorizarla.
  const items = vocabItems(topic.id, topic.vocabulary ?? []);
  const vocab = topic.vocabulary ?? [];
  const { query, setQuery, filtered } = useTextFilter(vocab, v => [v.word, v.translation]);

  if (mode === 'practicar') {
    return (
      <QuizRunner
        block="vocab"
        items={items}
        question="¿Cuál es la traducción?"
        prefix="v:"
        cols={2}
        answers={answers}
        onAnswer={onAnswer}
        onResetBlock={onResetBlock}
        speak={speak}
      />
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        block="vocab"
        title="Vocabulario"
        subtitle="Toca el altavoz para escuchar la pronunciación."
        right={<CountPill block="vocab">{vocab.length} palabras</CountPill>}
      />

      {vocab.length === 0 ? (
        <EmptyNote>Este tema todavía no tiene vocabulario.</EmptyNote>
      ) : (
        <>
          {/* Con los temas ampliados (el primero tiene 74 palabras) buscar a ojo
              por la rejilla deja de ser razonable. */}
          {vocab.length > 12 && (
            <FilterField
              value={query}
              onChange={setQuery}
              placeholder="Buscar una palabra o su traducción…"
              shown={filtered.length}
              total={vocab.length}
            />
          )}

          {filtered.length === 0 ? (
            <EmptyNote>Ninguna palabra coincide con «{query}».</EmptyNote>
          ) : (
            <StudyGrid>
              {filtered.map((v, i) => (
                <TermCard
                  key={`${v.word}-${i}`}
                  block="vocab"
                  term={v.word}
                  gloss={v.translation}
                  example={v.example ? `"${v.example}"` : undefined}
                  onSpeak={() => speak(v.word)}
                />
              ))}
            </StudyGrid>
          )}
        </>
      )}
    </SectionCard>
  );
}
