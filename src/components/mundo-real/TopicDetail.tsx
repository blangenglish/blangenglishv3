import { motion } from 'framer-motion';
import type { MRTopic } from '@/pages/MundoRealData';
import type { MRTopicProgress } from '@/lib/mundoRealProgress';
import type { MRBlockId, MRMode } from './types';
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
  const tabs: { id: MRBlockId; label: string }[] = [
    { id: 'vocab',  label: '📖 Vocabulario' },
    { id: 'frases', label: '💬 Frases' },
    ...(topic.expressions?.length   ? [{ id: 'expresiones' as const, label: '🗣️ Expresiones' }] : []),
    ...(topic.phrasalVerbs?.length  ? [{ id: 'phrasal' as const,     label: '🔀 Phrasal Verbs' }] : []),
    { id: 'estructura', label: '🏗️ Estructura' },
    { id: 'dialogo',    label: '🎭 Diálogo' },
  ];

  const tabProps = { topic, allTopics, mode, answers, onAnswer, onResetBlock, speak };

  return (
    <motion.div
      key={`mr-detail-${topic.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
          ← Volver a temas
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{topic.emoji}</span>
          <div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${topic.badge}`}>{topic.category}</span>
            <h1 className="text-xl md:text-2xl font-extrabold mt-0.5">{topic.title}</h1>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tb => {
          const done = blockProgress[tb.id]?.completed;
          return (
            <button
              key={tb.id}
              onClick={() => onTab(tb.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === tb.id ? `bg-gradient-to-r ${topic.color} text-white shadow-sm` : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {done && <span className="mr-1" title="Bloque completado">✓</span>}
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Estudiar / Practicar. En modo Estudiar se ve la lista con las
          traducciones; en Practicar se oculta, porque si no la respuesta está
          escrita justo encima de su propia pregunta. */}
      <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-0.5">
        {(['estudiar', 'practicar'] as const).map(m => (
          <button
            key={m}
            onClick={() => onMode(m)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >{m === 'estudiar' ? '📖 Estudiar' : '🎯 Practicar'}</button>
        ))}
      </div>

      {/* Las expresiones y los phrasal verbs viven enteros en Supabase: si la
          consulta falló, estas dos pestañas estarían vacías sin explicación. */}
      {contentError && (tab === 'expresiones' || tab === 'phrasal') && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">No se pudo cargar este contenido. Revisa tu conexión.</p>
          <button onClick={onRetryContent} className="text-xs font-bold underline text-amber-800 dark:text-amber-300">Reintentar</button>
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
