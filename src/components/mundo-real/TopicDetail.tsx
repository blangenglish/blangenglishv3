import { motion } from 'framer-motion';
import type { MRTopic } from '@/pages/MundoRealData';
import type { MRTopicProgress } from '@/lib/mundoRealProgress';
import type { MRBlockId, MRMode } from './types';
import { BLOCK_THEME } from './ui';
import { VocabTab } from './tabs/VocabTab';
import { PhrasesTab } from './tabs/PhrasesTab';
import { ExpressionsTab } from './tabs/ExpressionsTab';
import { PhrasalVerbsTab } from './tabs/PhrasalVerbsTab';
import { StructureTab } from './tabs/StructureTab';
import { DialogueTab } from './tabs/DialogueTab';

interface TopicDetailProps {
  topic: MRTopic;
  allTopics: MRTopic[];
  tab: MRBlockId;
  onTab: (tab: MRBlockId) => void;
  mode: MRMode;
  onMode: (mode: MRMode) => void;
  answers: Record<string, string>;
  onAnswer: (key: string, text: string) => void;
  onResetBlock: (prefix: string) => void;
  order: Record<string, number[]>;
  orderDone: Record<string, boolean>;
  onOrder: (key: string, ids: number[]) => void;
  onOrderDone: (key: string, done: boolean) => void;
  speak: (text: string) => void;
  onBack: () => void;
  contentError: boolean;
  onRetryContent: () => void;
  /** Progreso guardado de este tema, para marcar las pestañas ya terminadas. */
  blockProgress: MRTopicProgress;
}

export function TopicDetail({
  topic, allTopics, tab, onTab, mode, onMode,
  answers, onAnswer, onResetBlock,
  order, orderDone, onOrder, onOrderDone,
  speak, onBack, contentError, onRetryContent, blockProgress,
}: TopicDetailProps) {
  const tabs: MRBlockId[] = [
    'vocab',
    'frases',
    ...(topic.expressions?.length  ? (['expresiones'] as const) : []),
    ...(topic.phrasalVerbs?.length ? (['phrasal'] as const)     : []),
    'estructura',
    'dialogo',
  ];

  const doneCount = tabs.filter(id => blockProgress[id]?.completed).length;
  const tabProps = { topic, allTopics, mode, answers, onAnswer, onResetBlock, speak };

  return (
    <motion.div
      key={`mr-detail-${topic.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <span aria-hidden="true">←</span> Volver a temas
      </button>

      {/* Portada del tema. Antes era un emoji suelto junto al título; ahora
          lleva el degradado del tema y el avance, para que la pantalla empiece
          con algo y no directamente con una lista. */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${topic.color} opacity-10`} aria-hidden="true" />
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${topic.color}`} aria-hidden="true" />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 grid place-items-center rounded-2xl bg-gradient-to-br ${topic.color} text-3xl shadow-md`}>
            <span aria-hidden="true">{topic.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${topic.badge}`}>
              {topic.category}
            </span>
            <h1 className="mt-1.5 text-xl sm:text-2xl font-extrabold leading-tight tracking-tight">
              {topic.title}
            </h1>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tu avance</p>
            <p className="text-sm font-extrabold tabular-nums">
              {doneCount} <span className="text-muted-foreground font-bold">de {tabs.length} bloques</span>
            </p>
            <div className="mt-1.5 h-1.5 w-full sm:w-32 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${topic.color} transition-[width] duration-500`}
                style={{ width: `${tabs.length ? (doneCount / tabs.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Barra de bloques. Cada uno con su color, y con scroll horizontal en el
          móvil en vez de envolverse en tres filas de pastillas. */}
      <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Bloques del tema">
        {tabs.map(id => {
          const th = BLOCK_THEME[id];
          const active = tab === id;
          const done = blockProgress[id]?.completed;
          return (
            <button
              key={id}
              onClick={() => onTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${
                active
                  ? `bg-gradient-to-r ${th.grad} text-white border-transparent shadow-sm`
                  : 'bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              <span aria-hidden="true">{th.icon}</span>
              {th.label}
              {done && (
                <span
                  title="Bloque completado"
                  className={`grid place-items-center w-4 h-4 rounded-full text-[10px] font-black ${
                    active ? 'bg-white/25 text-white' : 'bg-emerald-500 text-white'
                  }`}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Estudiar / Practicar.
          En Estudiar se ve el contenido con sus significados; en Practicar solo
          el ejercicio. Antes los dos salían en la misma pantalla, así que la
          respuesta estaba escrita justo encima de su propia pregunta. */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-2xl border border-border/60 bg-muted/40 p-1">
          {(['estudiar', 'practicar'] as const).map(m => (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                mode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'estudiar' ? '📖 Estudiar' : '🎯 Practicar'}
            </button>
          ))}
        </div>
        <p className="hidden sm:block text-xs text-muted-foreground">
          {mode === 'estudiar'
            ? 'Lee y escucha. Cuando lo tengas, pasa a Practicar.'
            : 'Los significados quedan ocultos mientras practicas.'}
        </p>
      </div>

      {/* Las expresiones y los phrasal verbs viven enteros en Supabase: si la
          consulta falló, estas dos pestañas estarían vacías sin explicación. */}
      {contentError && (tab === 'expresiones' || tab === 'phrasal') && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/20">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            No se pudo cargar este contenido. Revisa tu conexión.
          </p>
          <button onClick={onRetryContent} className="text-xs font-bold underline text-amber-800 dark:text-amber-300">
            Reintentar
          </button>
        </div>
      )}

      {tab === 'vocab'       && <VocabTab {...tabProps} />}
      {tab === 'frases'      && <PhrasesTab {...tabProps} />}
      {tab === 'expresiones' && <ExpressionsTab {...tabProps} />}
      {tab === 'phrasal'     && <PhrasalVerbsTab {...tabProps} />}
      {tab === 'estructura'  && (
        <StructureTab {...tabProps} order={order} orderDone={orderDone} onOrder={onOrder} onOrderDone={onOrderDone} />
      )}
      {tab === 'dialogo'     && <DialogueTab {...tabProps} />}
    </motion.div>
  );
}
