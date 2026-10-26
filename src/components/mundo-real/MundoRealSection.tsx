/**
 * Inglés para el Mundo Real, completo.
 *
 * Hasta la fase 2 esto eran ~380 líneas incrustadas en `src/pages/Dashboard.tsx`
 * (4000+ líneas, con `@ts-nocheck`). El Dashboard se queda ahora solo con el
 * interruptor de mostrarlo o no.
 *
 * Toda la memoria del estudiante vive aquí a propósito: es el único punto que
 * habla con `useMundoRealProgress`, así que las seis pestañas no saben nada de
 * localStorage ni de Supabase.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { speak as speakEnglish, cancelSpeech } from '@/lib/tts';
import {
  vocabItems, phraseItems, expressionItems, phrasalItems,
  allOrderExercises, isOrderCorrect, dialogueChoices,
} from '@/lib/mundoRealExercises';
import type { MRBlock } from '@/lib/mundoRealProgress';
import { useMundoRealTopics } from './useMundoRealTopics';
import { useMundoRealProgress } from './useMundoRealProgress';
import { TopicList } from './TopicList';
import { TopicDetail } from './TopicDetail';
import type { MRBlockId, MRMode } from './types';

interface MundoRealSectionProps {
  /** Vuelve al grid de «English for you!». */
  onExit: () => void;
  /** Tema a abrir de entrada, desde ?mr=<id>. */
  initialTopicId?: string | null;
  /** Sin alumno identificado no se guarda nada; la sección sigue funcionando. */
  studentId?: string;
}

/** De qué bloque es una clave de respuesta (`v:palabra`, `d:3`…). */
function blockOfKey(key: string): MRBlock | null {
  if (key.startsWith('pv:')) return 'phrasal';
  if (key.startsWith('v:'))  return 'vocab';
  if (key.startsWith('p:'))  return 'frases';
  if (key.startsWith('e:'))  return 'expresiones';
  if (key.startsWith('d:'))  return 'dialogo';
  if (key.startsWith('s:'))  return 'estructura';
  return null;
}

const PREFIX_OF: Record<MRBlock, string> = {
  vocab: 'v:', frases: 'p:', expresiones: 'e:', phrasal: 'pv:',
  estructura: 's:', dialogo: 'd:', practica: 'x:',
};

export function MundoRealSection({ onExit, initialTopicId = null, studentId }: MundoRealSectionProps) {
  const { topics, error, reload } = useMundoRealTopics();
  const progress = useMundoRealProgress(studentId);

  const [topicId, setTopicId] = useState<string | null>(initialTopicId);
  const [tab, setTab] = useState<MRBlockId>('vocab');
  const [mode, setMode] = useState<MRMode>('estudiar');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Respuestas por TEXTO, con claves por contenido (v:palabra, p:frase, …).
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Record<string, number[]>>({});
  const [orderDone, setOrderDone] = useState<Record<string, boolean>>({});

  const topic = topicId ? topics.find(t => t.id === topicId) ?? null : null;

  /**
   * Los ejercicios del tema abierto. Son las mismas funciones puras y
   * deterministas que usan las pestañas para pintar, así que dan exactamente
   * los mismos ítems: aquí sirven para contar aciertos y totales.
   */
  const items = useMemo(() => {
    if (!topic) return null;
    const sameCat = topics.filter(t => t.category === topic.category && t.id !== topic.id);
    return {
      vocab: vocabItems(topic.id, topic.vocabulary ?? []),
      frases: phraseItems(topic.id, topic.phrases ?? []),
      expresiones: expressionItems(topic.id, topic.expressions ?? [], sameCat.flatMap(t => (t.expressions ?? []).map(e => e.meaning))),
      phrasal: phrasalItems(topic.id, topic.phrasalVerbs ?? [], sameCat.flatMap(t => (t.phrasalVerbs ?? []).map(p => p.meaning))),
      // Se cuentan TODAS las estructuras y TODOS los diálogos del tema, no
      // solo el que esté abierto: el bloque se completa cuando están todos.
      estructura: allOrderExercises(topic.id, topic.structures ?? (topic.structure ? [topic.structure] : [])),
      dialogo: (topic.dialogues ?? (topic.dialogue?.length ? [{ lines: topic.dialogue }] : []))
        .flatMap((d: any, i: number) => dialogueChoices(topic.id, d.lines ?? [], i)),
    };
  }, [topic, topics]);

  /** Cuántos bloques con ejercicios tiene cada tema: define cuándo está completo. */
  const blocksPerTopic = useMemo(() => {
    const out: Record<string, number> = {};
    topics.forEach(t => {
      let n = 2; // vocabulario y frases están siempre
      if (t.expressions?.length) n++;
      if (t.phrasalVerbs?.length) n++;
      if ((t.structures ?? (t.structure ? [t.structure] : [])).some(s => (s?.examples ?? []).length)) n++;
      const dls = t.dialogues ?? (t.dialogue?.length ? [{ lines: t.dialogue }] : []);
      if (dls.some((d: any) => (d.lines ?? []).some((l: any) => l.speaker === 'B' && l.options?.length))) n++;
      out[t.id] = n;
    });
    return out;
  }, [topics]);

  const openTopic = useCallback((id: string | null) => {
    setTopicId(id);
    setTab('vocab');
    setMode('estudiar');
    setOrder({});
    setOrderDone({});
    cancelSpeech();
    // Se recuperan las respuestas guardadas: el alumno retoma donde iba, en
    // vez de empezar de cero cada vez que abre el tema.
    if (id && studentId) {
      const saved = progress.all[id] ?? {};
      const restored: Record<string, string> = {};
      Object.values(saved).forEach(block => Object.assign(restored, block.answers ?? {}));
      setAnswers(restored);
    } else {
      setAnswers({});
    }
  }, [studentId, progress.all]);

  useEffect(() => {
    if (initialTopicId) setTopicId(initialTopicId);
  }, [initialTopicId]);

  // Que la voz no siga hablando sobre la pantalla siguiente.
  useEffect(() => () => cancelSpeech(), []);

  const speak = useCallback((text: string) => speakEnglish(text, { rate: 0.85 }), []);

  /** Guarda el bloque al que pertenece una respuesta recién dada. */
  const persistBlock = useCallback((block: MRBlock, nextAnswers: Record<string, string>) => {
    if (!topic || !items || !studentId) return;

    const prefix = PREFIX_OF[block];
    const mine: Record<string, string> = {};
    for (const [k, v] of Object.entries(nextAnswers)) if (k.startsWith(prefix)) mine[k] = v;

    let correct = 0;
    let total = 0;

    if (block === 'estructura') {
      total = items.estructura.length;
      correct = items.estructura.filter(ex => mine[ex.key] === ex.target).length;
    } else if (block === 'dialogo') {
      total = items.dialogo.length;
      correct = items.dialogo.filter(c => mine[c.key] === c.correct).length;
    } else {
      const list = items[block as 'vocab' | 'frases' | 'expresiones' | 'phrasal'] ?? [];
      total = list.length;
      correct = list.filter(it => mine[it.key] === it.correct).length;
    }

    const answered = Object.keys(mine).length;
    progress.saveBlock(topic.id, block, {
      correct,
      total,
      answers: mine,
      completed: total > 0 && answered >= total,
    });
  }, [topic, items, studentId, progress]);

  const handleAnswer = useCallback((key: string, text: string) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: text };
      const block = blockOfKey(key);
      if (block) persistBlock(block, next);
      return next;
    });
  }, [persistBlock]);

  /**
   * Reinicia un bloque para poder repetirlo sin salir del tema.
   *
   * Con `onlyKeys` se reinicia solo una parte: lo necesitan las pestañas con
   * secciones, donde repetir «Pagar» no puede borrar lo ya hecho en «Pedir».
   * En ese caso el bloque conserva respuestas, así que se guarda el resto en
   * vez de borrar la fila de progreso.
   */
  const resetBlock = useCallback((prefix: string, onlyKeys?: string[]) => {
    const block = blockOfKey(prefix + 'x');
    const partial = !!onlyKeys?.length;

    setAnswers(prev => {
      const next: Record<string, string> = {};
      if (partial) {
        const drop = new Set(onlyKeys);
        for (const [k, v] of Object.entries(prev)) if (!drop.has(k)) next[k] = v;
      } else {
        for (const [k, v] of Object.entries(prev)) if (!k.startsWith(prefix)) next[k] = v;
      }
      if (block && partial) persistBlock(block, next);
      return next;
    });

    if (prefix === 's:') { setOrder({}); setOrderDone({}); }
    if (block && topic && !partial) progress.clearBlock(topic.id, block);
  }, [topic, progress, persistBlock]);

  /**
   * Al verificar un ejercicio de ordenar se guarda la frase que montó el alumno,
   * que es lo que permite puntuarlo. La disposición de las fichas no se
   * restaura al reabrir el tema (reconstruirla con palabras repetidas sería
   * ambiguo): se recuerda el resultado, no el tablero.
   */
  const handleOrderDone = useCallback((key: string, done: boolean) => {
    setOrderDone(d => ({ ...d, [key]: done }));
    if (!done || !items) return;
    const ex = items.estructura.find(e => e.key === key);
    if (!ex) return;
    const built = (order[key] ?? []).map(id => ex.tiles.find(t => t.id === id)?.text ?? '').join(' ');
    setAnswers(prev => {
      const next = { ...prev, [key]: isOrderCorrect((order[key] ?? []).map(id => ex.tiles.find(t => t.id === id)!), ex.target) ? ex.target : built };
      persistBlock('estructura', next);
      return next;
    });
  }, [items, order, persistBlock]);

  return (
    <AnimatePresence mode="wait">
      {!topic ? (
        <TopicList
          key="mundo-real-list"
          topics={topics}
          search={search}
          onSearch={setSearch}
          categoryFilter={categoryFilter}
          onCategoryFilter={setCategoryFilter}
          onPick={openTopic}
          onExit={() => { openTopic(null); onExit(); }}
          progress={progress.all}
          blocksPerTopic={blocksPerTopic}
        />
      ) : (
        <TopicDetail
          key={`mr-detail-${topic.id}`}
          topic={topic}
          allTopics={topics}
          tab={tab}
          onTab={setTab}
          mode={mode}
          onMode={setMode}
          answers={answers}
          onAnswer={handleAnswer}
          onResetBlock={resetBlock}
          order={order}
          orderDone={orderDone}
          onOrder={(key, ids) => setOrder(o => ({ ...o, [key]: ids }))}
          onOrderDone={handleOrderDone}
          speak={speak}
          onBack={() => openTopic(null)}
          contentError={error}
          onRetryContent={reload}
          blockProgress={topic ? progress.all[topic.id] ?? {} : {}}
        />
      )}
    </AnimatePresence>
  );
}
