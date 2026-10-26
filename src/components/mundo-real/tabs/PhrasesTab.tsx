import { useState } from 'react';
import { phraseItems } from '@/lib/mundoRealExercises';
import { QuizRunner } from '../QuizRunner';
import { groupItems, isGrouped } from '../groups';
import {
  SectionCard, SectionHeader, CountPill, StudyGrid, TermCard,
  FilterField, useTextFilter, EmptyNote, GroupChips, GroupCards, BackToGroups,
} from '../ui';
import type { MRTabProps } from '../types';

export function PhrasesTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  const phrases = topic.phrases ?? [];
  const items = phraseItems(topic.id, phrases);
  const groups = groupItems(phrases);
  const grouped = isGrouped(groups);

  const [section, setSection] = useState(0);
  const [running, setRunning] = useState<number | null>(grouped ? null : 0);

  const { query, setQuery, filtered } = useTextFilter(phrases, p => [p.phrase, p.meaning, p.missing]);
  const byKey = new Map(items.map(it => [it.key, it]));
  const itemsOf = (i: number) =>
    groups[i].items.map(p => byKey.get(`p:${p.phrase}`)).filter(Boolean) as typeof items;

  /* ── Practicar ── */
  if (mode === 'practicar') {
    if (items.length === 0) {
      return <SectionCard><EmptyNote>Este tema todavía no tiene frases.</EmptyNote></SectionCard>;
    }

    if (grouped && running === null) {
      return (
        <SectionCard>
          <SectionHeader
            block="frases"
            title="Frases útiles"
            subtitle="Elige una situación. Cada una se guarda por separado."
            right={<CountPill block="frases">{items.length} frases</CountPill>}
          />
          <GroupCards
            block="frases"
            groups={groups.map((g, i) => {
              const its = itemsOf(i);
              return {
                name: g.name,
                total: its.length,
                answered: its.filter(it => answers[it.key] !== undefined).length,
                hits: its.filter(it => answers[it.key] === it.correct).length,
              };
            })}
            onPick={setRunning}
          />
        </SectionCard>
      );
    }

    const active = grouped ? itemsOf(running ?? 0) : items;
    return (
      <div>
        {grouped && (
          <BackToGroups onBack={() => setRunning(null)} label="Todas las situaciones" />
        )}
        <QuizRunner
          block="frases"
          items={active}
          question={grouped ? groups[running ?? 0].name : 'Completa la frase'}
          cols={2}
          answers={answers}
          onAnswer={onAnswer}
          onReset={() => onResetBlock('p:', active.map(it => it.key))}
        />
      </div>
    );
  }

  /* ── Estudiar ── */
  const searching = query.trim().length > 0;
  const shown = searching ? filtered : (grouped ? groups[section].items : phrases);

  return (
    <SectionCard>
      <SectionHeader
        block="frases"
        title="Frases útiles"
        subtitle="Frases completas, agrupadas por el momento en que se usan."
        right={
          <CountPill block="frases">
            {grouped ? `${groups.length} situaciones · ${phrases.length}` : `${phrases.length} frases`}
          </CountPill>
        }
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

          {grouped && !searching && (
            <GroupChips
              block="frases"
              names={groups.map(g => g.name)}
              counts={groups.map(g => g.items.length)}
              current={section}
              onPick={setSection}
              doneNames={new Set(
                groups
                  .filter((_, i) => {
                    const its = itemsOf(i);
                    return its.length > 0 && its.every(it => answers[it.key] !== undefined);
                  })
                  .map(g => g.name),
              )}
            />
          )}

          {shown.length === 0 ? (
            <EmptyNote>Ninguna frase coincide con «{query}».</EmptyNote>
          ) : (
            <StudyGrid>
              {shown.map((p, i) => {
                // En la lista de estudio la frase se ve COMPLETA; el hueco solo
                // tiene sentido en el ejercicio.
                const full = p.phrase.replace('___', p.missing);
                return (
                  <TermCard
                    key={`${p.phrase}-${i}`}
                    block="frases"
                    term={full}
                    gloss={p.meaning}
                    tag={searching && p.group ? p.group : (p.when ? `Cuándo: ${p.when}` : undefined)}
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
