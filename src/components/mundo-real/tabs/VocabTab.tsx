import { useState } from 'react';
import { vocabItems } from '@/lib/mundoRealExercises';
import { QuizRunner } from '../QuizRunner';
import { groupItems, isGrouped } from '../groups';
import {
  SectionCard, SectionHeader, CountPill, StudyGrid, TermCard,
  FilterField, useTextFilter, EmptyNote, GroupChips, GroupCards, BackToGroups,
} from '../ui';
import type { MRTabProps } from '../types';

export function VocabTab({ topic, mode, answers, onAnswer, onResetBlock, speak }: MRTabProps) {
  const vocab = topic.vocabulary ?? [];
  // Función pura con barajado determinista: recalcular en cada render devuelve
  // siempre el mismo orden, así que no hace falta memorizarla.
  const items = vocabItems(topic.id, vocab);
  const groups = groupItems(vocab);
  const grouped = isGrouped(groups);

  const [section, setSection] = useState(0);
  // En Practicar se entra a una sección; null es el selector.
  const [running, setRunning] = useState<number | null>(grouped ? null : 0);

  const { query, setQuery, filtered } = useTextFilter(vocab, v => [v.word, v.translation]);
  const byKey = new Map(items.map(it => [it.key, it]));
  const itemsOf = (i: number) =>
    groups[i].items.map(v => byKey.get(`v:${v.word}`)).filter(Boolean) as typeof items;

  /* ── Practicar ── */
  if (mode === 'practicar') {
    if (items.length === 0) {
      return <SectionCard><EmptyNote>Este tema todavía no tiene vocabulario.</EmptyNote></SectionCard>;
    }

    if (grouped && running === null) {
      return (
        <SectionCard>
          <SectionHeader
            block="vocab"
            title="Vocabulario"
            subtitle="Elige una sección. Cada una se guarda por separado."
            right={<CountPill block="vocab">{items.length} palabras</CountPill>}
          />
          <GroupCards
            block="vocab"
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
          <BackToGroups onBack={() => setRunning(null)} label="Todas las secciones" />
        )}
        <QuizRunner
          block="vocab"
          items={active}
          question={grouped ? groups[running ?? 0].name : '¿Cuál es la traducción?'}
          cols={2}
          answers={answers}
          onAnswer={onAnswer}
          onReset={() => onResetBlock('v:', active.map(it => it.key))}
          speak={speak}
        />
      </div>
    );
  }

  /* ── Estudiar ── */
  const searching = query.trim().length > 0;
  const shown = searching ? filtered : (grouped ? groups[section].items : vocab);

  return (
    <SectionCard>
      <SectionHeader
        block="vocab"
        title="Vocabulario"
        subtitle="Toca el altavoz para escuchar la pronunciación."
        right={
          <CountPill block="vocab">
            {grouped ? `${groups.length} secciones · ${vocab.length}` : `${vocab.length} palabras`}
          </CountPill>
        }
      />

      {vocab.length === 0 ? (
        <EmptyNote>Este tema todavía no tiene vocabulario.</EmptyNote>
      ) : (
        <>
          {/* El buscador atraviesa TODAS las secciones: buscar dentro de una
              sola no serviría cuando no recuerdas en cuál estaba la palabra. */}
          {vocab.length > 12 && (
            <FilterField
              value={query}
              onChange={setQuery}
              placeholder="Buscar una palabra o su traducción…"
              shown={filtered.length}
              total={vocab.length}
            />
          )}

          {grouped && !searching && (
            <GroupChips
              block="vocab"
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
            <EmptyNote>Ninguna palabra coincide con «{query}».</EmptyNote>
          ) : (
            <StudyGrid>
              {shown.map((v, i) => (
                <TermCard
                  key={`${v.word}-${i}`}
                  block="vocab"
                  term={v.word}
                  gloss={v.translation}
                  tag={searching && v.group ? v.group : undefined}
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
