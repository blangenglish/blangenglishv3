import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ADMIN_ROUTES } from '@/lib/admin';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, AlertCircle, Mail, Lock, KeyRound, Loader2 } from 'lucide-react';

const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'credentials' | 'pin'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Verificar que sea el email admin
      if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
        setError('Acceso no autorizado. Solo el administrador puede ingresar aquí.');
        setLoading(false);
        return;
      }
      // 2. Verificar credenciales
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError('Email o contraseña incorrectos.');
        setLoading(false);
        return;
      }
      // 3. Cerrar sesión temporal y enviar PIN
      await supabase.auth.signOut();
      const { error: fnError } = await supabase.functions.invoke('admin-login-2026', {
        body: { email: email.trim(), password },
      });
      if (fnError) {
        setError('Error al enviar el PIN. Intenta de nuevo.');
        setLoading(false);
        return;
      }
      setInfo(`Se ha enviado un PIN de 6 dígitos a ${ADMIN_EMAIL}. Revisa tu bandeja de entrada.`);
      setStep('pin');
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Verificar PIN
      const { data, error: verifyError } = await supabase.functions.invoke('admin-verify-pin', {
        body: { email: email.trim(), pin: pin.trim() },
      });
      if (verifyError || !data?.success) {
        setError(data?.error || 'PIN incorrecto o expirado. Solicita uno nuevo.');
        setLoading(false);
        return;
      }
      // 2. Hacer sign-in real para establecer sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError('Error al iniciar sesión. Intenta de nuevo.');
        setLoading(false);
        return;
      }
      // 3. Redirigir al dashboard admin
      navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError('Error inesperado al verificar el PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={IMAGES.BLANG_LOGO}
            alt="BLANG English Academy"
            className="h-16 w-auto object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              {step === 'credentials' ? 'Panel Administrador' : 'Verificación PIN'}
            </CardTitle>
            <CardDescription>
              {step === 'credentials'
                ? 'Ingresa con tus credenciales de administrador'
                : 'Ingresa el PIN de 6 dígitos enviado a tu correo'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {info && (
              <Alert className="mb-4 border-green-300 bg-green-50 text-green-800">
                <Mail className="h-4 w-4" />
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleCredentials} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@blangenglish.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                  ) : (
                    <><LogIn className="mr-2 h-4 w-4" /> Continuar</>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN de seguridad</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pin"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      className="pl-9 text-center text-2xl tracking-widest font-mono"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    El PIN expira en 10 minutos
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || pin.length !== 6}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                  ) : (
                    <><KeyRound className="mr-2 h-4 w-4" /> Verificar PIN</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => { setStep('credentials'); setPin(''); setError(''); setInfo(''); }}
                >
                  ← Volver e intentar de nuevo
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 BLANG English Academy — Acceso restringido
        </p>
      </div>
    </div>
  );
}
