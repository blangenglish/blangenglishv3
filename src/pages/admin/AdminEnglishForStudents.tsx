// @ts-nocheck
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine, BookOpen, Headphones, BookMarked, Library,
  Plus, X, ChevronRight, Sparkles, Trash2, GripVertical,
} from 'lucide-react';

// ─── Módulos disponibles ────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'escritura',
    label: 'Escritura',
    icon: PenLine,
    gradient: 'from-violet-500 to-fuchsia-500',
    softBg: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    ring: 'ring-violet-200 dark:ring-violet-800',
    emoji: '✍️',
  },
  {
    id: 'lectura',
    label: 'Lectura',
    icon: BookOpen,
    gradient: 'from-amber-500 to-orange-500',
    softBg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-800',
    emoji: '📖',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    gradient: 'from-orange-500 to-yellow-500',
    softBg: 'from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    ring: 'ring-orange-200 dark:ring-orange-800',
    emoji: '🎧',
  },
  {
    id: 'gramatica',
    label: 'Gramática',
    icon: BookMarked,
    gradient: 'from-pink-500 to-rose-500',
    softBg: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    ring: 'ring-pink-200 dark:ring-pink-800',
    emoji: '📝',
  },
  {
    id: 'vocabulario',
    label: 'Vocabulario',
    icon: Library,
    gradient: 'from-teal-500 to-cyan-500',
    softBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
    emoji: '📚',
  },
] as const;

type ModuleId = typeof MODULES[number]['id'];

interface Section {
  id: string;
  moduleId: ModuleId;
  title: string;
  description: string;
  createdAt: string;
}

// ─── Estado del modal ────────────────────────────────────────────────────────
type ModalStep = 'select' | 'form';

function getModule(id: ModuleId) {
  return MODULES.find((m) => m.id === id)!;
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AdminEnglishForStudents() {
  const [sections, setSections] = useState<Section[]>([]);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>('select');
  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // ── abrir / cerrar ──────────────────────────────────────────────────────
  const openModal = () => {
    setStep('select');
    setSelectedModule(null);
    setFormTitle('');
    setFormDesc('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // ── seleccionar módulo → paso 2 ─────────────────────────────────────────
  const handleSelectModule = (id: ModuleId) => {
    setSelectedModule(id);
    setStep('form');
  };

  // ── guardar sección ─────────────────────────────────────────────────────
  const handleSave = () => {
    if (!selectedModule || !formTitle.trim()) return;
    setSaving(true);
    setTimeout(() => {
      const newSection: Section = {
        id: crypto.randomUUID(),
        moduleId: selectedModule,
        title: formTitle.trim(),
        description: formDesc.trim(),
        createdAt: new Date().toLocaleString('es-CO', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      };
      setSections((prev) => [newSection, ...prev]);
      setSaving(false);
      closeModal();
    }, 300);
  };

  // ── eliminar sección ────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  // ── agrupar por módulo para la vista ────────────────────────────────────
  const grouped = MODULES.map((m) => ({
    module: m,
    items: sections.filter((s) => s.moduleId === m.id),
  })).filter((g) => g.items.length > 0);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-extrabold">English for Students</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Crea y organiza contenido educativo por módulo de habilidad.
            </p>
          </div>

          <Button
            onClick={openModal}
            className="gap-2 shrink-0"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Agregar sección
          </Button>
        </div>

        {/* ── Contenido: vacío ── */}
        {sections.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-border rounded-2xl py-20 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              📚
            </div>
            <div>
              <p className="font-semibold text-foreground">Aún no hay secciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Haz clic en <strong>Agregar sección</strong> para empezar.
              </p>
            </div>
            <Button variant="outline" onClick={openModal} className="gap-2 mt-2">
              <Plus className="w-4 h-4" />
              Agregar sección
            </Button>
          </motion.div>
        )}

        {/* ── Contenido: secciones agrupadas por módulo ── */}
        {grouped.map(({ module: mod, items }) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Encabezado de módulo */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-lg shadow-sm`}>
                {mod.emoji}
              </div>
              <div>
                <h2 className="font-bold text-base">{mod.label}</h2>
                <p className="text-xs text-muted-foreground">{items.length} sección{items.length !== 1 ? 'es' : ''}</p>
              </div>
            </div>

            {/* Tarjetas de secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((sec) => (
                <motion.div
                  key={sec.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <Card className={`ring-1 ${mod.ring} bg-gradient-to-br ${mod.softBg} border-border/50`}>
                    <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                          <Badge className={`text-xs ${mod.badge} border-0`}>{mod.label}</Badge>
                        </div>
                        <CardTitle className="text-sm font-bold leading-snug line-clamp-2">
                          {sec.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDelete(sec.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardHeader>
                    {sec.description && (
                      <CardContent className="pt-0 pb-3">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {sec.description}
                        </p>
                      </CardContent>
                    )}
                    <div className="px-4 pb-3">
                      <p className="text-[10px] text-muted-foreground/60">Creado: {sec.createdAt}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          MODAL
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={closeModal}
            >
              {/* Panel */}
              <motion.div
                key="panel"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ── Paso 1: Seleccionar módulo ── */}
                {step === 'select' && (
                  <div className="p-6">
                    {/* Header modal */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h2 className="text-lg font-extrabold">Selecciona el módulo</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          ¿A qué habilidad pertenece esta sección?
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-1" onClick={closeModal}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Lista de módulos */}
                    <div className="space-y-2">
                      {MODULES.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.id}
                            onClick={() => handleSelectModule(mod.id)}
                            className={`
                              w-full flex items-center gap-4 p-4 rounded-xl
                              bg-gradient-to-r ${mod.softBg}
                              border border-border/60 ring-1 ${mod.ring}
                              hover:shadow-md hover:-translate-y-0.5
                              transition-all duration-200 text-left group
                            `}
                          >
                            {/* Icono con gradiente */}
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-xl shadow-sm shrink-0`}>
                              {mod.emoji}
                            </div>

                            {/* Texto */}
                            <div className="flex-1">
                              <p className="font-bold text-sm text-foreground">{mod.label}</p>
                              <Badge className={`mt-0.5 text-[10px] ${mod.badge} border-0`}>
                                Módulo de habilidad
                              </Badge>
                            </div>

                            {/* Flecha */}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Paso 2: Formulario ── */}
                {step === 'form' && selectedModule && (() => {
                  const mod = getModule(selectedModule);
                  const Icon = mod.icon;
                  return (
                    <div className="p-6">
                      {/* Header modal */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          {/* Botón volver */}
                          <button
                            onClick={() => setStep('select')}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Volver"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                          </button>
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-lg shadow-sm`}>
                            {mod.emoji}
                          </div>
                          <div>
                            <h2 className="text-base font-extrabold leading-tight">Nueva sección</h2>
                            <Badge className={`text-[10px] ${mod.badge} border-0`}>{mod.label}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-1" onClick={closeModal}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Campos */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="sec-title" className="text-sm font-semibold">
                            Título <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="sec-title"
                            placeholder={`Ej: ${mod.label} avanzada — conectores`}
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="text-sm"
                            autoFocus
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="sec-desc" className="text-sm font-semibold">
                            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                          </Label>
                          <Textarea
                            id="sec-desc"
                            placeholder="Describe brevemente el contenido de esta sección..."
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            rows={3}
                            className="text-sm resize-none"
                          />
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 mt-6">
                        <Button variant="outline" className="flex-1" onClick={closeModal}>
                          Cancelar
                        </Button>
                        <Button
                          className={`flex-1 bg-gradient-to-r ${mod.gradient} text-white border-0 hover:opacity-90`}
                          disabled={!formTitle.trim() || saving}
                          onClick={handleSave}
                        >
                          {saving ? 'Guardando...' : 'Guardar sección'}
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
