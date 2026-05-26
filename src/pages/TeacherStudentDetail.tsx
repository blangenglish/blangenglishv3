// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  LogOut, Users, ArrowLeft, Loader2, BookOpen,
  CheckCircle2, Circle, XCircle, Star, Flame,
  Trophy, ChevronDown, ChevronUp, Menu, X,
  FileText, Link2, Image, Volume2, Video, AlignLeft,
  AlertCircle,
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

/* ───────────── Types ───────────── */
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

interface StageProgress {
  completed: boolean;
  completed_at: string | null;
  quiz_passed: boolean | null;
}

interface StageData {
  id: string;
  materials: Material[];
  quiz: QuizQuestion[] | null;
  progress: StageProgress | null;
}

interface UnitRow {
  id: string;
  title: string;
  sort_order: number;
  stages_total: number;
  stages_done: number;
  completed: boolean;
  quiz_passed: boolean | null;
}

interface CourseSection {
  id: string;
  title: string;
  slug: string;
  level: string;
  level_label: string;
  emoji: string;
  sort_order: number;
  completed_units: number;
  total_units: number;
  units: UnitRow[];
}

interface StudentDetail {
  student: {
    id: string;
    full_name: string;
    email: string;
    current_level: string | null;
    avatar_url: string | null;
  };
  stats: {
    total_points: number;
    streak_days: number;
    completed_units: number;
    total_units: number;
    progress_pct: number;
  };
  courses: CourseSection[];
}

interface Props { onLogout?: () => void }

type UnitStagesState = StageData[] | 'loading' | 'error';

/* ───────────── Helpers ───────────── */
const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-700 border-slate-200',
  A2: 'bg-blue-100 text-blue-700 border-blue-200',
  B1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B2: 'bg-violet-100 text-violet-700 border-violet-200',
  C1: 'bg-amber-100 text-amber-700 border-amber-200',
  C2: 'bg-rose-100 text-rose-700 border-rose-200',
};

function LevelBadge({ level }: { level: string | null }) {
  const l = (level || 'A1').toUpperCase();
  const cls = LEVEL_COLORS[l] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>{l}</span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const safe = Math.min(100, Math.max(0, Math.round(pct)));
  const color = safe >= 75 ? 'bg-emerald-500' : safe >= 40 ? 'bg-amber-400' : 'bg-primary';
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${safe}%` }} />
    </div>
  );
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const initial = (name || '?')[0].toUpperCase();
  if (url) return <img src={url} alt={name} className="w-14 h-14 rounded-full object-cover" />;
  return (
    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xl text-primary shrink-0">
      {initial}
    </div>
  );
}

function QuizPassedBadge({ passed }: { passed: boolean | null | undefined }) {
  if (passed === true) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Aprobó el quiz
      </span>
    );
  }
  if (passed === false) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
        <XCircle className="h-3 w-3" /> Reprobó el quiz
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
      <Circle className="h-3 w-3" /> Sin intento
    </span>
  );
}

/* ── YouTube / Vimeo embed helpers ── */
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
        const ytEmbed  = getYoutubeEmbedUrl(rawUrl);
        const vmEmbed  = getVimeoEmbedUrl(rawUrl);
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
          <img
            src={mat.file_url}
            alt={mat.title}
            className="max-w-full rounded-lg border border-border object-contain max-h-80"
          />
        ) : null;

      case 'audio':
        return mat.file_url ? (
          <audio
            controls
            src={mat.file_url}
            className="w-full rounded-lg"
          />
        ) : null;

      case 'video':
        return mat.file_url ? (
          <video
            controls
            src={mat.file_url}
            className="w-full rounded-lg border border-border max-h-72"
          />
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

  /* Icon for the card header */
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

  const mediaEl = renderMedia();

  /* For "text" type, description IS the content — don't show it twice */
  const showDesc = mat.description && type !== 'text';

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TypeIcon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{typeLabel}</span>
        {mat.title && (
          <span className="text-sm font-medium text-foreground truncate">{mat.title}</span>
        )}
      </div>

      {/* Description / additional text */}
      {showDesc && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: mat.description! }}
        />
      )}

      {/* Main media */}
      {mediaEl && <div>{mediaEl}</div>}
    </div>
  );
}

/* ── Quiz viewer (read-only) ── */
function QuizReview({ questions }: { questions: QuizQuestion[] }) {
  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin preguntas disponibles.</p>;
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id || idx} className="rounded-lg border border-border bg-card p-4 space-y-3">
          {/* Question */}
          <p className="text-sm font-semibold text-foreground">
            <span className="text-muted-foreground mr-1">{idx + 1}.</span>
            {q.question}
          </p>

          {/* Answers by type */}
          {(q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'listen_select') && q.options && (
            <div className="space-y-1.5 pl-2">
              {q.options.map((opt, oi) => (
                <div
                  key={opt.id || oi}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
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

          {/* Explanation */}
          {q.explanation && q.explanation !== q.correctAnswer && (
            <p className="text-xs text-muted-foreground italic pl-2">
              Nota: {q.explanation}
            </p>
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
      {/* Stage header */}
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
        {/* Quiz badge */}
        <div className="shrink-0">
          <QuizPassedBadge passed={stage.progress?.quiz_passed} />
        </div>
        {/* Completion indicator */}
        {stage.progress?.completed
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        }
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

          {/* Materials */}
          {stage.materials.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Material</p>
              {stage.materials.map(mat => (
                <MaterialCard key={mat.id} mat={mat} />
              ))}
            </div>
          )}

          {/* Quiz */}
          {stage.quiz && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quiz</p>
                <QuizPassedBadge passed={stage.progress?.quiz_passed} />
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ℹ️ Solo se muestran las respuestas correctas. Las respuestas del estudiante no se almacenan individualmente.
                </p>
              </div>
              <QuizReview questions={stage.quiz} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────── Main component ───────────── */
export default function TeacherStudentDetail({ onLogout }: Props) {
  const navigate       = useNavigate();
  const { studentId }  = useParams<{ studentId: string }>();

  const [teacherName, setTeacherName]         = useState('');
  const [detail, setDetail]                   = useState<StudentDetail | null>(null);
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
        console.error('[TeacherStudentDetail] verify error:', err);
        navigate(ROUTE_PATHS.HOME, { replace: true });
      }
    };
    verify();
  }, []);

  /* ── Load student detail when auth ready ── */
  useEffect(() => {
    if (loadingAuth || !studentId) return;
    loadDetail();
  }, [loadingAuth, studentId]);

  const loadDetail = async () => {
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
        body: JSON.stringify({ action: 'get_student_detail', student_id: studentId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setDetail(json.data);

      // Expand first course by default
      const courses: CourseSection[] = json.data?.courses || [];
      if (courses.length > 0) {
        setExpandedCourses({ [courses[0].id]: true });
      }
    } catch (e: any) {
      setErrorMsg('No se pudo cargar la información del estudiante. Intenta de nuevo.');
    } finally {
      setLoadingData(false);
    }
  };

  /* ── Lazy-load stages for a unit ── */
  const loadUnitStages = async (unitId: string) => {
    if (unitStages[unitId]) return; // already loaded or loading
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
        body: JSON.stringify({ action: 'get_unit_stages', student_id: studentId, unit_id: unitId }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const stages: StageData[] = json.data?.stages || [];

      // Make sure all 5 stages are present (fill missing ones as empty)
      const byId: Record<string, StageData> = {};
      stages.forEach(s => { byId[s.id] = s; });

      const full: StageData[] = STAGE_ORDER.map(sid => byId[sid] || {
        id: sid,
        materials: [],
        quiz: null,
        progress: null,
      });

      setUnitStages(prev => ({ ...prev, [unitId]: full }));
    } catch (e) {
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

  const s      = detail?.student;
  const stats  = detail?.stats;
  const courses = detail?.courses || [];

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

          {/* Back button */}
          <button
            onClick={() => navigate(ROUTE_PATHS.TEACHER_DASHBOARD)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Estudiantes
          </button>

          {/* Loading */}
          {loadingData && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando información del estudiante...</p>
            </div>
          )}

          {/* Error */}
          {!loadingData && errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={loadDetail}>Reintentar</Button>
            </div>
          )}

          {/* Content */}
          {!loadingData && !errorMsg && detail && (
            <div className="space-y-6">

              {/* ── Student header card ── */}
              <Card className="p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-4">
                  <Avatar name={s?.full_name || '?'} url={s?.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h1 className="text-lg font-bold text-foreground">{s?.full_name || 'Estudiante'}</h1>
                      <LevelBadge level={s?.current_level} />
                    </div>
                    <p className="text-sm text-muted-foreground">{s?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar pct={stats?.progress_pct || 0} />
                      <span className="text-xs font-semibold text-muted-foreground shrink-0 w-10 text-right">
                        {stats?.progress_pct || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── Stats row ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Trophy,        label: 'Puntos',   value: (stats?.total_points || 0).toLocaleString(), color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30'   },
                  { icon: Flame,         label: 'Racha',    value: `${stats?.streak_days || 0} días`,           color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/30' },
                  { icon: CheckCircle2,  label: 'Unidades', value: `${stats?.completed_units || 0}/${stats?.total_units || 0}`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  { icon: Star,          label: 'Progreso', value: `${stats?.progress_pct || 0}%`,              color: 'text-primary',     bg: 'bg-primary/5'                       },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className={`p-4 rounded-xl border border-border ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color} mb-2`} />
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </Card>
                  );
                })}
              </div>

              {/* ── Courses ── */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Progreso por Curso
                </h2>

                {courses.length === 0 && (
                  <div className="rounded-xl border border-border bg-muted/30 px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">No hay cursos disponibles.</p>
                  </div>
                )}

                {courses.map(course => {
                  const isCourseOpen = !!expandedCourses[course.id];
                  const coursePct    = course.total_units > 0
                    ? Math.round((course.completed_units / course.total_units) * 100)
                    : 0;

                  return (
                    <Card key={course.id} className="rounded-2xl border border-border overflow-hidden">

                      {/* ── Course header ── */}
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
                            {course.completed_units}/{course.total_units} unidades completadas · {coursePct}%
                          </p>
                        </div>
                        {isCourseOpen
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                      </button>

                      {/* ── Units list ── */}
                      {isCourseOpen && (
                        <div className="border-t border-border divide-y divide-border">
                          {course.units.length === 0 && (
                            <div className="px-5 py-6 text-center">
                              <p className="text-sm text-muted-foreground">No hay unidades en este curso.</p>
                            </div>
                          )}

                          {course.units.map(unit => {
                            const isUnitOpen   = !!expandedUnits[unit.id];
                            const stagesState  = unitStages[unit.id];

                            return (
                              <div key={unit.id}>
                                {/* Unit row — click to expand */}
                                <button
                                  onClick={() => toggleUnit(unit.id)}
                                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-accent/30 transition-colors text-left"
                                >
                                  {/* Number */}
                                  <span className={`text-xs font-bold shrink-0 w-6 text-center ${unit.completed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                    {String(unit.sort_order).padStart(2, '0')}
                                  </span>

                                  {/* Title */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground leading-tight">{unit.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {unit.stages_done > 0
                                        ? `${unit.stages_done} de 5 partes completadas`
                                        : 'Sin iniciar'}
                                    </p>
                                  </div>

                                  {/* Status chip */}
                                  {unit.completed ? (
                                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                                      <CheckCircle2 className="h-3 w-3" /> Completada
                                    </span>
                                  ) : unit.stages_done > 0 ? (
                                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                                      <Circle className="h-3 w-3" /> En progreso
                                    </span>
                                  ) : null}

                                  {isUnitOpen
                                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                  }
                                </button>

                                {/* ── Stages panel ── */}
                                {isUnitOpen && (
                                  <div className="border-t border-border bg-muted/5 px-5 py-4 space-y-3">

                                    {/* Loading stages */}
                                    {stagesState === 'loading' && (
                                      <div className="flex items-center gap-3 py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Cargando partes de la unidad...</p>
                                      </div>
                                    )}

                                    {/* Error loading stages */}
                                    {stagesState === 'error' && (
                                      <div className="flex items-center gap-3 py-3 text-destructive">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <p className="text-sm">No se pudo cargar el contenido de esta unidad.</p>
                                        <button
                                          className="text-xs underline ml-auto"
                                          onClick={() => {
                                            // Remove error state to allow retry
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

                                    {/* Stages content */}
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

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
