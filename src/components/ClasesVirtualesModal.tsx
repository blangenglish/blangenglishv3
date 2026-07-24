// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { openWhatsApp } from '@/lib/whatsapp';
import { TermsAcceptBox } from '@/components/TermsAcceptBox';

interface ClasesVirtualesModalProps {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// ── Tabla de precios por combinación horas×días ──────────────────────────────
const PRECIOS = {
  1: {
    1: { regular: 200000,  final: 190000, unidades: 4,  valorUnit: 47500, label: 'clase' },
    2: { regular: 400000,  final: 360000, unidades: 8,  valorUnit: 45000, label: 'clase' },
    3: { regular: 600000,  final: 510000, unidades: 12, valorUnit: 42500, label: 'clase' },
    4: { regular: 800000,  final: 640000, unidades: 16, valorUnit: 40000, label: 'clase' },
    5: { regular: 1000000, final: 750000, unidades: 20, valorUnit: 37500, label: 'clase' },
  },
  2: {
    1: { regular: 384000,  final: 365000,  unidades: 8,  valorUnit: 45625, label: 'hora' },
    2: { regular: 768000,  final: 690000,  unidades: 16, valorUnit: 43125, label: 'hora' },
    3: { regular: 1152000, final: 980000,  unidades: 24, valorUnit: 40833, label: 'hora' },
    4: { regular: 1536000, final: 1230000, unidades: 32, valorUnit: 38437, label: 'hora' },
    5: { regular: 1920000, final: 1440000, unidades: 40, valorUnit: 36000, label: 'hora' },
  },
} as const;

const TRM = 3566.08; // tasa de cambio fija 1 USD = $3,566.08 COP
const SPEAKOLOGY_FEE = 82000; // cargo único trimestral por activar Speakology IA

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

function formatUSD(cop: number) {
  return '≈ $' + (cop / TRM).toFixed(2) + ' USD';
}

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
  const [payMethod, setPayMethod] = useState<'bold' | 'paypal' | 'bancolombia' | 'breb'>('bold');
  const [iaPlatform, setIaPlatform] = useState<'mensual' | 'trimestral'>('mensual');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

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
      setPayMethod('bold');
      setIaPlatform('mensual');
      setSent(false);
      setError('');
      setTermsAccepted(false);
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
    franja &&
    termsAccepted;

  const precio = PRECIOS[horasDia][diasSemana as 1 | 2 | 3 | 4 | 5];
  const iaFee = iaPlatform === 'trimestral' ? SPEAKOLOGY_FEE : 0;
  const totalFinal = precio.final + iaFee;
  const PSE_SURCHARGE = 10_000;
  const effectiveTotal = payMethod === 'bold' ? totalFinal + PSE_SURCHARGE : totalFinal;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const metodoLabel =
      payMethod === 'bold'       ? '💳 Bold / PSE — COP (+$10.000 recargo)' :
      payMethod === 'bancolombia'? '🟡 Transferencia Bancolombia — COP (cta. ahorros)' :
      payMethod === 'breb'       ? '🔑 Bre-B / Llave — COP (cualquier banco colombiano)' :
                                   '🌐 PayPal — USD';
    const mensaje = [
      `📋 *SOLICITUD DE CLASES VIRTUALES — BLANG ENGLISH*`,
      ``,
      `👤 *DATOS DEL ESTUDIANTE*`,
      `• Nombre: ${nombre.trim()}`,
      `• Correo: ${correo.trim()}`,
      ``,
      `📅 *PLAN DE CLASES*`,
      `• Duración por clase: ${horasDia} hora${horasDia === 2 ? 's' : ''}`,
      `• Días por semana: ${diasSemana}`,
      `• Días elegidos: ${diasSel.join(', ')}`,
      `• Horario fijo: ${franja}`,
      ``,
      `🤖 *PLATAFORMA DE PRÁCTICA IA*`,
      iaPlatform === 'trimestral'
        ? `• Speakology IA — cargo único trimestral: ${formatCOP(SPEAKOLOGY_FEE)} COP`
        : `• Uso de ChatGPT — sin costo adicional`,
      ``,
      `💰 *PRECIO*`,
      `• Clases al mes: ${precio.unidades} ${precio.label}s`,
      `• Precio con descuento: ${formatCOP(precio.final)} COP (${formatUSD(precio.final)})`,
      iaFee > 0 ? `• Activación Speakology IA (c/3 meses): ${formatCOP(iaFee)} COP` : null,
      payMethod === 'bold' ? `• Recargo transacción Bold/PSE: +${formatCOP(PSE_SURCHARGE)} COP` : null,
      `• *Total a pagar este mes: ${formatCOP(effectiveTotal)} COP (${formatUSD(effectiveTotal)})*`,
      `• Valor por ${precio.label}: ~${formatCOP(precio.valorUnit)} COP`,
      ``,
      `💳 *MÉTODO DE PAGO*`,
      `• ${metodoLabel}`,
      ``,
      `✅ _El estudiante aceptó los términos y condiciones._`,
    ].filter(line => line !== null).join('\n');
    openWhatsApp(mensaje);
    setSent(true);
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
                Google Meet · Desde $37,500 COP/clase · Horario fijo
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
                Se abrió WhatsApp con tu solicitud. Toca <strong>Enviar</strong> en WhatsApp para completarla.
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
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
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
                      {n} día{n !== 1 ? 's' : ''}
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

              {/* ── Plataforma de práctica IA ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Plataforma de práctica con IA *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIaPlatform('mensual')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      iaPlatform === 'mensual'
                        ? 'border-green-500 bg-green-50 shadow-sm'
                        : 'border-border/50 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <p className="text-sm font-bold leading-tight">Plataforma mensual gratis</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Uso de ChatGPT — sin costo adicional</p>
                    {iaPlatform === 'mensual' && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIaPlatform('trimestral')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      iaPlatform === 'trimestral'
                        ? 'border-amber-500 bg-amber-50 shadow-sm'
                        : 'border-border/50 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    <p className="text-sm font-bold leading-tight">Plataforma trimestral</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Uso de Speakology IA — +{formatCOP(SPEAKOLOGY_FEE)} COP</p>
                    {iaPlatform === 'trimestral' && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                    )}
                  </button>
                </div>
                {iaPlatform === 'trimestral' && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
                    💡 Este pago de {formatCOP(SPEAKOLOGY_FEE)} COP es para activar el plan con <strong>Speakology</strong>, el uso de la plataforma de inteligencia artificial conectada con los módulos de la página para práctica extra. Este valor corresponde a un único pago cada tres meses — el siguiente mes no pagas este valor.
                  </p>
                )}
              </div>

              {/* ── Resumen de precio dinámico ── */}
              <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden">
                {/* Cabecera */}
                <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-base">💰</span>
                  <p className="text-white text-sm font-bold">Resumen de precio estimado</p>
                  <span className="ml-auto text-violet-200 text-xs font-medium">
                    {precio.unidades} {precio.label}s / mes
                  </span>
                </div>

                {/* Precios */}
                <div className="px-5 py-4 flex items-end justify-between gap-4">
                  <div>
                    {/* Precio regular tachado */}
                    <p className="text-xs text-muted-foreground mb-0.5">Precio regular</p>
                    <p className="text-base font-semibold text-muted-foreground line-through">
                      {formatCOP(precio.regular)} COP
                    </p>
                    {/* Desglose incluido */}
                    <p className="text-xs text-violet-500 mt-1">
                      📦 Uso de la plataforma gratis en cualquier plan
                    </p>
                    {/* Cargo Speakology */}
                    {iaFee > 0 && (
                      <p className="text-xs text-amber-600 font-semibold mt-1">
                        🤖 + Activación Speakology IA (única vez / 3 meses): {formatCOP(iaFee)} COP
                      </p>
                    )}
                    {/* Precio final */}
                    <p className="text-xs text-violet-700 font-semibold mt-2 mb-0.5">{iaFee > 0 ? 'Total este mes' : 'Precio final'}</p>
                    {payMethod !== 'paypal' ? (
                      <>
                        <p className="text-3xl font-extrabold text-violet-700 leading-none">
                          {formatCOP(effectiveTotal)}
                          <span className="text-sm font-bold ml-1">COP / mes</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatUSD(effectiveTotal)}</p>
                        {payMethod === 'bold' && (
                          <p className="text-[11px] text-orange-600 font-medium mt-0.5">+{formatCOP(PSE_SURCHARGE)} COP recargo transacción</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-extrabold text-violet-700 leading-none">
                          ${(effectiveTotal / TRM).toFixed(2)}
                          <span className="text-sm font-bold ml-1">USD / mes</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatCOP(effectiveTotal)} COP</p>
                      </>
                    )}
                  </div>

                  {/* Valor por clase/hora */}
                  <div className="text-right shrink-0">
                    <div className="bg-white border border-violet-200 rounded-xl px-3 py-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                        por {precio.label}
                      </p>
                      {payMethod !== 'paypal' ? (
                        <>
                          <p className="text-base font-extrabold text-violet-600">~{formatCOP(precio.valorUnit)}</p>
                          <p className="text-[10px] text-muted-foreground">{formatUSD(precio.valorUnit)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-extrabold text-violet-600">≈ ${(precio.valorUnit / TRM).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">~{formatCOP(precio.valorUnit)} COP</p>
                        </>
                      )}
                    </div>
                    {/* Ahorro */}
                    {precio.final < precio.regular && (
                      <p className="text-xs text-green-600 font-bold mt-1.5">
                        Ahorras {formatCOP(precio.regular - precio.final)} COP 🎉
                      </p>
                    )}
                  </div>
                </div>

                {/* Nota */}
                <div className="px-5 pb-3">
                  <p className="text-[11px] text-muted-foreground">
                    📲 Te contactaremos por WhatsApp para confirmar y coordinar el pago
                  </p>
                </div>
              </div>

              {/* ── Selector de método de pago ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Método de pago *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {/* PayPal */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('paypal')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'paypal'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-border/50 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <p className="text-base mb-0.5">🌐</p>
                    <p className="text-sm font-bold leading-tight">PayPal</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Dólares (USD)</p>
                    {payMethod === 'paypal' && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                    )}
                  </button>

                  {/* Bold / PSE */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('bold')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'bold'
                        ? 'border-violet-500 bg-violet-50 shadow-sm'
                        : 'border-border/50 hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    <p className="text-base mb-0.5">💳</p>
                    <p className="text-sm font-bold leading-tight">Bold / PSE</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Pesos (COP)</p>
                    <p className="text-[10px] text-orange-600 font-medium mt-0.5">+$10.000 recargo transacción</p>
                    {payMethod === 'bold' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                    )}
                  </button>

                  {/* Bancolombia */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('bancolombia')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'bancolombia'
                        ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                        : 'border-border/50 hover:border-yellow-300 hover:bg-yellow-50/50'
                    }`}
                  >
                    <p className="text-base mb-0.5">🟡</p>
                    <p className="text-sm font-bold leading-tight">Bancolombia</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Pesos (COP)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Desde cta. Bancolombia (ahorros)</p>
                    {payMethod === 'bancolombia' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-yellow-800 bg-yellow-100 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                    )}
                  </button>

                  {/* Bre-B */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('breb')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'breb'
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-border/50 hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                  >
                    <p className="text-base mb-0.5">🔑</p>
                    <p className="text-sm font-bold leading-tight">Bre-B / Llave</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Pesos (COP)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Desde cualquier banco colombiano</p>
                    {payMethod === 'breb' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-teal-700 bg-teal-100 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                    )}
                  </button>
                </div>
              </div>

              <TermsAcceptBox accepted={termsAccepted} onChange={setTermsAccepted} />

              {/* Botón enviar */}
              <Button
                className="w-full rounded-xl font-bold py-6 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar por WhatsApp
                </span>
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
