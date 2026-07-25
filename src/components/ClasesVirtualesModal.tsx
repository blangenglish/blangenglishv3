// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { openWhatsApp } from '@/lib/whatsapp';
import { TermsAcceptBox } from '@/components/TermsAcceptBox';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';

interface ClasesVirtualesModalProps {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
  /** Grupo de edad preseleccionado (ej. desde la tarjeta de la pantalla de bienvenida) */
  defaultAgeGroup?: 'kids' | 'teens' | 'adults';
  /** ID de la cuenta logueada — requerido para mostrar y marcar el descuento de primer mes (Parte 8) */
  userId?: string;
  /** true si esta cuenta todavía no usó el descuento de primer mes */
  discountEligible?: boolean;
  /** Se llama tras enviar la solicitud con el descuento aplicado, para refrescar el perfil */
  onDiscountUsed?: () => void;
}

// Claves invariantes (no dependen del idioma) para que la selección de días
// sobreviva un cambio de idioma en curso — la etiqueta visible sale de t.diasSemana.
const DIA_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

// ── Grupos de edad ────────────────────────────────────────────────────────────
// PENDIENTE POR DEFINIR: si el precio final varía según el grupo de edad, o si
// es el mismo precio base para los 3 y solo cambia el enfoque/contenido del plan
// (como está ahora). No inventar montos distintos hasta que esto se confirme —
// por ahora PRECIOS (abajo) es el mismo para niños, jóvenes y adultos.
const EDAD_EMOJI = { kids: '🧒', teens: '🧑', adults: '🎓' } as const;

// ── Autoaprendizaje (solo Adultos): plan de plataforma sin profesor, sin horario ──
// Mismos precios de siempre del curso (Plan Mensual / Plan Trimestral).
// PENDIENTE POR DEFINIR (Parte 9): cuál de estos dos planes (o de las 4 tarjetas
// del menú principal) es el "Más popular". Hasta que se confirme, ninguna
// tarjeta de plan lleva el badge/borde plateado o dorado de acento — no inventar
// cuál es el destacado.
const AUTOESTUDIO_PRECIOS_BASE = {
  mensual: { cop: 60000, usd: 16 },
  trimestral: { cop: 250000, usd: 68 },
} as const;

// ── Tabla de precios por combinación horas×días (modalidad con profesor) ──────
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
  defaultAgeGroup,
  userId,
  discountEligible = false,
  onDiscountUsed,
}: ClasesVirtualesModalProps) {
  const { lang } = useLanguage();
  const t = translations[lang].modal;
  const EDAD_CONFIG = {
    kids: { emoji: EDAD_EMOJI.kids, ...t.edad.kids },
    teens: { emoji: EDAD_EMOJI.teens, ...t.edad.teens },
    adults: { emoji: EDAD_EMOJI.adults, ...t.edad.adults },
  } as const;
  const AUTOESTUDIO_PRECIOS = {
    mensual: { ...AUTOESTUDIO_PRECIOS_BASE.mensual, ...t.autoestudio.mensual },
    trimestral: { ...AUTOESTUDIO_PRECIOS_BASE.trimestral, ...t.autoestudio.trimestral },
  } as const;
  const DIAS = DIA_KEYS.map((key, i) => ({ key, label: t.diasSemana[i] }));
  const diaLabel = (key: string) => t.diasSemana[DIA_KEYS.indexOf(key as typeof DIA_KEYS[number])];
  const [nombre, setNombre] = useState(defaultName);
  const [correo, setCorreo] = useState(defaultEmail);
  const [edad, setEdad] = useState<'kids' | 'teens' | 'adults'>(defaultAgeGroup || 'adults');
  // Solo aplica cuando edad === 'adults': autoaprendizaje (sin profesor, sin fechas) vs. con profesor (horario fijo).
  const [modoAdulto, setModoAdulto] = useState<'self' | 'teacher'>('teacher');
  const [planAutoestudio, setPlanAutoestudio] = useState<'mensual' | 'trimestral'>('mensual');
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
  // Parte 8: descuento de primer mes, gateado por cuenta (no por sesión/navegador).
  const [discountApplied, setDiscountApplied] = useState(false);
  const showDiscountToggle = !!userId && discountEligible;

  useEffect(() => { setNombre(defaultName); }, [defaultName]);
  useEffect(() => { setCorreo(defaultEmail); }, [defaultEmail]);
  useEffect(() => { setFranja(''); }, [horasDia]);
  useEffect(() => {
    setDiasSel(prev => prev.slice(0, diasSemana));
  }, [diasSemana]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEdad(defaultAgeGroup || 'adults');
      setModoAdulto('teacher');
      setPlanAutoestudio('mensual');
      setHorasDia(1);
      setDiasSemana(2);
      setDiasSel([]);
      setFranja('');
      setPayMethod('bold');
      setIaPlatform('mensual');
      setSent(false);
      setError('');
      setTermsAccepted(false);
      setDiscountApplied(false);
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

  const isAutoestudio = edad === 'adults' && modoAdulto === 'self';

  const canSubmit = isAutoestudio
    ? nombre.trim() && correo.trim() && termsAccepted
    : nombre.trim() && correo.trim() && diasMatch && franja && termsAccepted;

  const precio = PRECIOS[horasDia][diasSemana as 1 | 2 | 3 | 4 | 5];
  const autoestudioPlan = AUTOESTUDIO_PRECIOS[planAutoestudio];
  const iaFee = !isAutoestudio && iaPlatform === 'trimestral' ? SPEAKOLOGY_FEE : 0;
  const precioSinDescuento = isAutoestudio ? autoestudioPlan.cop : precio.final;
  // Primer mes 50% (Parte 8): solo se aplica si el usuario activó el botón,
  // disponible una única vez por cuenta (ver EDAD_CONFIG comment / discountEligible).
  const baseFinal = discountApplied ? Math.round(precioSinDescuento / 2) : precioSinDescuento;
  const totalFinal = baseFinal + iaFee;
  const PSE_SURCHARGE = 10_000;
  const effectiveTotal = payMethod === 'bold' ? totalFinal + PSE_SURCHARGE : totalFinal;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // El mensaje de WhatsApp sigue el idioma de interfaz elegido (reutiliza las
    // mismas traducciones que se muestran en el formulario).
    const metodoLabel = t.whatsapp.metodoLabels[payMethod];
    const unitLabel = t.unitLabel[precio.label];

    const planLines = isAutoestudio
      ? [
          t.whatsapp.planEstudio,
          `• ${t.whatsapp.modalidadAuto}`,
          `• ${t.whatsapp.plan}: ${autoestudioPlan.label}`,
          `• ${t.whatsapp.incluye}: ${autoestudioPlan.incluye}`,
        ]
      : [
          t.whatsapp.planClases,
          `• ${t.whatsapp.modalidadTeacher}`,
          `• ${t.whatsapp.duracionClase}: ${t.horaSuffix(horasDia)}`,
          `• ${t.whatsapp.diasPorSemana}: ${diasSemana}`,
          `• ${t.whatsapp.diasElegidos}: ${diasSel.map(diaLabel).join(', ')}`,
          `• ${t.whatsapp.horarioFijo}: ${franja}`,
        ];

    const iaLines = isAutoestudio
      ? [] // ya incluido en el plan de estudio, no se repite como sección aparte
      : [
          ``,
          t.whatsapp.plataformaIA,
          iaPlatform === 'trimestral'
            ? `• ${t.whatsapp.speakologyLine(formatCOP(SPEAKOLOGY_FEE))}`
            : `• ${t.whatsapp.chatgptLine}`,
        ];

    const mensaje = [
      `📋 *${isAutoestudio ? t.whatsapp.requestTitleInscripcion : t.whatsapp.requestTitleClases}*`,
      ``,
      t.whatsapp.studentData,
      `• ${t.whatsapp.name}: ${nombre.trim()}`,
      `• ${t.whatsapp.email}: ${correo.trim()}`,
      `• ${t.whatsapp.ageGroup}: ${EDAD_CONFIG[edad].emoji} ${EDAD_CONFIG[edad].label}${EDAD_CONFIG[edad].sublabel ? ` (${EDAD_CONFIG[edad].sublabel})` : ''}`,
      ``,
      ...planLines,
      ...iaLines,
      ``,
      t.whatsapp.precio,
      isAutoestudio ? null : `• ${t.whatsapp.clasesAlMes(precio.unidades, unitLabel)}`,
      discountApplied ? `• ${t.whatsapp.discountApplied}` : null,
      `• ${isAutoestudio ? t.whatsapp.precioLabel : t.whatsapp.precioConDescuento}: ${formatCOP(baseFinal)} COP (${formatUSD(baseFinal)})`,
      iaFee > 0 ? `• ${t.whatsapp.activacionSpeakology(formatCOP(iaFee))}` : null,
      payMethod === 'bold' ? `• ${t.whatsapp.recargoBold(formatCOP(PSE_SURCHARGE))}` : null,
      `• ${t.whatsapp.totalAPagar(formatCOP(effectiveTotal), formatUSD(effectiveTotal))}`,
      isAutoestudio ? null : `• ${t.whatsapp.valorPor(unitLabel, formatCOP(precio.valorUnit))}`,
      ``,
      t.whatsapp.metodoPago,
      `• ${metodoLabel}`,
      ``,
      t.whatsapp.termsAccepted,
    ].filter(line => line !== null).join('\n');
    openWhatsApp(mensaje);
    setSent(true);

    // Marca el descuento como usado para esta cuenta — para siempre, sin importar
    // sesión/navegador. Se hace al enviar, no al solo activar el botón.
    if (discountApplied && userId) {
      supabase
        .from('student_profiles')
        .update({ first_month_discount_used: true })
        .eq('id', userId)
        .then(() => onDiscountUsed?.());
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
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 via-purple-700 to-black text-white px-6 py-5 rounded-t-3xl z-10">
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
                {t.title}
              </h3>
              <p className="text-white/80 text-xs mt-0.5">
                {isAutoestudio ? t.subtitleAuto : t.subtitleTeacher}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {sent ? (
            /* ── Éxito ── */
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">{t.success.title}</h4>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {t.success.descPre}<strong>{t.success.descStrong}</strong>{t.success.descPost}
              </p>
              <Button className="rounded-full bg-[#111111] hover:bg-[#111111]/90 text-white px-8 transition-colors" onClick={onClose}>
                {t.success.close}
              </Button>
            </div>
          ) : (
            <>
              {/* ── Nombre ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">{t.nombreLabel}</Label>
                <Input
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder={t.nombrePlaceholder}
                  className="rounded-xl"
                />
              </div>

              {/* ── Correo ── */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">{t.correoLabel}</Label>
                <Input
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder={t.correoPlaceholder}
                  className="rounded-xl"
                />
              </div>

              {/* ── Grupo de edad ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t.edadLabel}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(EDAD_CONFIG) as Array<keyof typeof EDAD_CONFIG>).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEdad(key)}
                      className={`py-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${
                        edad === key
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      <span className="text-base">{EDAD_CONFIG[key].emoji}</span>
                      {EDAD_CONFIG[key].label}
                      {EDAD_CONFIG[key].sublabel && (
                        <span className="text-[10px] font-normal opacity-70">{EDAD_CONFIG[key].sublabel}</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2 leading-relaxed">
                  {EDAD_CONFIG[edad].desc}
                </p>
              </div>

              {/* ── Modalidad (solo Adultos) ── */}
              {edad === 'adults' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t.modalidadLabel}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModoAdulto('self')}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        modoAdulto === 'self'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-bold leading-tight">{t.modalidad.self.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.modalidad.self.desc}</p>
                      {modoAdulto === 'self' && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">{t.selected}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoAdulto('teacher')}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        modoAdulto === 'teacher'
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                      }`}
                    >
                      <p className="text-sm font-bold leading-tight">{t.modalidad.teacher.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.modalidad.teacher.desc}</p>
                      {modoAdulto === 'teacher' && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">{t.selected}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Plan de autoaprendizaje (solo Adultos + "por mi cuenta") ── */}
              {isAutoestudio && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t.planAutoestudioLabel}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(AUTOESTUDIO_PRECIOS) as Array<keyof typeof AUTOESTUDIO_PRECIOS>).map(key => {
                      const p = AUTOESTUDIO_PRECIOS[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPlanAutoestudio(key)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            planAutoestudio === key
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border/50 hover:border-primary/40 hover:bg-muted/30'
                          }`}
                        >
                          <p className="text-sm font-bold leading-tight">{p.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{p.incluye}</p>
                          <p className="text-lg font-extrabold mt-1.5">{formatCOP(p.cop)} COP</p>
                          <p className="text-[10px] text-muted-foreground">≈ ${p.usd} USD / {p.periodo}</p>
                          {planAutoestudio === key && (
                            <span className="inline-block mt-1.5 text-[10px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">{t.selected}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isAutoestudio && (
                <>
                  {/* ── Horas por día ── */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t.horasLabel}</Label>
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
                          {t.horaSuffix(h)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Clases a la semana ── */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t.diasSemanaLabel}</Label>
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
                          {t.diaSuffix(n)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Días de la semana ── */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t.diasLabel}{' '}
                      <span
                        className={`text-xs font-normal ml-1 ${
                          diasMatch ? 'text-primary font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {t.diasHint(diasSel.length, diasSemana)}
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS.map(({ key, label }) => {
                        const sel = diasSel.includes(key);
                        const maxed = !sel && diasSel.length >= diasSemana;
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={maxed}
                            onClick={() => toggleDia(key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                              sel
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : maxed
                                ? 'border-border/25 text-muted-foreground/40 cursor-not-allowed bg-muted/30'
                                : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {diasSel.length > 0 && !diasMatch && (
                      <p className="text-xs text-neutral-800 font-semibold">
                        {t.diasFaltan(diasSemana - diasSel.length)}
                      </p>
                    )}
                  </div>

                  {/* ── Franja horaria ── */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">{t.franjaLabel}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t.franjaHint}
                    </p>
                    <select
                      value={franja}
                      onChange={e => setFranja(e.target.value)}
                      className="w-full border border-border/60 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    >
                      <option value="">{t.franjaPlaceholder}</option>
                      {franjas.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              {/* ── Plataforma de práctica IA (no aplica en autoaprendizaje: ya viene incluida en el plan) ── */}
              {!isAutoestudio && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t.iaPlatformLabel}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIaPlatform('mensual')}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        iaPlatform === 'mensual'
                          ? 'border-primary bg-violet-50 shadow-sm'
                          : 'border-border/50 hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                    >
                      <p className="text-sm font-bold leading-tight">{t.iaMensual.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.iaMensual.desc}</p>
                      {iaPlatform === 'mensual' && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">{t.selected}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIaPlatform('trimestral')}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        iaPlatform === 'trimestral'
                          ? 'border-neutral-800 bg-neutral-100 shadow-sm'
                          : 'border-border/50 hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      <p className="text-sm font-bold leading-tight">{t.iaTrimestral.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.iaTrimestral.desc(formatCOP(SPEAKOLOGY_FEE))}</p>
                      {iaPlatform === 'trimestral' && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold text-white bg-neutral-800 rounded-full px-2 py-0.5">{t.selected}</span>
                      )}
                    </button>
                  </div>
                  {iaPlatform === 'trimestral' && (
                    <p className="text-xs text-neutral-800 bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-2 leading-relaxed">
                      {t.iaTrimestralNote(formatCOP(SPEAKOLOGY_FEE))}
                    </p>
                  )}
                </div>
              )}

              {/* ── Descuento de primer mes (una sola vez por cuenta) ── */}
              {showDiscountToggle && (
                <button
                  type="button"
                  onClick={() => setDiscountApplied(v => !v)}
                  className={`w-full rounded-2xl border-2 p-3 flex items-center justify-between gap-3 text-left transition-all ${
                    discountApplied
                      ? 'border-primary bg-accent shadow-sm'
                      : 'border-dashed border-primary/40 bg-white hover:bg-accent/60'
                  }`}
                >
                  <span>
                    <span className="text-sm font-bold block">
                      🎉 {discountApplied ? t.discountAppliedTitle : t.discountOfferTitle}
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {discountApplied ? t.discountAppliedDesc : t.discountOfferDesc}
                    </span>
                  </span>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    discountApplied ? 'bg-primary text-white' : 'bg-accent text-accent-foreground'
                  }`}>
                    {discountApplied ? t.discountActiveBadge : t.discountActivateCta}
                  </span>
                </button>
              )}

              {/* ── Resumen de precio dinámico ── */}
              {isAutoestudio ? (
                <div key={planAutoestudio} className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
                  <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <p className="text-white text-sm font-bold">{t.resumenTitle}</p>
                    <span className="ml-auto text-violet-200 text-xs font-medium">{autoestudioPlan.label}</span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs text-violet-700 font-semibold mb-0.5">{t.totalAPagar}</p>
                    {discountApplied && (
                      <p className="text-sm text-muted-foreground line-through mb-0.5">{formatCOP(precioSinDescuento)} COP</p>
                    )}
                    {payMethod !== 'paypal' ? (
                      <>
                        <p className="text-3xl font-extrabold text-violet-700 leading-none">
                          {formatCOP(effectiveTotal)}
                          <span className="text-sm font-bold ml-1">COP / {autoestudioPlan.periodo}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatUSD(effectiveTotal)}</p>
                        {payMethod === 'bold' && (
                          <p className="text-[11px] text-neutral-800 font-semibold mt-0.5">{t.surchargeNote(formatCOP(PSE_SURCHARGE))}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-extrabold text-violet-700 leading-none">
                          ${(effectiveTotal / TRM).toFixed(2)}
                          <span className="text-sm font-bold ml-1">USD / {autoestudioPlan.periodo}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatCOP(effectiveTotal)} COP</p>
                      </>
                    )}
                  </div>
                  <div className="px-5 pb-3">
                    <p className="text-[11px] text-muted-foreground">
                      {t.contactNote}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={`${horasDia}-${diasSemana}`} className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
                  {/* Cabecera */}
                  <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <p className="text-white text-sm font-bold">{t.resumenTitle}</p>
                    <span className="ml-auto text-violet-200 text-xs font-medium">
                      {t.unidadesPorMes(precio.unidades, t.unitLabel[precio.label])}
                    </span>
                  </div>

                  {/* Precios */}
                  <div className="px-5 py-4 flex items-end justify-between gap-4">
                    <div>
                      {/* Precio regular tachado */}
                      <p className="text-xs text-muted-foreground mb-0.5">{t.precioRegular}</p>
                      <p className="text-base font-semibold text-muted-foreground line-through">
                        {formatCOP(precio.regular)} COP
                      </p>
                      {/* Desglose incluido */}
                      <p className="text-xs text-violet-500 mt-1">
                        {t.platformFreeNote}
                      </p>
                      {/* Cargo Speakology */}
                      {iaFee > 0 && (
                        <p className="text-xs text-neutral-800 font-semibold mt-1">
                          {t.speakologyChargeNote(formatCOP(iaFee))}
                        </p>
                      )}
                      {/* Precio final */}
                      <p className="text-xs text-violet-700 font-semibold mt-2 mb-0.5">{iaFee > 0 ? t.totalEsteMes : t.precioFinal}</p>
                      {payMethod !== 'paypal' ? (
                        <>
                          <p className="text-3xl font-extrabold text-violet-700 leading-none">
                            {formatCOP(effectiveTotal)}
                            <span className="text-sm font-bold ml-1">COP / mes</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatUSD(effectiveTotal)}</p>
                          {payMethod === 'bold' && (
                            <p className="text-[11px] text-neutral-800 font-semibold mt-0.5">{t.surchargeNote(formatCOP(PSE_SURCHARGE))}</p>
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
                          {t.porUnidad(t.unitLabel[precio.label])}
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
                      {baseFinal < precio.regular && (
                        <p className="text-xs text-primary font-bold mt-1.5">
                          {t.ahorras(formatCOP(precio.regular - baseFinal))}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nota */}
                  <div className="px-5 pb-3">
                    <p className="text-[11px] text-muted-foreground">
                      {t.contactNote}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Selector de método de pago ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t.metodoPagoLabel}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {/* PayPal */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('paypal')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'paypal'
                        ? 'border-violet-300 bg-violet-50 shadow-sm'
                        : 'border-border/50 hover:border-violet-200 hover:bg-violet-50/50'
                    }`}
                  >
                    <p className="text-base mb-0.5">🌐</p>
                    <p className="text-sm font-bold leading-tight">{t.metodos.paypal.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.metodos.paypal.desc}</p>
                    {payMethod === 'paypal' && (
                      <span className="inline-block mt-1.5 text-[10px] font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">{t.selected}</span>
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
                    <p className="text-sm font-bold leading-tight">{t.metodos.bold.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.metodos.bold.desc}</p>
                    <p className="text-[10px] text-neutral-700 font-medium mt-0.5">{t.metodos.bold.note}</p>
                    {payMethod === 'bold' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">{t.selected}</span>
                    )}
                  </button>

                  {/* Bancolombia */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('bancolombia')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'bancolombia'
                        ? 'border-purple-400 bg-purple-50 shadow-sm'
                        : 'border-border/50 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <p className="text-base mb-0.5">🟡</p>
                    <p className="text-sm font-bold leading-tight">{t.metodos.bancolombia.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.metodos.bancolombia.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.metodos.bancolombia.note}</p>
                    {payMethod === 'bancolombia' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-purple-800 bg-purple-100 rounded-full px-2 py-0.5">{t.selected}</span>
                    )}
                  </button>

                  {/* Bre-B */}
                  <button
                    type="button"
                    onClick={() => setPayMethod('breb')}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      payMethod === 'breb'
                        ? 'border-neutral-500 bg-neutral-100 shadow-sm'
                        : 'border-border/50 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="text-base mb-0.5">🔑</p>
                    <p className="text-sm font-bold leading-tight">{t.metodos.breb.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.metodos.breb.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.metodos.breb.note}</p>
                    {payMethod === 'breb' && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-white bg-neutral-800 rounded-full px-2 py-0.5">{t.selected}</span>
                    )}
                  </button>
                </div>
              </div>

              <TermsAcceptBox accepted={termsAccepted} onChange={setTermsAccepted} />

              {/* Botón enviar */}
              <Button
                className="w-full rounded-xl font-bold py-6 bg-[#111111] hover:bg-[#111111]/90 text-white transition-colors disabled:opacity-50"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {t.submit}
                </span>
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
