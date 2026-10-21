import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { MR_CATEGORIES, type MRTopic } from '@/pages/MundoRealData';
import type { MRTopicProgress } from '@/lib/mundoRealProgress';

interface TopicListProps {
  topics: MRTopic[];
  search: string;
  onSearch: (value: string) => void;
  categoryFilter: string;
  onCategoryFilter: (value: string) => void;
  onPick: (id: string) => void;
  onExit: () => void;
  /** Progreso por tema, para marcar lo empezado y lo terminado. */
  progress: Record<string, MRTopicProgress>;
  /** Cuántos bloques con ejercicios tiene cada tema. */
  blocksPerTopic: Record<string, number>;
}

export function TopicList({
  topics, search, onSearch, categoryFilter, onCategoryFilter, onPick, onExit,
  progress, blocksPerTopic,
}: TopicListProps) {
  const empezados = Object.keys(progress).length;
  const completados = Object.entries(progress).filter(
    ([id, blocks]) => Object.values(blocks).filter(b => b.completed).length >= (blocksPerTopic[id] ?? 99),
  ).length;
  const filtered = topics.filter(t => {
    const matchCat = categoryFilter === 'Todos' || t.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <motion.div
      key="mundo-real-list"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <button onClick={onExit} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
        ← English for you!
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-extrabold">Inglés para el Mundo Real</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Aprende inglés en situaciones cotidianas reales. Elige un tema y practica vocabulario, frases y conversaciones.
        </p>
        {empezados > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-bold text-primary">{completados}</span> de {topics.length} temas completados
            {empezados > completados && <> · {empezados - completados} empezados</>}
          </p>
        )}
      </div>

      <input
        type="text"
        placeholder="Buscar tema..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="w-full border border-border/60 bg-background rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="flex flex-wrap gap-2">
        {MR_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border/60 text-muted-foreground hover:border-primary/60'
            }`}
          >{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((t, i) => {
          const blocks = progress[t.id] ?? {};
          const doneBlocks = Object.values(blocks).filter(b => b.completed).length;
          const totalBlocks = blocksPerTopic[t.id] ?? 0;
          const isDone = totalBlocks > 0 && doneBlocks >= totalBlocks;
          const started = Object.keys(blocks).length > 0;

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`relative rounded-2xl border bg-gradient-to-br ${t.cardBg} shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex gap-3 items-start ${
                isDone ? 'border-green-400' : 'border-border/50'
              }`}
              onClick={() => onPick(t.id)}
            >
              {isDone && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center" title="Tema completado">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
              <span className="text-3xl mt-0.5">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.badge}`}>{t.category}</span>
                <h3 className="font-bold text-sm mt-1 leading-snug">{t.title}</h3>
                {started && !isDone && (
                  <div className="mt-2 h-1 rounded-full bg-background/60 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${totalBlocks ? Math.round((doneBlocks / totalBlocks) * 100) : 0}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                className={`shrink-0 mt-1 px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r ${t.color} text-white shadow-sm`}
                onClick={e => { e.stopPropagation(); onPick(t.id); }}
              >{started ? 'Seguir' : 'Explorar'}</button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-muted-foreground text-sm py-8">No se encontraron temas.</p>
        )}
      </div>
    </motion.div>
  );
}
