// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Globe, Search, X, Plus, Pencil, ChevronDown, ChevronUp,
  BookOpen, MessageSquare, Play, Trash2, Check, Loader2, AlertCircle,
} from 'lucide-react';
import {
  MUNDO_REAL_TOPICS, MR_CATEGORIES,
  type MRTopic, type MRVocab, type MRPhrase, type MRStructure, type MRDialogueLine,
  type MRExpression, type MRPhrasalVerb,
} from '@/pages/MundoRealData';
import { adminUpsert } from '@/lib/adminWrite';
import { supabase } from '@/integrations/supabase/client';

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

/* ── Modal de edición ────────────────────────────────────────────── */
function TopicEditModal({
  topic, onClose, onSaved,
}: {
  topic: MRTopic;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cat = CAT_COLORS[topic.category] ?? fallbackColor;
  const [tab, setTab] = useState<'vocab' | 'frases' | 'expresiones' | 'phrasal' | 'estructura' | 'dialogo'>('vocab');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  /* ── Estado editable (inicializado desde static data) ── */
  const [vocab, setVocab] = useState<MRVocab[]>(
    (topic.vocabulary ?? []).map(v => ({ ...v }))
  );
  const [phrases, setPhrases] = useState<MRPhrase[]>(
    (topic.phrases ?? []).map(p => ({ ...p }))
  );
  const [structure, setStructure] = useState<MRStructure>(
    topic.structure
      ? { ...topic.structure, examples: [...(topic.structure.examples ?? [])], words: [...(topic.structure.words ?? [])] }
      : { title: '', explanation: '', examples: [], words: [] }
  );
  const [dialogue, setDialogue] = useState<MRDialogueLine[]>(
    (topic.dialogue ?? []).map(l => ({ ...l }))
  );
  const [expressions, setExpressions] = useState<MRExpression[]>(
    (topic.expressions ?? []).map(e => ({ ...e }))
  );
  const [phrasalVerbs, setPhrasalVerbs] = useState<MRPhrasalVerb[]>(
    (topic.phrasalVerbs ?? []).map(p => ({ ...p }))
  );
  const [newWord, setNewWord] = useState('');

  /* ── Cargar override existente de Supabase ── */
  useEffect(() => {
    supabase
      .from('mundo_real_overrides')
      .select('vocabulary, phrases, structure, dialogue, expressions, phrasal_verbs')
      .eq('topic_id', topic.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.vocabulary)    setVocab(data.vocabulary);
          if (data.phrases)       setPhrases(data.phrases);
          if (data.structure)     setStructure(data.structure);
          if (data.dialogue)      setDialogue(data.dialogue);
          if (data.expressions)   setExpressions(data.expressions);
          if (data.phrasal_verbs) setPhrasalVerbs(data.phrasal_verbs);
        }
        setLoading(false);
      });
  }, [topic.id]);

  /* ── Helpers: Vocabulario ── */
  const updateVocab = (i: number, field: keyof MRVocab, val: string) =>
    setVocab(prev => prev.map((v, j) => j === i ? { ...v, [field]: val } : v));
  const deleteVocab = (i: number) =>
    setVocab(prev => prev.filter((_, j) => j !== i));
  const addVocab = () =>
    setVocab(prev => [...prev, { word: '', translation: '', example: '', options: [] }]);

  /* ── Helpers: Frases ── */
  const updatePhrase = (i: number, field: keyof MRPhrase, val: string) =>
    setPhrases(prev => prev.map((p, j) => j === i ? { ...p, [field]: val } : p));
  const deletePhrase = (i: number) =>
    setPhrases(prev => prev.filter((_, j) => j !== i));
  const addPhrase = () =>
    setPhrases(prev => [...prev, { phrase: '', meaning: '', when: '', missing: '', options: [], correct: 0 }]);

  /* ── Helpers: Expresiones ── */
  const updateExpression = (i: number, field: keyof MRExpression, val: string) =>
    setExpressions(prev => prev.map((e, j) => j === i ? { ...e, [field]: val } : e));
  const deleteExpression = (i: number) =>
    setExpressions(prev => prev.filter((_, j) => j !== i));
  const addExpression = () =>
    setExpressions(prev => [...prev, { expression: '', meaning: '', example: '' }]);

  /* ── Helpers: Phrasal Verbs ── */
  const updatePhrasalVerb = (i: number, field: keyof MRPhrasalVerb, val: string) =>
    setPhrasalVerbs(prev => prev.map((p, j) => j === i ? { ...p, [field]: val } : p));
  const deletePhrasalVerb = (i: number) =>
    setPhrasalVerbs(prev => prev.filter((_, j) => j !== i));
  const addPhrasalVerb = () =>
    setPhrasalVerbs(prev => [...prev, { verb: '', meaning: '', example: '' }]);

  /* ── Helpers: Diálogo ── */
  const updateDialogue = (i: number, field: 'speaker' | 'text', val: string) =>
    setDialogue(prev => prev.map((l, j) => j === i ? { ...l, [field]: val } : l));
  const toggleSpeaker = (i: number) =>
    setDialogue(prev => prev.map((l, j) => j === i ? { ...l, speaker: l.speaker === 'A' ? 'B' : 'A' } : l));
  const deleteDialogue = (i: number) =>
    setDialogue(prev => prev.filter((_, j) => j !== i));
  const addDialogue = () =>
    setDialogue(prev => [...prev, { speaker: prev.length % 2 === 0 ? 'A' : 'B', text: '' }]);

  /* ── Guardar ── */
  const handleSave = async () => {
    setSaving(true);
    setSaveResult('idle');
    setErrMsg('');
    try {
      await adminUpsert(
        'mundo_real_overrides',
        {
          topic_id: topic.id,
          vocabulary: vocab,
          phrases,
          structure,
          dialogue,
          expressions,
          phrasal_verbs: phrasalVerbs,
          updated_at: new Date().toISOString(),
        },
        'topic_id',
      );
      setSaveResult('success');
      onSaved();
      setTimeout(() => setSaveResult('idle'), 3000);
    } catch (e: any) {
      setSaveResult('error');
      setErrMsg(e?.message ?? 'Error desconocido');
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'vocab',       label: '📖 Vocabulario',    count: vocab.length        },
    { id: 'frases',      label: '💬 Frases',          count: phrases.length      },
    { id: 'expresiones', label: '🗣️ Expresiones',    count: expressions.length  },
    { id: 'phrasal',     label: '🔀 Phrasal Verbs',  count: phrasalVerbs.length },
    { id: 'estructura',  label: '🏗️ Estructura',     count: null                },
    { id: 'dialogo',     label: '🎭 Diálogo',         count: dialogue.length     },
  ] as const;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-background rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
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
                {topic.id}
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
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.label}{t.count != null ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* Contenido editable */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando contenido…</span>
            </div>
          ) : (
            <>
              {/* ── VOCABULARIO ── */}
              {tab === 'vocab' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Edita cada palabra con su traducción y frase de ejemplo. Los cambios reemplazarán el contenido que ve el estudiante.
                  </p>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    {/* Cabecera de columnas */}
                    <div className="grid grid-cols-[1fr_1fr_2fr_32px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      <span>Inglés</span>
                      <span>Español</span>
                      <span>Frase de ejemplo</span>
                      <span />
                    </div>
                    <div className="divide-y divide-border/30">
                      {vocab.map((v, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_2fr_32px] gap-2 items-center px-3 py-2.5">
                          <Input
                            value={v.word}
                            onChange={e => updateVocab(i, 'word', e.target.value)}
                            placeholder="word"
                            className="h-8 text-sm font-semibold"
                          />
                          <Input
                            value={v.translation}
                            onChange={e => updateVocab(i, 'translation', e.target.value)}
                            placeholder="traducción"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={v.example}
                            onChange={e => updateVocab(i, 'example', e.target.value)}
                            placeholder="Example sentence..."
                            className="h-8 text-sm italic text-muted-foreground"
                          />
                          <button
                            onClick={() => deleteVocab(i)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={addVocab} className="gap-1.5 text-xs h-7 rounded-xl text-primary hover:text-primary">
                        <Plus className="w-3.5 h-3.5" /> Agregar palabra
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── FRASES ── */}
              {tab === 'frases' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Edita las frases en inglés con su traducción al español y el contexto de uso.
                  </p>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="divide-y divide-border/30">
                      {phrases.map((p, i) => (
                        <div key={i} className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={p.phrase}
                                onChange={e => updatePhrase(i, 'phrase', e.target.value)}
                                placeholder="Frase en inglés (usa ___ para el espacio en blanco)"
                                className="text-sm font-semibold"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={p.meaning}
                                  onChange={e => updatePhrase(i, 'meaning', e.target.value)}
                                  placeholder="Traducción al español"
                                  className="text-sm"
                                />
                                <Input
                                  value={p.when}
                                  onChange={e => updatePhrase(i, 'when', e.target.value)}
                                  placeholder="Cuándo usarla (ej: Al llegar)"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => deletePhrase(i)}
                              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors mt-0.5 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={addPhrase} className="gap-1.5 text-xs h-7 rounded-xl text-primary hover:text-primary">
                        <Plus className="w-3.5 h-3.5" /> Agregar frase
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── EXPRESIONES & IDIOMS ── */}
              {tab === 'expresiones' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Expresiones idiomáticas y modismos relacionados al tema. Incluye el significado en español y un ejemplo de uso.
                  </p>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="divide-y divide-border/30">
                      {expressions.map((e, i) => (
                        <div key={i} className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={e.expression}
                                onChange={ev => updateExpression(i, 'expression', ev.target.value)}
                                placeholder='Expresión en inglés (ej: "On the house")'
                                className="text-sm font-semibold"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={e.meaning}
                                  onChange={ev => updateExpression(i, 'meaning', ev.target.value)}
                                  placeholder="Significado en español"
                                  className="text-sm"
                                />
                                <Input
                                  value={e.example}
                                  onChange={ev => updateExpression(i, 'example', ev.target.value)}
                                  placeholder="Ejemplo de uso en inglés"
                                  className="text-sm italic text-muted-foreground"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => deleteExpression(i)}
                              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors mt-0.5 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={addExpression} className="gap-1.5 text-xs h-7 rounded-xl text-primary hover:text-primary">
                        <Plus className="w-3.5 h-3.5" /> Agregar expresión
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PHRASAL VERBS ── */}
              {tab === 'phrasal' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Phrasal verbs relevantes al tema con su significado en español y ejemplo de uso en contexto.
                  </p>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_2fr_32px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      <span>Phrasal Verb</span>
                      <span>Significado (ES)</span>
                      <span>Ejemplo en inglés</span>
                      <span />
                    </div>
                    <div className="divide-y divide-border/30">
                      {phrasalVerbs.map((p, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_2fr_32px] gap-2 items-center px-3 py-2.5">
                          <Input
                            value={p.verb}
                            onChange={e => updatePhrasalVerb(i, 'verb', e.target.value)}
                            placeholder="eat out"
                            className="h-8 text-sm font-semibold"
                          />
                          <Input
                            value={p.meaning}
                            onChange={e => updatePhrasalVerb(i, 'meaning', e.target.value)}
                            placeholder="comer fuera de casa"
                            className="h-8 text-sm"
                          />
                          <Input
                            value={p.example}
                            onChange={e => updatePhrasalVerb(i, 'example', e.target.value)}
                            placeholder="Let's eat out tonight."
                            className="h-8 text-sm italic text-muted-foreground"
                          />
                          <button
                            onClick={() => deletePhrasalVerb(i)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={addPhrasalVerb} className="gap-1.5 text-xs h-7 rounded-xl text-primary hover:text-primary">
                        <Plus className="w-3.5 h-3.5" /> Agregar phrasal verb
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ESTRUCTURA ── */}
              {tab === 'estructura' && (
                <div className="space-y-5">
                  <p className="text-xs text-muted-foreground">
                    Edita la explicación gramatical que acompaña este tema.
                  </p>

                  {/* Título */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Título de la estructura
                    </label>
                    <Input
                      value={structure.title}
                      onChange={e => setStructure(s => ({ ...s, title: e.target.value }))}
                      placeholder="Ej: I'd like + noun / I'd like to + verb"
                      className="font-semibold"
                    />
                  </div>

                  {/* Explicación */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Explicación
                    </label>
                    <Textarea
                      value={structure.explanation}
                      onChange={e => setStructure(s => ({ ...s, explanation: e.target.value }))}
                      placeholder="Explica la regla gramatical en inglés…"
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* Ejemplos */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Ejemplos
                    </label>
                    {structure.examples.map((ex, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
                        <Input
                          value={ex}
                          onChange={e => setStructure(s => ({
                            ...s,
                            examples: s.examples.map((x, j) => j === i ? e.target.value : x),
                          }))}
                          placeholder="Example sentence…"
                          className="text-sm italic flex-1"
                        />
                        <button
                          onClick={() => setStructure(s => ({ ...s, examples: s.examples.filter((_, j) => j !== i) }))}
                          className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setStructure(s => ({ ...s, examples: [...s.examples, ''] }))}
                      className="gap-1.5 text-xs h-7 rounded-xl text-primary hover:text-primary"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar ejemplo
                    </Button>
                  </div>

                  {/* Palabras clave */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Palabras clave (chips)
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-8">
                      {structure.words.map((w, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-mono px-2 py-1 rounded-lg border border-primary/20"
                        >
                          {w}
                          <button
                            onClick={() => setStructure(s => ({ ...s, words: s.words.filter((_, j) => j !== i) }))}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newWord}
                        onChange={e => setNewWord(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newWord.trim()) {
                            setStructure(s => ({ ...s, words: [...s.words, newWord.trim()] }));
                            setNewWord('');
                          }
                        }}
                        placeholder="Nueva palabra + Enter para agregar"
                        className="text-sm h-8 font-mono flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── DIÁLOGO ── */}
              {tab === 'dialogo' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Edita los turnos del diálogo. Haz click en la letra del hablante (A/B) para cambiarla.
                  </p>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="divide-y divide-border/30">
                      {dialogue.map((line, i) => (
                        <div key={i} className="flex gap-3 items-center px-3 py-2.5">
                          {/* Speaker toggle */}
                          <button
                            onClick={() => toggleSpeaker(i)}
                            title="Click para cambiar hablante"
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all hover:scale-110 ${
                              line.speaker === 'A'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-emerald-500 text-white'
                            }`}
                          >
                            {line.speaker}
                          </button>

                          {/* Text input */}
                          <Input
                            value={line.text ?? ''}
                            onChange={e => updateDialogue(i, 'text', e.target.value)}
                            placeholder={`Texto del hablante ${line.speaker}…`}
                            className="flex-1 text-sm"
                          />

                          {/* Delete */}
                          <button
                            onClick={() => deleteDialogue(i)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={addDialogue} className="gap-1.5 text-xs h-7 rounded-xl text-primary hover:text-primary">
                        <Plus className="w-3.5 h-3.5" /> Agregar línea
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — Guardar */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-4">
          {/* Mensaje de resultado */}
          <div className="flex-1">
            {saveResult === 'success' && (
              <motion.span
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium"
              >
                <Check className="w-4 h-4" /> Guardado — los estudiantes ya ven los cambios
              </motion.span>
            )}
            {saveResult === 'error' && (
              <motion.span
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-sm text-red-500"
              >
                <AlertCircle className="w-4 h-4" /> {errMsg || 'Error al guardar'}
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={onClose} className="rounded-xl" disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                : saveResult === 'success'
                  ? <><Check className="w-4 h-4" /> Guardado</>
                  : '💾 Guardar cambios'
              }
            </Button>
          </div>
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
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(MR_CATEGORIES.filter(c => c !== 'Todos'))
  );
  const [showAddNote, setShowAddNote] = useState(false);
  const [savedTopics, setSavedTopics] = useState<Set<string>>(new Set());

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MUNDO_REAL_TOPICS.filter(t => {
      const matchCat = activeCategory === 'Todos' || t.category === activeCategory;
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.includes(q);
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
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">
                    src/pages/MundoRealData.ts
                  </code>.
                  Agrega un nuevo objeto al array{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">
                    MUNDO_REAL_TOPICS
                  </code>{' '}
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
                        {topics.map((topic, i) => {
                          const wasSaved = savedTopics.has(topic.id);
                          return (
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
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm leading-snug">{topic.title}</p>
                                  {wasSaved && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" /> Editado
                                    </span>
                                  )}
                                </div>
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
                          );
                        })}
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

      {/* ── Modal de edición ── */}
      <AnimatePresence>
        {editingTopic && (
          <TopicEditModal
            topic={editingTopic}
            onClose={() => setEditingTopic(null)}
            onSaved={() => {
              setSavedTopics(prev => new Set([...prev, editingTopic.id]));
            }}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
