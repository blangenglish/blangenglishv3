// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  LogOut, Users, BookOpen, ArrowLeft, Loader2,
  ChevronDown, ChevronUp, Menu, X,
  FileText, Link2, Image, Volume2, Video, AlignLeft,
  CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';

/* ───────────── Config ───────────── */
const SUPABASE_URL       = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const TEACHER_PORTAL_URL = `${SUPABASE_URL}/functions/v1/teacher-portal`;

/* ───────────── Stage config ───────────── */
const STAGE_ORDER = ['grammar', 'vocabulary', 'reading', 'listening', 'ai_practice'] as const;
const STAGE_META: Record<string, { label: string; emoji: string }> = {
  grammar:     { label: 'Part 1 – Grammar',    emoji: '📚' },
  vocabulary:  { label: 'Part 2 – Vocabulary', emoji: '📖' },
  reading:     { label: 'Part 3 – Reading',    emoji: '📰' },
  listening:   { label: 'Part 4 – Listening',  emoji: '🎧' },
  ai_practice: { label: 'Part 5 – Practice',   emoji: '🤖' },
};

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-700 border-slate-200',
  A2: 'bg-blue-100 text-blue-700 border-blue-200',
  B1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B2: 'bg-violet-100 text-violet-700 border-violet-200',
  C1: 'bg-amber-100 text-amber-700 border-amber-200',
  C2: 'bg-rose-100 text-rose-700 border-rose-200',
};

/* ───────────── Types ───────────── */
interface UnitItem {
  id: string;
  title: string;
  sort_order: number;
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  level: string;
  level_label: string;
  emoji: string;
  sort_order: number;
  units: UnitItem[];
}

interface Material {
  id: string;
  stage: string;
  material_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  external_url: string | null;
  sort_order: number;
}

interface QuizOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  correctAnswer?: string;
}

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  correctAnswer?: string;
  options?: QuizOption[];
  explanation?: string;
}

interface StageData {
  id: string;
  materials: Material[];
  quiz: QuizQuestion[] | null;
  progress: null;
}

type UnitStagesState = StageData[] | 'loading' | 'error';

interface Props { onLogout?: () => void }

/* ───────────── Helpers ───────────── */
function LevelBadge({ level }: { level: string | null }) {
  const l = (level || 'A1').toUpperCase();
  const cls = LEVEL_COLORS[l] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>{l}</span>
  );
}

function getYoutubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

/* ── Material viewer ── */
function MaterialCard({ mat }: { mat: Material }) {
  const type = mat.material_type;

  const renderMedia = () => {
    switch (type) {
      case 'pdf':
        return (
          <a
            href={mat.file_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            <FileText className="h-4 w-4 shrink-0" />
            {mat.file_name || mat.title || 'Abrir PDF'}
          </a>
        );
      case 'url': {
        const rawUrl = mat.external_url || '';
        const ytEmbed = getYoutubeEmbedUrl(rawUrl);
        const vmEmbed = getVimeoEmbedUrl(rawUrl);
        if (ytEmbed || vmEmbed) {
          return (
            <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={ytEmbed || vmEmbed!}
                title={mat.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return (
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            {rawUrl}
          </a>
        );
      }
      case 'image':
        return mat.file_url ? (
          <img src={mat.file_url} alt={mat.title} className="max-w-full rounded-lg border border-border object-contain max-h-80" />
        ) : null;
      case 'audio':
        return mat.file_url ? (
          <audio controls src={mat.file_url} className="w-full rounded-lg" />
        ) : null;
      case 'video':
        return mat.file_url ? (
          <video controls src={mat.file_url} className="w-full rounded-lg border border-border max-h-72" />
        ) : null;
      case 'text':
        return mat.description ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: mat.description }}
          />
        ) : null;
      default:
        return null;
    }
  };

  const TypeIcon =
    type === 'pdf'   ? FileText :
    type === 'url'   ? Link2    :
    type === 'image' ? Image    :
    type === 'audio' ? Volume2  :
    type === 'video' ? Video    :
    AlignLeft;

  const typeLabel =
    type === 'pdf'   ? 'PDF'    :
    type === 'url'   ? 'Video'  :
    type === 'image' ? 'Imagen' :
    type === 'audio' ? 'Audio'  :
    type === 'video' ? 'Video'  :
    'Texto';

  const mediaEl  = renderMedia();
  const showDesc = mat.description && type !== 'text';

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TypeIcon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{typeLabel}</span>
        {mat.title && (
          <span className="text-sm font-medium text-foreground truncate">{mat.title}</span>
        )}
      </div>
      {showDesc && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: mat.description! }}
        />
      )}
      {mediaEl && <div>{mediaEl}</div>}
    </div>
  );
}

/* ── Quiz viewer (read-only, correct answers highlighted) ── */
function QuizReview({ questions }: { questions: QuizQuestion[] }) {
  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin preguntas disponibles.</p>;
  }
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id || idx} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            <span className="text-muted-foreground mr-1">{idx + 1}.</span>
            {q.question}
          </p>

          {(q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'listen_select') && q.options && (
            <div className="space-y-1.5 pl-2">
              {q.options.map((opt, oi) => (
                <div
                  key={opt.id || oi}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    opt.isCorrect
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                      : 'bg-muted/30 border border-border text-muted-foreground'
                  }`}
                >
                  {opt.isCorrect
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    : <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  }
                  {opt.text}
                </div>
              ))}
            </div>
          )}

          {q.type === 'fill_gap' && q.correctAnswer && (
            <div className="pl-2">
              <span className="text-xs text-muted-foreground">Respuesta correcta: </span>
              <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300">
                {q.correctAnswer}
              </span>
            </div>
          )}

          {q.type === 'match' && q.options && (
            <div className="pl-2 space-y-1.5">
              {q.options.map((opt, oi) => (
                <div
                  key={opt.id || oi}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{opt.text}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="font-semibold">{opt.correctAnswer}</span>
                </div>
              ))}
            </div>
          )}

          {q.explanation && q.explanation !== q.correctAnswer && (
            <p className="text-xs text-muted-foreground italic pl-2">Nota: {q.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Stage section inside a unit ── */
function StageSection({ stage }: { stage: StageData }) {
  const [open, setOpen] = useState(false);
  const meta = STAGE_META[stage.id] || { label: stage.id, emoji: '📄' };
  const hasContent = stage.materials.length > 0 || !!stage.quiz;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors text-left"
      >
        <span className="text-lg shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="text-xs text-muted-foreground">
            {stage.materials.length > 0
              ? `${stage.materials.length} material${stage.materials.length !== 1 ? 'es' : ''}`
              : 'Sin materiales'}
            {stage.quiz ? ' · Quiz disponible' : ''}
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-5">
          {!hasContent && (
            <p className="text-sm text-muted-foreground italic text-center py-2">
              No hay contenido en esta parte.
            </p>
          )}

          {stage.materials.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Material</p>
              {stage.materials.map(mat => (
                <MaterialCard key={mat.id} mat={mat} />
              ))}
            </div>
          )}

          {stage.quiz && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quiz — respuestas correctas</p>
              <QuizReview questions={stage.quiz} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────── Main component ───────────── */
export default function TeacherUnits({ onLogout }: Props) {
  const navigate = useNavigate();

  const [teacherName, setTeacherName]         = useState('');
  const [courses, setCourses]                 = useState<CourseItem[]>([]);
  const [loadingAuth, setLoadingAuth]         = useState(true);
  const [loadingData, setLoadingData]         = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedUnits, setExpandedUnits]     = useState<Record<string, boolean>>({});
  const [unitStages, setUnitStages]           = useState<Record<string, UnitStagesState>>({});

  /* ── Safety timeout ── */
  useEffect(() => {
    const t = setTimeout(() => {
      if (loadingAuth) navigate(ROUTE_PATHS.HOME, { replace: true });
    }, 6000);
    return () => clearTimeout(t);
  }, [loadingAuth]);

  /* ── Verify teacher auth ── */
  useEffect(() => {
    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate(ROUTE_PATHS.HOME, { replace: true }); return; }

        const { data: profile, error: pErr } = await supabase
          .from('teacher_profiles')
          .select('full_name, is_active')
          .eq('id', session.user.id)
          .maybeSingle();

        if (pErr) throw pErr;
        if (!profile || !profile.is_active) {
          await supabase.auth.signOut();
          navigate(ROUTE_PATHS.HOME, { replace: true });
          return;
        }

        setTeacherName(profile.full_name || 'Profesor');
        setLoadingAuth(false);
      } catch (err) {
        console.error('[TeacherUnits] verify error:', err);
        navigate(ROUTE_PATHS.HOME, { replace: true });
      }
    };
    verify();
  }, []);

  /* ── Load all units when auth ready ── */
  useEffect(() => {
    if (loadingAuth) return;
    loadAllUnits();
  }, [loadingAuth]);

  const loadAllUnits = async () => {
    setLoadingData(true);
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No session');

      const res = await fetch(TEACHER_PORTAL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ action: 'get_all_units' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const courseList: CourseItem[] = json.data?.courses || [];
      setCourses(courseList);

      // Expand first course by default
      if (courseList.length > 0) {
        setExpandedCourses({ [courseList[0].id]: true });
      }
    } catch (e: any) {
      setErrorMsg('No se pudo cargar las unidades. Intenta de nuevo.');
    } finally {
      setLoadingData(false);
    }
  };

  /* ── Lazy-load stages for a unit (no student_id) ── */
  const loadUnitStages = async (unitId: string) => {
    if (unitStages[unitId]) return;
    setUnitStages(prev => ({ ...prev, [unitId]: 'loading' }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No session');

      const res = await fetch(TEACHER_PORTAL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        // No student_id — teacher's own view
        body: JSON.stringify({ action: 'get_unit_stages', unit_id: unitId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const stages: StageData[] = json.data?.stages || [];

      // Fill missing stages so all 5 always appear
      const byId: Record<string, StageData> = {};
      stages.forEach(s => { byId[s.id] = s; });

      const full: StageData[] = STAGE_ORDER.map(sid => byId[sid] || {
        id: sid,
        materials: [],
        quiz: null,
        progress: null,
      });

      setUnitStages(prev => ({ ...prev, [unitId]: full }));
    } catch {
      setUnitStages(prev => ({ ...prev, [unitId]: 'error' }));
    }
  };

  const toggleUnit = (unitId: string) => {
    const willOpen = !expandedUnits[unitId];
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
    if (willOpen) loadUnitStages(unitId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  /* ── Full-screen loader ── */
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10 opacity-60" />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUnits = courses.reduce((acc, c) => acc + c.units.length, 0);

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-8" />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-border">
          <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10" />
          <p className="text-xs text-muted-foreground mt-2">Portal del Profesor</p>
        </div>

        <div className="px-4 py-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
            {(teacherName || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Profesor/a</p>
            <p className="text-sm font-semibold truncate text-foreground">{teacherName}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => { navigate(ROUTE_PATHS.TEACHER_DASHBOARD); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Mis Estudiantes</span>
          </button>
          <button
            onClick={() => { navigate(ROUTE_PATHS.TEACHER_UNITS); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm bg-primary text-primary-foreground shadow-sm font-semibold"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Unidades</span>
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="lg:ml-64 flex-1 min-h-screen">
        <div className="pt-16 lg:pt-0 p-6 max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Unidades del Curso
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Material y quizzes de todas las unidades habilitadas
            </p>
          </div>

          {/* Loading */}
          {loadingData && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando unidades...</p>
            </div>
          )}

          {/* Error */}
          {!loadingData && errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={loadAllUnits}>Reintentar</Button>
            </div>
          )}

          {/* Empty */}
          {!loadingData && !errorMsg && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No hay cursos publicados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El administrador debe publicar cursos y unidades desde el panel de administración.
                </p>
              </div>
            </div>
          )}

          {/* Courses + units */}
          {!loadingData && !errorMsg && courses.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-medium mb-4">
                {courses.length} {courses.length === 1 ? 'curso' : 'cursos'} · {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
              </p>

              {courses.map(course => {
                const isCourseOpen = !!expandedCourses[course.id];

                return (
                  <Card key={course.id} className="rounded-2xl border border-border overflow-hidden">

                    {/* Course header */}
                    <button
                      onClick={() =>
                        setExpandedCourses(prev => ({ ...prev, [course.id]: !prev[course.id] }))
                      }
                      className="w-full px-5 py-4 flex items-center gap-4 hover:bg-accent/50 transition-colors text-left"
                    >
                      <span className="text-2xl shrink-0">{course.emoji || '📘'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-foreground text-sm">{course.title}</p>
                          <LevelBadge level={course.level} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {course.units.length} {course.units.length === 1 ? 'unidad' : 'unidades'}
                        </p>
                      </div>
                      {isCourseOpen
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                    </button>

                    {/* Units list */}
                    {isCourseOpen && (
                      <div className="border-t border-border divide-y divide-border">
                        {course.units.length === 0 && (
                          <div className="px-5 py-6 text-center">
                            <p className="text-sm text-muted-foreground">No hay unidades en este curso.</p>
                          </div>
                        )}

                        {course.units.map(unit => {
                          const isUnitOpen  = !!expandedUnits[unit.id];
                          const stagesState = unitStages[unit.id];

                          return (
                            <div key={unit.id}>
                              {/* Unit row */}
                              <button
                                onClick={() => toggleUnit(unit.id)}
                                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-accent/30 transition-colors text-left"
                              >
                                <span className="text-xs font-bold shrink-0 w-6 text-center text-muted-foreground">
                                  {String(unit.sort_order).padStart(2, '0')}
                                </span>
                                <p className="flex-1 text-sm font-medium text-foreground leading-tight">
                                  {unit.title}
                                </p>
                                {isUnitOpen
                                  ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                }
                              </button>

                              {/* Stages panel */}
                              {isUnitOpen && (
                                <div className="border-t border-border bg-muted/5 px-5 py-4 space-y-3">

                                  {stagesState === 'loading' && (
                                    <div className="flex items-center gap-3 py-4">
                                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                      <p className="text-sm text-muted-foreground">Cargando partes de la unidad...</p>
                                    </div>
                                  )}

                                  {stagesState === 'error' && (
                                    <div className="flex items-center gap-3 py-3 text-destructive">
                                      <AlertCircle className="h-4 w-4 shrink-0" />
                                      <p className="text-sm">No se pudo cargar el contenido.</p>
                                      <button
                                        className="text-xs underline ml-auto"
                                        onClick={() => {
                                          setUnitStages(prev => {
                                            const next = { ...prev };
                                            delete next[unit.id];
                                            return next;
                                          });
                                          loadUnitStages(unit.id);
                                        }}
                                      >
                                        Reintentar
                                      </button>
                                    </div>
                                  )}

                                  {Array.isArray(stagesState) && (
                                    <>
                                      {stagesState.every(s => s.materials.length === 0 && !s.quiz) ? (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">
                                          Esta unidad no tiene contenido cargado aún.
                                        </p>
                                      ) : (
                                        stagesState.map(stage => (
                                          <StageSection key={stage.id} stage={stage} />
                                        ))
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
