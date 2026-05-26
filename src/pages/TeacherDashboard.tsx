// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, LogOut, Users, BookOpen, Calendar, Loader2 } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';

interface TeacherDashboardProps {
  onLogout?: () => void;
  userName?: string;
}

export default function TeacherDashboard({ onLogout, userName }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState(userName || '');
  const [loading, setLoading]         = useState(!userName);

  useEffect(() => {
    // Verify the user is actually a teacher and load their profile
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate(ROUTE_PATHS.HOME, { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('teacher_profiles')
        .select('full_name, is_active')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile) {
        // Not a teacher — redirect home
        await supabase.auth.signOut();
        navigate(ROUTE_PATHS.HOME, { replace: true });
        return;
      }

      setTeacherName(profile.full_name || userName || 'Profesor');
      setLoading(false);
    };

    verify();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) onLogout();
    navigate(ROUTE_PATHS.HOME, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      icon: Users,
      label: 'Mis Estudiantes',
      desc: 'Próximamente disponible',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      disabled: true,
    },
    {
      icon: BookOpen,
      label: 'Material de Clase',
      desc: 'Próximamente disponible',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      disabled: true,
    },
    {
      icon: Calendar,
      label: 'Mi Agenda',
      desc: 'Próximamente disponible',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      disabled: true,
    },
  ];

  return (
    <Layout isLoggedIn onLogout={handleLogout} userName={teacherName}>
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Welcome header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-8 h-8 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Panel del Profesor</p>
              <h1 className="text-2xl font-extrabold tracking-tight">
                ¡Hola, {teacherName}! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Bienvenido/a a tu espacio de trabajo en BLANG
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </div>

        {/* Coming soon banner */}
        <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-6 py-5 mb-8 flex items-center gap-4">
          <span className="text-3xl">🚀</span>
          <div>
            <p className="font-bold text-green-800">Tu panel de profesor está en preparación</p>
            <p className="text-sm text-green-700 mt-0.5">
              Próximamente tendrás acceso a tus estudiantes asignados, materiales de clase y agenda de sesiones.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <Card
                key={c.label}
                className={`p-5 rounded-2xl border ${c.color} opacity-70 cursor-not-allowed`}
              >
                <Icon className="w-7 h-7 mb-3" />
                <p className="font-bold text-sm">{c.label}</p>
                <p className="text-xs mt-1 opacity-70">{c.desc}</p>
              </Card>
            );
          })}
        </div>

      </div>
    </Layout>
  );
}
