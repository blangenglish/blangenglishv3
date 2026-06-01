// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Building2, Users, Briefcase, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

/* ═══════════════════════════════════════════════════════
   MODAL 1: Inscribirme como persona
   Crea cuenta Supabase + envía solicitud de plan Empresas
═══════════════════════════════════════════════════════ */
export function EmpresasPersonaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ name: '', email: '', password: '', method: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('form');
    setForm({ name: '', email: '', password: '', method: '' });
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.method) return;
    setLoading(true);
    setError('');
    try {
      // 1. Crear cuenta Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password.trim(),
        options: { data: { full_name: form.name.trim() } },
      });
      if (authError) throw authError;

      // 2. Crear/actualizar student_profile
      const userId = authData?.user?.id;
      if (userId) {
        await supabase.from('student_profiles').upsert({
          id: userId,
          full_name: form.name.trim(),
          account_status: 'pending_payment',
          account_enabled: false,
          is_empresa: true,
          updated_at: new Date().toISOString(),
        });
      }

      // 3. Notificar al admin (best-effort)
      supabase.functions.invoke('send-session-email', {
        body: {
          type: 'empresa_persona',
          studentName: form.name.trim(),
          studentEmail: form.email.trim(),
          plan: 'Inglés para Empresas',
          paymentMethod: form.method,
        },
      }).catch(() => {});

      setStep('success');
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already exists')) {
        setError('Este correo ya está registrado. Inicia sesión en tu perfil.');
      } else if (msg.toLowerCase().includes('password')) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(msg || 'Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-3xl" />
          <div className="p-7">
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── Paso: éxito ── */}
            {step === 'success' && (
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">¡Listo!</h3>
                <p className="text-muted-foreground mb-5 leading-relaxed">
                  Tu cuenta fue creada. Revisa tu correo — te enviaremos el link de pago en máximo{' '}
                  <strong>48 horas hábiles</strong>.
                </p>
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-teal-800 mb-5 text-left">
                  <p className="font-semibold mb-1">📋 Plan solicitado: Inglés para Empresas</p>
                  <p className="text-teal-600">Método de pago: {form.method}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Ya puedes iniciar sesión con tu correo y contraseña. Tu acceso estará{' '}
                  <strong>deshabilitado</strong> hasta que el administrador confirme tu pago.
                </p>
                <Button className="rounded-full px-8 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            )}

            {/* ── Paso: formulario ── */}
            {step === 'form' && (
              <div>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🏢</div>
                  <h2 className="text-2xl font-extrabold mb-1">Inscríbete en Plan Empresas</h2>
                  <p className="text-sm text-muted-foreground">Crea tu cuenta y solicita el plan en un solo paso</p>
                </div>

                {/* Badge del plan */}
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Plan seleccionado</p>
                    <p className="font-extrabold text-teal-900">🏢 Inglés para Empresas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-teal-800">$80 USD</p>
                    <p className="text-xs text-teal-600">/ 3 meses por persona</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-600" /> Nombre completo
                    </Label>
                    <Input
                      placeholder="Tu nombre completo"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Correo */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-600" /> Correo electrónico
                    </Label>
                    <Input
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-600" /> Contraseña (mín. 6 caracteres)
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Método de pago */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">💳 Método de pago preferido</Label>
                    <div className="flex gap-2">
                      {[
                        { id: 'PayPal', label: 'PayPal' },
                        { id: 'Bold (PSE)', label: 'Bold / PSE' },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, method: m.id }))}
                          className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                            form.method === m.id
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'bg-background border-border text-muted-foreground hover:border-teal-400'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {form.method && (
                      <p className="text-xs text-teal-600 font-medium">✅ {form.method} seleccionado</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-6"
                    disabled={
                      loading ||
                      !form.name.trim() ||
                      !form.email.trim() ||
                      !form.password.trim() ||
                      !form.method
                    }
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creando cuenta...
                      </span>
                    ) : (
                      'Crear cuenta y solicitar plan →'
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Tu acceso estará pendiente de activación hasta confirmar el pago con el administrador.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   MODAL 2: Cotizar para mi empresa
   Formulario de contacto — sin crear cuenta
═══════════════════════════════════════════════════════ */
export function EmpresasCotizarModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    cargo: '',
    empleados: '',
    email: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('form');
    setForm({ nombre: '', empresa: '', cargo: '', empleados: '', email: '', mensaje: '' });
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.empresa.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      await supabase.functions.invoke('send-session-email', {
        body: {
          type: 'empresa_cotizacion',
          nombre: form.nombre.trim(),
          empresa: form.empresa.trim(),
          cargo: form.cargo.trim(),
          empleados: form.empleados.trim(),
          email: form.email.trim(),
          mensaje: form.mensaje.trim(),
        },
      }).catch(() => {});
    } finally {
      setLoading(false);
      setStep('success'); // Siempre mostrar éxito
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-3xl" />
          <div className="p-7">
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── Éxito ── */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📬</div>
                <h3 className="text-2xl font-bold mb-2">¡Solicitud recibida!</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Hemos recibido tu solicitud de cotización. Te contactaremos en máximo{' '}
                  <strong>48 horas hábiles</strong> para enviarte la propuesta personalizada.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 mb-6 text-left">
                  <p className="font-semibold">📧 {form.email}</p>
                  <p className="text-blue-600 mt-0.5">🏢 {form.empresa}</p>
                </div>
                <Button className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            )}

            {/* ── Formulario ── */}
            {step === 'form' && (
              <div>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🏢</div>
                  <h2 className="text-2xl font-extrabold mb-1">Cotizar para mi empresa</h2>
                  <p className="text-sm text-muted-foreground">
                    Cuéntanos sobre tu equipo y te enviamos una propuesta personalizada
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" /> Nombre completo *
                    </Label>
                    <Input
                      placeholder="Tu nombre completo"
                      value={form.nombre}
                      onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Empresa */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" /> Nombre de la empresa *
                    </Label>
                    <Input
                      placeholder="Nombre de tu empresa u organización"
                      value={form.empresa}
                      onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Cargo y empleados en grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Cargo
                      </Label>
                      <Input
                        placeholder="Ej: Gerente RR.HH."
                        value={form.cargo}
                        onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> N.° de empleados
                      </Label>
                      <Input
                        placeholder="Ej: 15"
                        type="number"
                        min="1"
                        value={form.empleados}
                        onChange={e => setForm(p => ({ ...p, empleados: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo corporativo *
                    </Label>
                    <Input
                      type="email"
                      placeholder="tu@empresa.com"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Mensaje opcional */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Mensaje (opcional)
                    </Label>
                    <textarea
                      placeholder="¿Algún requerimiento especial, horario preferido, nivel promedio de inglés de tu equipo?"
                      value={form.mensaje}
                      onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <Button
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6"
                    disabled={loading || !form.nombre.trim() || !form.empresa.trim() || !form.email.trim()}
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      'Solicitar cotización →'
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    * Campos obligatorios. Te responderemos en máximo 48 horas hábiles.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
