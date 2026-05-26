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
} from 'lucide-react';

/* ───────────── Config ───────────── */
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const TEACHER_PORTAL_URL = `${SUPABASE_URL}/functions/v1/teacher-portal`;

/* ───────────── Types ───────────── */
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
  student: { id: string; full_name: string; email: string; current_level: string | null; avatar_url: string | null };
  stats: { total_points: number; streak_days: number; completed_units: number; total_units: number; progress_pct: number };
  courses: CourseSection[];
}

interface Props { onLogout?: () => void }

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

function ProgressBar({ pct, height = 'h-2' }: { pct: number; height?: string }) {
  const safe = Math.min(100, Math.max(0, Math.round(pct)));
  const color = safe >= 75 ? 'bg-emerald-500' : safe >= 40 ? 'bg-amber-400' : 'bg-primary';
  return (
    <div className={`w-full bg-muted rounded-full ${height} overflow-hidden`}>
      <div className={`${height} rounded-full transition-all ${color}`} style={{ width: `${safe}%` }} />
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

function UnitStatus({ unit }: { unit: UnitRow }) {
  if (unit.completed) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completada
      </span>
    );
  }
  if (unit.stages_done > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <Circle className="h-3.5 w-3.5" />
        En progreso ({unit.stages_done}/{unit.stages_total})
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
      <Circle className="h-3.5 w-3.5" />
      Sin iniciar
    </span>
  );
}

function QuizBadge({ passed }: { passed: boolean | null }) {
  if (passed === true) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Aprobó
      </span>
    );
  }
  if (passed === false) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
        <XCircle className="h-3 w-3" /> Reprobó
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground px-2 py-0.5">—</span>
  );
}

/* ───────────── Main component ───────────── */
export default function TeacherStudentDetail({ onLogout }: Props) {
  const navigate    = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();

  const [teacherName, setTeacherName]   = useState('');
  const [detail, setDetail]             = useState<StudentDetail | null>(null);
  const [loadingAuth, setLoadingAuth]   = useState(true);
  const [loadingData, setLoadingData]   = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
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

  const s = detail?.student;
  const stats = detail?.stats;
  const courses = detail?.courses || [];

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-8" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
                      <ProgressBar pct={stats?.progress_pct || 0} height="h-2" />
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
                  {
                    icon: Trophy,
                    label: 'Puntos',
                    value: (stats?.total_points || 0).toLocaleString(),
                    color: 'text-amber-500',
                    bg: 'bg-amber-50 dark:bg-amber-950/30',
                  },
                  {
                    icon: Flame,
                    label: 'Racha',
                    value: `${stats?.streak_days || 0} días`,
                    color: 'text-orange-500',
                    bg: 'bg-orange-50 dark:bg-orange-950/30',
                  },
                  {
                    icon: CheckCircle2,
                    label: 'Unidades',
                    value: `${stats?.completed_units || 0}/${stats?.total_units || 0}`,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                  },
                  {
                    icon: Star,
                    label: 'Progreso',
                    value: `${stats?.progress_pct || 0}%`,
                    color: 'text-primary',
                    bg: 'bg-primary/5',
                  },
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
                  const isOpen = !!expandedCourses[course.id];
                  const coursePct = course.total_units > 0
                    ? Math.round((course.completed_units / course.total_units) * 100)
                    : 0;

                  return (
                    <Card key={course.id} className="rounded-2xl border border-border overflow-hidden">
                      {/* Course header — clickable to expand */}
                      <button
                        onClick={() => toggleCourse(course.id)}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-accent/50 transition-colors text-left"
                      >
                        <span className="text-2xl shrink-0">{course.emoji || '📘'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-foreground text-sm">{course.title}</p>
                            <LevelBadge level={course.level} />
                          </div>
                          <div className="flex items-center gap-2">
                            <ProgressBar pct={coursePct} height="h-1.5" />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {course.completed_units}/{course.total_units} unidades
                            </span>
                          </div>
                        </div>
                        {isOpen
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                      </button>

                      {/* Units list */}
                      {isOpen && (
                        <div className="border-t border-border divide-y divide-border">
                          {/* Table header */}
                          <div className="px-5 py-2 grid grid-cols-12 text-xs font-semibold text-muted-foreground bg-muted/30">
                            <span className="col-span-6">Unidad</span>
                            <span className="col-span-3 text-center">Estado</span>
                            <span className="col-span-3 text-center">Quiz</span>
                          </div>

                          {course.units.map(unit => (
                            <div key={unit.id} className="px-5 py-3 grid grid-cols-12 items-center gap-2">
                              {/* Unit title */}
                              <div className="col-span-6 flex items-start gap-2">
                                <span className={`text-xs font-bold shrink-0 mt-0.5 ${unit.completed ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                  {String(unit.sort_order).padStart(2, '0')}
                                </span>
                                <p className="text-sm text-foreground leading-tight">{unit.title}</p>
                              </div>

                              {/* Status */}
                              <div className="col-span-3 flex justify-center">
                                <UnitStatus unit={unit} />
                              </div>

                              {/* Quiz */}
                              <div className="col-span-3 flex justify-center">
                                <QuizBadge passed={unit.quiz_passed} />
                              </div>
                            </div>
                          ))}
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
