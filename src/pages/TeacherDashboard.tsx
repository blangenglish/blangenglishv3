// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  GraduationCap, Users, LogOut, Loader2, BookOpen, ChevronRight, Menu, X,
} from 'lucide-react';

/* ───────────── Config ───────────── */
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const TEACHER_PORTAL_URL = `${SUPABASE_URL}/functions/v1/teacher-portal`;

/* ───────────── Types ───────────── */
interface Student {
  id: string;
  full_name: string;
  email: string;
  current_level: string | null;
  avatar_url: string | null;
  progress_pct: number;
  completed_units: number;
  total_units: number;
}

interface TeacherDashboardProps {
  onLogout?: () => void;
  userName?: string;
}

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
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>{l}</span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const safe = Math.min(100, Math.max(0, Math.round(pct)));
  const color =
    safe >= 75 ? 'bg-emerald-500' :
    safe >= 40 ? 'bg-amber-400' :
                 'bg-primary';
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${safe}%` }} />
    </div>
  );
}

function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const initial = (name || '?')[0].toUpperCase();
  if (url) return <img src={url} alt={name} className={`${dims} rounded-full object-cover`} />;
  return (
    <div className={`${dims} rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0`}>
      {initial}
    </div>
  );
}

/* ───────────── Main component ───────────── */
export default function TeacherDashboard({ onLogout, userName }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState(userName || '');
  const [teacherId, setTeacherId]     = useState('');
  const [students, setStudents]       = useState<Student[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav]     = useState<'students'>('students');

  /* ── Safety timeout: si verify tarda más de 6s, redirigir al home ── */
  useEffect(() => {
    const t = setTimeout(() => {
      if (loadingAuth) navigate(ROUTE_PATHS.HOME, { replace: true });
    }, 6000);
    return () => clearTimeout(t);
  }, [loadingAuth]);

  /* ── Verify teacher auth on mount ── */
  useEffect(() => {
    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate(ROUTE_PATHS.HOME, { replace: true });
          return;
        }

        const { data: profile, error: profileErr } = await supabase
          .from('teacher_profiles')
          .select('full_name, is_active')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileErr) throw profileErr;

        if (!profile || !profile.is_active) {
          await supabase.auth.signOut();
          navigate(ROUTE_PATHS.HOME, { replace: true });
          return;
        }

        setTeacherName(profile.full_name || userName || 'Profesor');
        setTeacherId(session.user.id);
        setLoadingAuth(false);
      } catch (err) {
        console.error('[TeacherDashboard] verify error:', err);
        navigate(ROUTE_PATHS.HOME, { replace: true });
      }
    };
    verify();
  }, []);

  /* ── Load students when auth is ready ── */
  useEffect(() => {
    if (loadingAuth) return;
    loadStudents();
  }, [loadingAuth]);

  const loadStudents = async () => {
    setLoadingStudents(true);
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
        body: JSON.stringify({ action: 'get_my_students' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      // edge function returns { data: Student[] }
      setStudents(json.data || []);
    } catch (e: any) {
      setErrorMsg('No se pudo cargar la lista de estudiantes. Intenta de nuevo.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  /* ── Full-screen auth loader ── */
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10 opacity-60" />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  /* ── Nav items ── */
  const navItems = [
    { id: 'students', icon: Users, label: 'Mis Estudiantes' },
  ];

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

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-10" />
          <p className="text-xs text-muted-foreground mt-2">Portal del Profesor</p>
        </div>

        {/* Teacher avatar + name */}
        <div className="px-4 py-5 border-b border-border flex items-center gap-3">
          <Avatar name={teacherName} size="md" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Profesor/a</p>
            <p className="text-sm font-semibold truncate text-foreground">{teacherName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id as any); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="lg:ml-64 flex-1 min-h-screen">
        <div className="pt-16 lg:pt-0 p-6 max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Mis Estudiantes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Estudiantes asignados a tu perfil
            </p>
          </div>

          {/* Loading */}
          {loadingStudents && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando estudiantes...</p>
            </div>
          )}

          {/* Error */}
          {!loadingStudents && errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={loadStudents}>Reintentar</Button>
            </div>
          )}

          {/* Empty state */}
          {!loadingStudents && !errorMsg && students.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Todavía no tienes estudiantes asignados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El administrador debe asignarte estudiantes desde el panel de Profesores.
                </p>
              </div>
            </div>
          )}

          {/* Students list */}
          {!loadingStudents && !errorMsg && students.length > 0 && (
            <div className="space-y-3">
              {/* Count badge */}
              <p className="text-xs text-muted-foreground font-medium mb-4">
                {students.length} {students.length === 1 ? 'estudiante asignado' : 'estudiantes asignados'}
              </p>

              {students.map((s) => (
                <Card
                  key={s.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-4">

                    {/* Avatar */}
                    <Avatar name={s.full_name} url={s.avatar_url} size="md" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {s.full_name || 'Estudiante'}
                        </p>
                        <LevelBadge level={s.current_level} />
                      </div>

                      <p className="text-xs text-muted-foreground truncate mb-2">{s.email}</p>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <ProgressBar pct={s.progress_pct} />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-10 text-right shrink-0">
                          {Math.round(s.progress_pct)}%
                        </span>
                      </div>

                      {s.total_units > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.completed_units} de {s.total_units} unidades completadas
                        </p>
                      )}
                    </div>

                    {/* Ver detalle button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 text-xs rounded-lg"
                      disabled
                      title="Próximamente disponible"
                    >
                      Ver detalle
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>

                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
