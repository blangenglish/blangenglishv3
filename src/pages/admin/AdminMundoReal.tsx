// @ts-nocheck
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe, Search, X, Plus, Pencil, ChevronDown, ChevronUp,
  BookOpen, MessageSquare, Layers, Play,
} from 'lucide-react';
import { MUNDO_REAL_TOPICS, MR_CATEGORIES, type MRTopic } from '@/pages/MundoRealData';

/* ── Colores por categoría ───────────────────────────────────────── */
const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Comida y Restaurantes':      { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  'Salud y Bienestar':          { bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-500'   },
  'Transporte':                 { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  'Viajes y Alojamiento':       { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500'  },
  'Compras':                    { bg: 'bg-pink-100',    text: 'text-pink-700',    dot: 'bg-pink-500'    },
  'Trámites y Servicios':       { bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500'  },
  'Trabajo y Negocios':         { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500'  },
  'Educación':                  { bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500'    },
  'Social y Entretenimiento':   { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  'Situaciones Difíciles':      { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
  'Comunicación del Día a Día': { bg: 'bg-teal-100',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
  'Emergencias':                { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'    },
};

const fallbackColor = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

/* ── Modal de detalle del tema ───────────────────────────────────── */
function TopicModal({ topic, onClose }: { topic: MRTopic; onClose: () => void }) {
  const [section, setSection] = useState<'vocab' | 'frases' | 'estructura' | 'dialogo'>('vocab');
  const cat = CAT_COLORS[topic.category] ?? fallbackColor;

  const tabs = [
    { id: 'vocab',     label: '📖 Vocabulario',  count: topic.vocabulary?.length },
    { id: 'frases',    label: '💬 Frases',        count: topic.phrases?.length    },
    { id: 'estructura',label: '🏗️ Estructura',    count: null                     },
    { id: 'dialogo',   label: '🎭 Diálogo',       count: topic.dialogue?.length   },
  ] as const;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-background rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-border shrink-0">
          <span className="text-4xl">{topic.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                {topic.category}
              </span>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                id: {topic.id}
              </span>
            </div>
            <h2 className="text-xl font-extrabold leading-snug">{topic.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSection(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                section === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">

          {/* VOCABULARIO */}
          {section === 'vocab' && (
            <div className="divide-y divide-border/40 rounded-2xl border border-border/50 bg-card overflow-hidden">
              {(topic.vocabulary ?? []).map((v, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{v.word}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-sm text-muted-foreground">{v.translation}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 italic mt-0.5">"{v.example}"</p>
                  </div>
                  <div className="flex gap-1 flex-wrap shrink-0">
                    {v.options?.map((opt, oi) => (
                      <span key={oi} className={`text-[10px] px-1.5 py-0.5 rounded border ${opt === v.translation ? 'border-green-400 bg-green-50 text-green-700 font-semibold' : 'border-border/40 text-muted-foreground'}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FRASES */}
          {section === 'frases' && (
            <div className="divide-y divide-border/40 rounded-2xl border border-border/50 bg-card overflow-hidden">
              {(topic.phrases ?? []).map((p, i) => (
                <div key={i} className="p-3 space-y-1">
                  <p className="font-bold text-sm">{p.phrase}</p>
                  <p className="text-xs text-muted-foreground">{p.meaning}</p>
                  <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {p.when}
                  </span>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {p.options?.map((opt, oi) => (
                      <span key={oi} className={`text-[10px] px-1.5 py-0.5 rounded border ${oi === p.correct ? 'border-green-400 bg-green-50 text-green-700 font-semibold' : 'border-border/40 text-muted-foreground'}`}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ESTRUCTURA */}
          {section === 'estructura' && topic.structure && (
            <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
              <h3 className="font-bold text-base">{topic.structure.title}</h3>
              <p className="text-sm text-muted-foreground">{topic.structure.explanation}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ejemplos</p>
                {topic.structure.examples?.map((ex, i) => (
                  <p key={i} className="text-sm italic bg-muted/40 rounded-lg px-3 py-1.5">{ex}</p>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {topic.structure.words?.map((w, i) => (
                  <span key={i} className="bg-primary/10 text-primary text-xs font-mono px-2 py-1 rounded-lg border border-primary/20">{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* DIÁLOGO */}
          {section === 'dialogo' && (
            <div className="space-y-2">
              {(topic.dialogue ?? []).map((line, i) => (
                <div key={i} className={`flex gap-2 ${line.speaker === 'A' ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${line.speaker === 'A' ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-white'}`}>
                    {line.speaker}
                  </div>
                  <div className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] ${line.speaker === 'A' ? 'bg-muted/60' : 'bg-primary/10'}`}>
                    {line.options ? (
                      <div className="space-y-1">
                        {line.options.map((opt, oi) => (
                          <p key={oi} className={`text-xs ${oi === line.correct ? 'font-semibold text-green-700' : 'text-muted-foreground'}`}>
                            {oi === line.correct ? '✅ ' : '○ '}{opt}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p>{line.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            📁 Contenido definido en <code className="bg-muted px-1 rounded">src/pages/MundoRealData.ts</code> · Para editar, modifica ese archivo directamente.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Página principal ────────────────────────────────────────────── */
export default function AdminMundoReal() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [editingTopic, setEditingTopic] = useState<MRTopic | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(MR_CATEGORIES.filter(c => c !== 'Todos')));
  const [showAddNote, setShowAddNote] = useState(false);

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MUNDO_REAL_TOPICS.filter(t => {
      const matchCat = activeCategory === 'Todos' || t.category === activeCategory;
      const matchSearch = !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.id.includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  /* Agrupar por categoría */
  const grouped = useMemo(() => {
    const map: Record<string, MRTopic[]> = {};
    for (const t of filtered) {
      (map[t.category] = map[t.category] || []).push(t);
    }
    return map;
  }, [filtered]);

  const visibleCats = Object.keys(grouped);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Inglés para el Mundo Real</h1>
              <p className="text-sm text-muted-foreground">
                {MUNDO_REAL_TOPICS.length} temas · {MR_CATEGORIES.length - 1} categorías
              </p>
            </div>
          </div>
          <Button
            className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowAddNote(true)}
          >
            <Plus className="w-4 h-4" /> Agregar nuevo tema
          </Button>
        </div>

        {/* ── Nota "Agregar nuevo tema" ── */}
        <AnimatePresence>
          {showAddNote && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
            >
              <span className="text-xl shrink-0">📁</span>
              <div className="flex-1 text-sm">
                <p className="font-bold text-amber-800 mb-1">Para agregar un nuevo tema</p>
                <p className="text-amber-700">
                  Los temas están definidos en el archivo{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">src/pages/MundoRealData.ts</code>.
                  Agrega un nuevo objeto al array <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">MUNDO_REAL_TOPICS</code>{' '}
                  siguiendo la misma estructura que los temas existentes.
                </p>
              </div>
              <button onClick={() => setShowAddNote(false)} className="text-amber-400 hover:text-amber-600 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Búsqueda ── */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, categoría o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Filtros de categoría ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MR_CATEGORIES.map(cat => {
            const c = cat === 'Todos' ? fallbackColor : (CAT_COLORS[cat] ?? fallbackColor);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  isActive
                    ? `${c.bg} ${c.text} border-transparent shadow-sm`
                    : 'bg-background border-border/50 text-muted-foreground hover:border-border'
                }`}
              >
                {cat === 'Todos' ? `Todos (${MUNDO_REAL_TOPICS.length})` : cat}
              </button>
            );
          })}
        </div>

        {/* ── Resultado de búsqueda vacío ── */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-semibold">No se encontraron temas</p>
            <p className="text-sm mt-1">Intenta con otra búsqueda o categoría.</p>
          </div>
        )}

        {/* ── Categorías con temas ── */}
        <div className="space-y-4">
          {visibleCats.map(cat => {
            const topics = grouped[cat];
            const c = CAT_COLORS[cat] ?? fallbackColor;
            const isExpanded = expandedCats.has(cat);

            return (
              <div key={cat} className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm">
                {/* Cabecera de categoría */}
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
                  <span className="font-bold text-sm flex-1">{cat}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                    {topics.length} tema{topics.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Lista de temas */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-border/30">
                        {topics.map((topic, i) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                          >
                            {/* Número */}
                            <span className="text-xs text-muted-foreground/50 w-6 text-right shrink-0 font-mono">
                              {i + 1}
                            </span>

                            {/* Emoji */}
                            <span className="text-xl shrink-0">{topic.emoji}</span>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm leading-snug">{topic.title}</p>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{topic.id}</p>
                            </div>

                            {/* Stats rápidos */}
                            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {topic.vocabulary?.length ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {topic.phrases?.length ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                {topic.dialogue?.length ?? 0}
                              </span>
                            </div>

                            {/* Botón editar */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs rounded-lg gap-1.5 shrink-0"
                              onClick={() => setEditingTopic(topic)}
                            >
                              <Pencil className="w-3 h-3" /> Editar
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── Leyenda de stats ── */}
        {filtered.length > 0 && (
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Vocabulario</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Frases</span>
            <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5" /> Líneas de diálogo</span>
          </div>
        )}
      </div>

      {/* ── Modal de edición/detalle ── */}
      <AnimatePresence>
        {editingTopic && (
          <TopicModal topic={editingTopic} onClose={() => setEditingTopic(null)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
