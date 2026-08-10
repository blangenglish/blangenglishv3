// @ts-nocheck
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ROUTE_PATHS, OPEN_PLAN_AFTER_AUTH_KEY } from '@/lib/index';
import { ADMIN_ROUTES } from '@/lib/admin';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import { LanguageProvider } from '@/lib/language';
import Home from '@/pages/Home';
import EnglishProgram from '@/pages/EnglishProgram';
import EnglishHub from '@/pages/EnglishHub';
import LevelTest from '@/pages/LevelTest';
import SpanishProgram from '@/pages/Spanish';
import Lessons from '@/pages/Lessons';
import LiveClasses from '@/pages/LiveClasses';
// Progress page removed
import Dashboard from '@/pages/Dashboard';
import FAQ from '@/pages/FAQ';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import ResetPassword from '@/pages/ResetPassword';
import EnglishModule from '@/pages/EnglishModule';
import Phonetics from '@/pages/Phonetics';
import { AuthModals } from '@/components/AuthModals';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminStudents from '@/pages/admin/AdminStudents';
import AdminRevenue from '@/pages/admin/AdminRevenue';
import AdminEnglishForStudents from '@/pages/admin/AdminEnglishForStudents';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminMundoReal from '@/pages/admin/AdminMundoReal';

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';

  const isAdminRoute = location.pathname.startsWith('/adminblang');

  useEffect(() => {
    if (isAdminRoute) {
      setSessionReady(true);
      return;
    }

    // Safety timeout: si getSession tarda más de 1.5s, desbloquear la app
    const safetyTimer = setTimeout(() => setSessionReady(true), 1500);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(safetyTimer);
      if (session?.user) {
        const authName =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'Estudiante';
        setIsLoggedIn(true);
        setUserName(authName);
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        // Cargar nombre real desde student_profiles
        try {
          const { data: prof } = await supabase
            .from('student_profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          if (prof?.full_name) setUserName(prof.full_name);
        } catch (_) { /* ignore */ }
      }
      setSessionReady(true);
    }).catch(() => { clearTimeout(safetyTimer); setSessionReady(true); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authName =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'Estudiante';
        setIsLoggedIn(true);
        setUserName(authName);
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        // Cargar nombre real desde student_profiles
        try {
          const { data: prof } = await supabase
            .from('student_profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();
          if (prof?.full_name) setUserName(prof.full_name);
        } catch (_) { /* ignore */ }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserName('');
        setUserId('');
        setUserEmail('');
      }
    });

    return () => subscription.unsubscribe();
  }, [isAdminRoute]);

  const handleLogin = (email: string, name: string, uid?: string, isAdmin?: boolean, country?: string, city?: string, isNewReg?: boolean, program?: 'english' | 'spanish') => {
    setIsLoggedIn(true);
    setUserName(name);
    setUserEmail(email);
    if (uid) setUserId(uid);
    setAuthModal(null);

    // Solo ir al panel admin si isAdmin=true fue EXPLÍCITAMENTE aprobado
    if (isAdmin === true) {
      setTimeout(() => navigate(ADMIN_ROUTES.DASHBOARD), 300);
      return;
    }

    // Nuevo registro → directo a "Arma tu plan mensual" en el Dashboard (Parte 8/11).
    // Ya no existe el modal "¡Bienvenido!" con 3 opciones (7 días gratis / mensual /
    // trimestral). Si el CTA de origen ya dejó un grupo de edad guardado (Parte 8),
    // lo respetamos; si no, solo marcamos que hay que abrir el modal.
    if (isNewReg) {
      // Parte 25: si el registro fue para el programa de Español, el Dashboard
      // debe abrir "Arma tu plan" de español (PlanEspanolModal) en vez del de
      // inglés — la elección del formulario de registro tiene prioridad sobre
      // cualquier flag de grupo de edad que ya hubiera quedado guardado.
      if (program === 'spanish') {
        sessionStorage.setItem(OPEN_PLAN_AFTER_AUTH_KEY, 'spanish');
      } else if (!sessionStorage.getItem(OPEN_PLAN_AFTER_AUTH_KEY)) {
        sessionStorage.setItem(OPEN_PLAN_AFTER_AUTH_KEY, '1');
      }
      setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 300);
      return;
    }

    // Login normal → Dashboard de estudiante
    setTimeout(() => navigate(ROUTE_PATHS.DASHBOARD), 300);
  };

  // Cierre de sesión resiliente. Antes, un signOut() que fallara cortaba la
  // función y dejaba al usuario "dentro" (con la sesión aún guardada, así que
  // recargar tampoco lo sacaba). Ahora: si el signOut global falla se intenta
  // el local, el estado de React se limpia SIEMPRE, y como último recurso se
  // borran a mano las llaves de sesión de Supabase en sessionStorage.
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error('[logout] signOut global falló, intentando local:', e);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e2) {
        console.error('[logout] signOut local también falló, limpiando storage:', e2);
        try {
          Object.keys(window.sessionStorage)
            .filter(k => k.startsWith('sb-') || k.includes('supabase.auth'))
            .forEach(k => window.sessionStorage.removeItem(k));
        } catch (_) { /* storage inaccesible — el estado local igual se limpia abajo */ }
      }
    }
    setIsLoggedIn(false);
    setUserName('');
    setUserId('');
    setUserEmail('');
    navigate(ROUTE_PATHS.HOME);
  };

  const sharedProps = {
    isLoggedIn,
    onOpenAuth: (modal: AuthModal) => setAuthModal(modal),
    onLogout: handleLogout,
    userName,
    userId,
  };

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path={ADMIN_ROUTES.LOGIN} element={<AdminLogin />} />
        <Route path={ADMIN_ROUTES.DASHBOARD} element={<AdminDashboard />} />
        <Route path={ADMIN_ROUTES.COURSES} element={<AdminCourses />} />
        <Route path={ADMIN_ROUTES.STUDENTS} element={<AdminStudents />} />
        <Route path={ADMIN_ROUTES.REVENUE} element={<AdminRevenue />} />
        <Route path={ADMIN_ROUTES.ENGLISH_FOR_STUDENTS} element={<AdminEnglishForStudents />} />
        <Route path={ADMIN_ROUTES.REVIEWS} element={<AdminReviews />} />
        <Route path={ADMIN_ROUTES.MUNDO_REAL} element={<AdminMundoReal />} />
      </Routes>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path={ROUTE_PATHS.HOME}
          element={<Home onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />}
        />
        <Route path={ROUTE_PATHS.LESSONS} element={<Lessons {...sharedProps} />} />
        <Route path={ROUTE_PATHS.LIVE_CLASSES} element={<LiveClasses {...sharedProps} />} />
        <Route path={ROUTE_PATHS.DASHBOARD} element={<Dashboard {...sharedProps} />} />
        <Route path={ROUTE_PATHS.PRICING} element={<Navigate to={ROUTE_PATHS.HOME} replace />} />
        <Route path={ROUTE_PATHS.METHODOLOGY} element={<Navigate to={ROUTE_PATHS.HOME} replace />} />
        {/* Inglés para hispanohablantes: hub con los 3 módulos + una página por
            módulo. '/english' es el enlace antiguo y solo redirige al hub. */}
        <Route path={ROUTE_PATHS.ENGLISH} element={<Navigate to={ROUTE_PATHS.ENGLISH_HUB} replace />} />
        <Route path={ROUTE_PATHS.ENGLISH_HUB} element={<EnglishHub onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />} />
        <Route path={ROUTE_PATHS.ENGLISH_ADULTS} element={<EnglishProgram onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />} />
        {/* Los tres módulos usan la misma página: solo cambian los planes. */}
        <Route path={ROUTE_PATHS.ENGLISH_TEENS} element={<EnglishProgram moduleId="teens" onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />} />
        <Route path={ROUTE_PATHS.ENGLISH_KIDS} element={<EnglishProgram moduleId="kids" onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />} />
        <Route path={ROUTE_PATHS.LEVEL_TEST} element={<LevelTest onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />} />
        <Route path={ROUTE_PATHS.SPANISH} element={<SpanishProgram onOpenAuth={(m) => setAuthModal(m)} isLoggedIn={isLoggedIn} />} />
        <Route path={ROUTE_PATHS.FAQ} element={<FAQ {...sharedProps} />} />
        <Route path={ROUTE_PATHS.TERMS} element={<Terms {...sharedProps} />} />
        <Route path={ROUTE_PATHS.PRIVACY} element={<Privacy {...sharedProps} />} />
        <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTE_PATHS.ENGLISH_MODULE} element={<EnglishModule {...sharedProps} />} />
        <Route path={ROUTE_PATHS.PHONETICS} element={<Phonetics {...sharedProps} />} />
      </Routes>

      <AuthModals
        open={authModal}
        onClose={() => setAuthModal(null)}
        onLogin={(email, name, uid, isAdmin, country, city, isNewReg) => handleLogin(email, name, uid, isAdmin, country, city, isNewReg)}
      />
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;