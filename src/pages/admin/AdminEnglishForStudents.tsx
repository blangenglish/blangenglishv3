// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { adminInsert, adminDelete, adminSelect } from '@/lib/adminWrite';
import {
  PenLine, BookOpen, Headphones, BookMarked, Library,
  Plus, X, ChevronRight, Sparkles, Trash2,
  ImageIcon, Music2, FileText, Upload, Globe, Loader2, Code2,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/english-for-students`;
const storageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // URL externa — usar directamente
  return `${STORAGE_BASE}/${path}`;
};

const MODULES = [
  { id: 'escritura',   label: 'Escritura',   icon: PenLine,    gradient: 'from-violet-500 to-fuchsia-500', softBg: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', ring: 'ring-violet-200 dark:ring-violet-800', emoji: '✍️', type: 'richtext' },
  { id: 'lectura',     label: 'Lectura',     icon: BookOpen,   gradient: 'from-amber-500 to-orange-500',   softBg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   ring: 'ring-amber-200 dark:ring-amber-800',   emoji: '📖', type: 'richtext' },
  { id: 'listening',   label: 'Listening',   icon: Headphones, gradient: 'from-orange-500 to-yellow-500',  softBg: 'from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',  ring: 'ring-orange-200 dark:ring-orange-800', emoji: '🎧', type: 'listening' },
  { id: 'gramatica',   label: 'Gramática',   icon: BookMarked, gradient: 'from-pink-500 to-rose-500',      softBg: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',         badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',         ring: 'ring-pink-200 dark:ring-pink-800',     emoji: '📝', type: 'richtext' },
  { id: 'vocabulario', label: 'Vocabulario', icon: Library,    gradient: 'from-teal-500 to-cyan-500',      softBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',         badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',         ring: 'ring-teal-200 dark:ring-teal-800',     emoji: '📚', type: 'richtext' },
] as const;

type ModuleId = typeof MODULES[number]['id'];
const getModule = (id: ModuleId) => MODULES.find((m) => m.id === id)!;

interface DBSection {
  id: string;
  module_id: ModuleId;
  title: string;
  rich_text: string | null;
  image_path: string | null;
  audio_path: string | null;
  pdf_path: string | null;
  embed_html: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

type ModalStep = 'select' | 'form';

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ─── Zona de imagen ───────────────────────────────────────────────────────────
function ImageUploadZone({ preview, fileName, onFile, onClear }: {
  preview: string | null; fileName: string | null;
  onFile: (f: File, p: string) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => onFile(f, ev.target?.result as string);
    r.readAsDataURL(f);
  };
  if (preview) return (
    <div className="relative rounded-xl overflow-hidden border border-border group">
      <img src={preview} alt={fileName ?? ''} className="w-full max-h-56 object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <Button type="button" variant="destructive" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5" onClick={onClear}>
          <X className="w-3.5 h-3.5" /> Quitar imagen
        </Button>
      </div>
      <div className="absolute bottom-2 left-2 right-2">
        <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-md truncate block">{fileName}</span>
      </div>
    </div>
  );
  return (
    <button type="button" onClick={() => ref.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-muted/40 transition-all text-center cursor-pointer">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>
      <div><p className="font-semibold text-sm">Subir imagen</p><p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP — máx. 5 MB</p></div>
      <div className="flex items-center gap-1.5 text-xs text-primary font-medium"><Upload className="w-3.5 h-3.5" /> Seleccionar archivo</div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handle} />
    </button>
  );
}

// ─── Zona de archivo genérico ─────────────────────────────────────────────────
function FileUploadZone({ icon: Icon, label, hint, accept, fileName, fileSize, onFile, onClear, accent = 'text-primary' }: {
  icon: React.ElementType; label: string; hint: string; accept: string;
  fileName: string | null; fileSize: string | null;
  onFile: (f: File) => void; onClear: () => void; accent?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) onFile(f); };
  if (fileName) return (
    <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 bg-muted/30">
      <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${accent}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{fileName}</p>{fileSize && <p className="text-xs text-muted-foreground">{fileSize}</p>}</div>
      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onClear}><X className="w-4 h-4" /></Button>
    </div>
  );
  return (
    <button type="button" onClick={() => ref.current?.click()} className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-muted/40 transition-all text-center cursor-pointer">
      <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center ${accent}`}><Icon className="w-5 h-5" /></div>
      <div><p className="font-semibold text-sm">{label}</p><p className="text-xs text-muted-foreground mt-0.5">{hint}</p></div>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${accent}`}><Upload className="w-3.5 h-3.5" /> Seleccionar archivo</div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle} />
    </button>
  );
}

// ─── Upload a Supabase Storage ────────────────────────────────────────────────
async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('english-for-students').upload(path, file, { upsert: false });
  if (error) throw new Error(`Storage error: ${error.message}`);
  return path;
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminEnglishForStudents() {
  const { toast } = useToast();
  const [sections, setSections] = useState<DBSection[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>('select');
  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formRichText, setFormRichText] = useState('');
  const [formEmbedHtml, setFormEmbedHtml] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formAudioFile, setFormAudioFile] = useState<File | null>(null);
  const [formPdfFile, setFormPdfFile] = useState<File | null>(null);
  // Modo URL externa
  const [imageMode, setImageMode] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [audioMode, setAudioMode] = useState<'file' | 'url'>('file');
  const [audioUrl, setAudioUrl] = useState('');
  const [pdfMode, setPdfMode] = useState<'file' | 'url'>('file');
  const [pdfUrl, setPdfUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Cargar secciones ──────────────────────────────────────────────────────
  useEffect(() => { loadSections(); }, []);

  async function loadSections() {
    setLoadingData(true);
    try {
      const data = await adminSelect('english_for_students_sections', {
        order: { column: 'created_at', ascending: false },
      }) as DBSection[];
      setSections(data ?? []);
    } catch (err) {
      toast({ title: 'Error cargando secciones', description: String(err), variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  }

  // ── Helpers del modal ─────────────────────────────────────────────────────
  const resetForm = () => {
    setFormTitle(''); setFormRichText(''); setFormEmbedHtml('');
    setFormImageFile(null); setFormImagePreview(null);
    setFormAudioFile(null); setFormPdfFile(null);
    setImageMode('file'); setImageUrl('');
    setAudioMode('file'); setAudioUrl('');
    setPdfMode('file'); setPdfUrl('');
  };
  const openModal = () => { resetForm(); setStep('select'); setSelectedModule(null); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const handleSelectModule = (id: ModuleId) => { setSelectedModule(id); setStep('form'); };

  const mod = selectedModule ? getModule(selectedModule) : null;
  const isRichText = mod?.type === 'richtext';
  const isListening = mod?.type === 'listening';

  const canPublish = () => {
    if (!formTitle.trim() || !selectedModule) return false;
    if (isRichText) {
      const hasImage = imageMode === 'url' ? imageUrl.trim().startsWith('http') : formImageFile !== null;
      const hasEmbed = formEmbedHtml.trim().length > 0;
      return formRichText.replace(/<[^>]+>/g, '').trim().length > 0 || hasImage || hasEmbed;
    }
    if (isListening) {
      return audioMode === 'url' ? audioUrl.trim().startsWith('http') : formAudioFile !== null;
    }
    return false;
  };

  // ── Publicar ──────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!selectedModule || !formTitle.trim() || !mod) return;
    setPublishing(true);
    try {
      let image_path: string | null = null;
      let audio_path: string | null = null;
      let pdf_path: string | null = null;

      if (imageMode === 'url') image_path = imageUrl.trim() || null;
      else if (formImageFile)  image_path = await uploadFile(formImageFile, 'images');

      if (audioMode === 'url') audio_path = audioUrl.trim() || null;
      else if (formAudioFile)  audio_path = await uploadFile(formAudioFile, 'audio');

      if (pdfMode === 'url') pdf_path = pdfUrl.trim() || null;
      else if (formPdfFile)  pdf_path = await uploadFile(formPdfFile, 'pdfs');

      await adminInsert('english_for_students_sections', {
        module_id:   selectedModule,
        title:       formTitle.trim(),
        rich_text:   isRichText ? formRichText : null,
        embed_html:  isRichText ? (formEmbedHtml.trim() || null) : null,
        image_path,
        audio_path,
        pdf_path,
        is_published: true,
        sort_order:  sections.length,
      });

      toast({ title: '¡Publicado! ✅', description: `"${formTitle.trim()}" ya está visible en ${mod.label}.` });
      closeModal();
      await loadSections();
    } catch (err) {
      toast({ title: 'Error al publicar', description: String(err), variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminDelete('english_for_students_sections', id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      toast({ title: 'Sección eliminada' });
    } catch (err) {
      toast({ title: 'Error al eliminar', description: String(err), variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = MODULES.map((m) => ({
    module: m,
    items: sections.filter((s) => s.module_id === m.id),
  })).filter((g) => g.items.length > 0);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-extrabold">English for Students</h1>
            </div>
            <p className="text-muted-foreground text-sm">Crea y publica contenido educativo para cada módulo de habilidad.</p>
          </div>
          <Button onClick={openModal} className="gap-2 shrink-0" size="lg">
            <Plus className="w-4 h-4" /> Agregar sección
          </Button>
        </div>

        {/* Cargando */}
        {loadingData && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Cargando secciones...</span>
          </div>
        )}

        {/* Estado vacío */}
        {!loadingData && sections.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="border-2 border-dashed border-border rounded-2xl py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">📚</div>
            <div>
              <p className="font-semibold text-foreground">Aún no hay secciones publicadas</p>
              <p className="text-sm text-muted-foreground mt-1">Haz clic en <strong>Agregar sección</strong> para empezar.</p>
            </div>
            <Button variant="outline" onClick={openModal} className="gap-2 mt-2"><Plus className="w-4 h-4" /> Agregar sección</Button>
          </motion.div>
        )}

        {/* Secciones agrupadas */}
        {!loadingData && grouped.map(({ module: m, items }) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-lg shadow-sm`}>{m.emoji}</div>
              <div>
                <h2 className="font-bold text-base">{m.label}</h2>
                <p className="text-xs text-muted-foreground">{items.length} sección{items.length !== 1 ? 'es' : ''} publicadas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((sec) => (
                <motion.div key={sec.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className={`ring-1 ${m.ring} bg-gradient-to-br ${m.softBg} border-border/50 overflow-hidden`}>
                    {sec.image_path && (
                      <div className="relative h-32 overflow-hidden">
                        <img src={storageUrl(sec.image_path)} alt={sec.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}
                    <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 pt-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] ${m.badge} border-0`}>{m.label}</Badge>
                          <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 gap-1">
                            <Globe className="w-2.5 h-2.5" /> Publicado
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-bold leading-snug line-clamp-2">{sec.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                        disabled={deletingId === sec.id} onClick={() => handleDelete(sec.id)}>
                        {deletingId === sec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3 space-y-1.5">
                      {sec.rich_text && (
                        <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: sec.rich_text }} />
                      )}
                      {sec.audio_path && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Music2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">
                            {sec.audio_path.startsWith('http') ? '🔗 URL externa' : sec.audio_path.split('/').pop()}
                          </span>
                        </div>
                      )}
                      {sec.pdf_path && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">
                            {sec.pdf_path.startsWith('http') ? '🔗 URL externa' : sec.pdf_path.split('/').pop()}
                          </span>
                        </div>
                      )}
                      {sec.embed_html && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Code2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="truncate">Contenido embebido (HTML)</span>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 pt-0.5">
                        {new Date(sec.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <motion.div key="panel" initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}>

              {/* PASO 1: Seleccionar módulo */}
              {step === 'select' && (
                <div className="p-6 overflow-y-auto">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-extrabold">Selecciona el módulo</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">¿A qué habilidad pertenece esta sección?</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-1" onClick={closeModal}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-2">
                    {MODULES.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button key={m.id} onClick={() => handleSelectModule(m.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${m.softBg} border border-border/60 ring-1 ${m.ring} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group`}>
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-xl shadow-sm shrink-0`}>{m.emoji}</div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{m.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.type === 'listening' ? 'Audio + PDF worksheet' : 'Texto enriquecido + imagen'}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 2: Formulario */}
              {step === 'form' && mod && (
                <>
                  {/* Cabecera fija */}
                  <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setStep('select')} className="text-muted-foreground hover:text-foreground transition-colors" title="Volver">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-lg shadow-sm shrink-0`}>{mod.emoji}</div>
                      <div>
                        <h2 className="text-base font-extrabold leading-tight">Nueva sección · {mod.label}</h2>
                        <p className="text-xs text-muted-foreground">{isRichText ? 'Texto enriquecido + imagen' : 'Audio + PDF worksheet'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={closeModal}><X className="w-4 h-4" /></Button>
                  </div>

                  {/* Cuerpo desplazable */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Título */}
                    <div className="space-y-1.5">
                      <Label htmlFor="sec-title" className="text-sm font-semibold">Título <span className="text-destructive">*</span></Label>
                      <Input id="sec-title" autoFocus value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                        placeholder={`Ej: ${mod.id === 'listening' ? 'Podcast sobre tecnología' : 'Conectores de contraste'}`} className="text-sm" />
                    </div>

                    {/* RICHTEXT + IMAGEN */}
                    {isRichText && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">Contenido <span className="text-destructive">*</span></Label>
                          <RichTextEditor content={formRichText} onChange={setFormRichText} placeholder={`Escribe el contenido de ${mod.label.toLowerCase()}...`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">Imagen <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                          <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setImageMode('file')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${imageMode === 'file' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              📁 Subir archivo
                            </button>
                            <button type="button" onClick={() => setImageMode('url')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${imageMode === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              🔗 URL externa
                            </button>
                          </div>
                          {imageMode === 'file' ? (
                            <ImageUploadZone preview={formImagePreview} fileName={formImageFile?.name ?? null}
                              onFile={(f, p) => { setFormImageFile(f); setFormImagePreview(p); }}
                              onClear={() => { setFormImageFile(null); setFormImagePreview(null); }} />
                          ) : (
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://drive.google.com/uc?export=view&id=..." className="text-sm" />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5" /> Código HTML embebido <span className="text-muted-foreground font-normal">(opcional)</span>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Pega aquí el código &lt;iframe&gt; o de "insertar" que te da otra página (Canva, YouTube, Google Forms, etc.) y se mostrará dentro de esta sección.
                          </p>
                          <Textarea value={formEmbedHtml} onChange={(e) => setFormEmbedHtml(e.target.value)}
                            placeholder='<iframe src="https://..." width="100%" height="400"></iframe>'
                            className="text-xs font-mono min-h-[100px]" />
                          {formEmbedHtml.trim() && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Vista previa:</p>
                              <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
                                <iframe
                                  srcDoc={formEmbedHtml}
                                  className="w-full"
                                  style={{ height: '320px', border: 0 }}
                                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                  title="Vista previa del embed"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* AUDIO + PDF */}
                    {isListening && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">Archivo de audio <span className="text-destructive">*</span></Label>
                          <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setAudioMode('file')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${audioMode === 'file' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              📁 Subir archivo
                            </button>
                            <button type="button" onClick={() => setAudioMode('url')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${audioMode === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              🔗 URL externa
                            </button>
                          </div>
                          {audioMode === 'file' ? (
                            <FileUploadZone icon={Music2} label="Subir audio" hint="MP3, WAV, OGG, M4A — máx. 50 MB"
                              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
                              fileName={formAudioFile?.name ?? null} fileSize={formAudioFile ? fmtBytes(formAudioFile.size) : null}
                              onFile={(f) => setFormAudioFile(f)} onClear={() => setFormAudioFile(null)} accent="text-orange-500" />
                          ) : (
                            <Input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)}
                              placeholder="https://drive.google.com/file/d/.../view" className="text-sm" />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-semibold">PDF Worksheet <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                          <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setPdfMode('file')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${pdfMode === 'file' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              📁 Subir archivo
                            </button>
                            <button type="button" onClick={() => setPdfMode('url')}
                              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${pdfMode === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                              🔗 URL externa
                            </button>
                          </div>
                          {pdfMode === 'file' ? (
                            <FileUploadZone icon={FileText} label="Subir PDF" hint="Worksheet en PDF — máx. 20 MB"
                              accept="application/pdf,.pdf"
                              fileName={formPdfFile?.name ?? null} fileSize={formPdfFile ? fmtBytes(formPdfFile.size) : null}
                              onFile={(f) => setFormPdfFile(f)} onClear={() => setFormPdfFile(null)} accent="text-red-500" />
                          ) : (
                            <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)}
                              placeholder="https://drive.google.com/file/d/.../preview" className="text-sm" />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Pie fijo */}
                  <div className="px-6 py-4 border-t border-border bg-muted/20 shrink-0 flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="sm:w-auto w-full" onClick={closeModal}>Cancelar</Button>
                    <Button className={`flex-1 gap-2 bg-gradient-to-r ${mod.gradient} text-white border-0 hover:opacity-90 disabled:opacity-50`}
                      disabled={!canPublish() || publishing} onClick={handlePublish}>
                      {publishing
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
                        : <><Globe className="w-4 h-4" /> Publicar sección</>}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
