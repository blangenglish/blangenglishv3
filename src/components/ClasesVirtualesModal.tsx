// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface ClasesVirtualesModalProps {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const FRANJAS_1H = [
  '6:00 AM – 7:00 AM',
  '7:00 AM – 8:00 AM',
  '8:00 AM – 9:00 AM',
  '9:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '12:00 PM – 1:00 PM',
  '1:00 PM – 2:00 PM',
  '2:00 PM – 3:00 PM',
  '3:00 PM – 4:00 PM',
  '4:00 PM – 5:00 PM',
  '5:00 PM – 6:00 PM',
  '6:00 PM – 7:00 PM',
  '7:00 PM – 8:00 PM',
];

const FRANJAS_2H = [
  '6:00 AM – 8:00 AM',
  '7:00 AM – 9:00 AM',
  '8:00 AM – 10:00 AM',
  '9:00 AM – 11:00 AM',
  '10:00 AM – 12:00 PM',
  '11:00 AM – 1:00 PM',
  '12:00 PM – 2:00 PM',
  '1:00 PM – 3:00 PM',
  '2:00 PM – 4:00 PM',
  '3:00 PM – 5:00 PM',
  '4:00 PM – 6:00 PM',
  '5:00 PM – 7:00 PM',
  '6:00 PM – 8:00 PM',
];

export function ClasesVirtualesModal({
  open,
  onClose,
  defaultName = '',
  defaultEmail = '',
}: ClasesVirtualesModalProps) {
  const [nombre, setNombre] = useState(defaultName);
  const [correo, setCorreo] = useState(defaultEmail);
  const [horasDia, setHorasDia] = useState<1 | 2>(1);
  const [diasSemana, setDiasSemana] = useState<number>(2);
  const [diasSel, setDiasSel] = useState<string[]>([]);
  const [franja, setFranja] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setNombre(defaultName); }, [defaultName]);
  useEffect(() => { setCorreo(defaultEmail); }, [defaultEmail]);
  useEffect(() => { setFranja(''); }, [horasDia]);
  useEffect(() => {
    setDiasSel(prev => prev.slice(0, diasSemana));
  }, [diasSemana]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setHorasDia(1);
      setDiasSemana(2);
      setDiasSel([]);
      setFranja('');
      setSent(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const franjas = horasDia === 1 ? FRANJAS_1H : FRANJAS_2H;
  const diasMatch = diasSel.length === diasSemana;

  const toggleDia = (dia: string) => {
    if (diasSel.includes(dia)) {
      setDiasSel(diasSel.filter(d => d !== dia));
    } else if (diasSel.length < diasSemana) {
      setDiasSel([...diasSel, dia]);
    }
  };

  const canSubmit =
    nombre.trim() &&
    correo.trim() &&
    diasMatch &&
    franja;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    setError('');
    try {
      await supabase.functions.invoke('send-contact-email', {
        body: {
          type: 'clases_mensuales',
          name: nombre.trim(),
          email: correo.trim(),
          subject: 'Solicitud: Arma tu plan mensual',
          message:
            `📋 SOLICITUD DE CLASES VIRTUALES PERSONALIZADAS MENSUALES\n\n` +
            `Nombre: ${nombre.trim()}\n` +
            `Correo: ${correo.trim()}\n\n` +
            `📅 PLAN DE CLASES\n` +
            `Horas por día: ${horasDia} hora${horasDia === 2 ? 's' : ''}\n` +
            `Clases a la semana: ${diasSemana} día${diasSemana !== 1 ? 's' : ''}\n` +
            `Días seleccionados: ${diasSel.join(', ')}\n` +
            `Franja horaria fija: ${franja}`,
        },
      });
      setSent(true);
    } catch {
      setError('Hubo un error al enviar. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        className="relative bg-background rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white px-6 py-5 rounded-t-3xl z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">
                Arma tu plan mensual
              </h3>
              <p className="text-white/80 text-xs mt-0.5">
                Google Meet · $50,000 COP/sesión · Horario fijo
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {sent ? (
            /* ── Éxito ── */
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold mb-3">¡Listo! 🎉</h4>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Hemos recibido tu solicitud. En breve te enviaremos la cotización a tu correo.
              </p>
              <Button className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-8" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              {/* ── Nombre ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Nombre completo *</Label>
                <Input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="rounded-xl"
                />
              </div>

              {/* ── Correo ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Correo electrónico *</Label>
                <Input
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="rounded-xl"
                />
              </div>

              {/* ── Horas por día ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Horas por día *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([1, 2] as const).map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorasDia(h)}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        horasDia === h
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {h} hora{h === 2 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Clases a la semana ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Clases a la semana *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDiasSemana(n)}
                      className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        diasSemana === n
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {n} días
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Días de la semana ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Días *{' '}
                  <span
                    className={`text-xs font-normal ml-1 ${
                      diasMatch ? 'text-green-600 font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    — selecciona exactamente {diasSemana} ({diasSel.length}/{diasSemana})
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS.map(dia => {
                    const sel = diasSel.includes(dia);
                    const maxed = !sel && diasSel.length >= diasSemana;
                    return (
                      <button
                        key={dia}
                        type="button"
                        disabled={maxed}
                        onClick={() => toggleDia(dia)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          sel
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : maxed
                            ? 'border-border/25 text-muted-foreground/40 cursor-not-allowed bg-muted/30'
                            : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
                {diasSel.length > 0 && !diasMatch && (
                  <p className="text-xs text-amber-600">
                    Selecciona {diasSemana - diasSel.length} día{diasSemana - diasSel.length !== 1 ? 's' : ''} más
                  </p>
                )}
              </div>

              {/* ── Franja horaria ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Franja horaria fija *</Label>
                <p className="text-xs text-muted-foreground">
                  La misma franja aplica para todos los días seleccionados
                </p>
                <select
                  value={franja}
                  onChange={e => setFranja(e.target.value)}
                  className="w-full border border-border/60 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                >
                  <option value="">Selecciona tu franja horaria...</option>
                  {franjas.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              {/* Nota */}
              <p className="text-xs text-muted-foreground text-center">
                📧 Recibirás confirmación y detalles de pago en tu correo
              </p>

              {/* Aviso precio variable */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-800 font-medium text-center">
                  ⚠️ El valor de la hora puede variar según la cantidad de horas y días a la semana que escojas.
                </p>
              </div>

              {/* Botón enviar */}
              <Button
                className="w-full rounded-xl font-bold py-6 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                onClick={handleSubmit}
                disabled={sending || !canSubmit}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando solicitud...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar solicitud
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
