// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { openWhatsApp } from '@/lib/whatsapp';
import { TermsAcceptBox } from '@/components/TermsAcceptBox';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';
import { FRANJAS_1H, FRANJAS_2H } from '@/components/ClasesVirtualesModal';

// ── Parte 17: "Arma tu plan" para Español para Extranjeros ──────────────────
// A diferencia de inglés (ClasesVirtualesModal): sin selector de edad, sin
// modo autoaprendizaje (siempre con profesor), mínimo 2 días/semana (nunca
// "1 día"), precio fijo en USD sin conversión de tipo de cambio, plataforma
// de práctica IA única (Speakology, sin alternativa gratuita) y método de
// pago único (PayPal/USD, sin PSE/Bold/Bancolombia/Bre-B). Nunca aplica el
// descuento de primer mes (Parte 8) — es exclusivo del curso de inglés.

interface PlanEspanolModalProps {
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
  // Parte 25: true cuando el modal se abre desde una cuenta ya registrada
  // (Dashboard, justo tras elegir "Español" en el registro) — cambia el
  // mensaje de éxito para reflejar que la cuenta ya existe y queda pendiente
  // de activación manual, no solo que se envió una solicitud por WhatsApp.
  accountPending?: boolean;
}

const DIA_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

const PRECIO_BASE_HORA_USD = 23.0;
const SPEAKOLOGY_FEE_USD = 22;

// Tabla de precios exacta provista por el negocio (USD, 4 semanas/mes, igual
// supuesto que la tabla de precios de inglés). `final` es el total mensual ya
// con el descuento por volumen incluido; el precio regular (sin descuento) y
// el precio por hora se derivan de acá para no duplicar datos.
const PRECIOS_ESPANOL = {
  1: {
    2: { horasMes: 8, final: 184.0 },
    3: { horasMes: 12, final: 262.2 },
    4: { horasMes: 16, final: 338.56 },
    5: { horasMes: 20, final: 414.0 },
  },
  2: {
    2: { horasMes: 16, final: 356.96 },
    3: { horasMes: 24, final: 507.84 },
    4: { horasMes: 32, final: 662.4 },
    5: { horasMes: 40, final: 809.6 },
  },
} as const;

function formatUSD2(n: number) {
  return '$' + n.toFixed(2);
}

export function PlanEspanolModal({
  open,
  onClose,
  defaultName = '',
  defaultEmail = '',
  accountPending = false,
}: PlanEspanolModalProps) {
  const { lang } = useLanguage();
  const t = translations[lang].modalEspanol;
  const diasSemanaLabels = translations[lang].modal.diasSemana;
  const DIAS = DIA_KEYS.map((key, i) => ({ key, label: diasSemanaLabels[i] }));
  const diaLabel = (key: string) => diasSemanaLabels[DIA_KEYS.indexOf(key as typeof DIA_KEYS[number])];

  const [nombre, setNombre] = useState(defaultName);
  const [correo, setCorreo] = useState(defaultEmail);
  const [horasDia, setHorasDia] = useState<1 | 2>(1);
  const [diasSemana, setDiasSemana] = useState<2 | 3 | 4 | 5>(2);
  const [diasSel, setDiasSel] = useState<string[]>([]);
  const [franja, setFranja] = useState('');
  const [sent, setSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const skipFranjaReset = useRef(true);

  useEffect(() => { setNombre(defaultName); }, [defaultName]);
  useEffect(() => { setCorreo(defaultEmail); }, [defaultEmail]);
  useEffect(() => {
    if (skipFranjaReset.current) { skipFranjaReset.current = false; return; }
    setFranja('');
  }, [horasDia]);
  useEffect(() => {
    setDiasSel(prev => prev.slice(0, diasSemana));
  }, [diasSemana]);

  useEffect(() => {
    if (!open) {
      setHorasDia(1);
      setDiasSemana(2);
      setDiasSel([]);
      setFranja('');
      setSent(false);
      setTermsAccepted(false);
      skipFranjaReset.current = true;
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

  const canSubmit = nombre.trim() && correo.trim() && diasMatch && franja && termsAccepted;

  const precio = PRECIOS_ESPANOL[horasDia][diasSemana];
  const precioRegular = precio.horasMes * PRECIO_BASE_HORA_USD;
  const precioHora = precio.final / precio.horasMes;
  const ahorraMonto = precioRegular - precio.final;
  const totalEsteMes = precio.final + SPEAKOLOGY_FEE_USD;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const mensaje = [
      `📋 *${t.whatsapp.requestTitle}*`,
      ``,
      t.whatsapp.studentData,
      `• ${t.whatsapp.name}: ${nombre.trim()}`,
      `• ${t.whatsapp.email}: ${correo.trim()}`,
      ``,
      t.whatsapp.planClases,
      `• ${t.whatsapp.duracionClase}: ${t.horaSuffix(horasDia)}`,
      `• ${t.whatsapp.diasPorSemana}: ${diasSemana}`,
      `• ${t.whatsapp.diasElegidos}: ${diasSel.map(diaLabel).join(', ')}`,
      `• ${t.whatsapp.horarioFijo}: ${franja}`,
      ``,
      t.whatsapp.plataformaIA,
      `• ${t.whatsapp.speakologyLine(SPEAKOLOGY_FEE_USD.toFixed(2))}`,
      ``,
      t.whatsapp.precio,
      `• ${t.whatsapp.precioBaseLine(PRECIO_BASE_HORA_USD.toFixed(2))}`,
      `• ${t.whatsapp.totalMensualLine(precio.final.toFixed(2))}`,
      `• ${t.whatsapp.activacionSpeakology(SPEAKOLOGY_FEE_USD.toFixed(2))}`,
      `• ${t.whatsapp.totalAPagar(totalEsteMes.toFixed(2))}`,
      ``,
      t.whatsapp.metodoPago,
      `• ${t.whatsapp.metodoPagoLine}`,
      ``,
      t.whatsapp.termsAccepted,
    ].join('\n');
    openWhatsApp(mensaje);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

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
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-12">
            <span className="text-3xl">🇪🇸</span>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">{t.title}</h3>
              <p className="text-white/80 text-xs mt-0.5">{t.subtitle}</p>
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
              <h4 className="text-xl font-bold mb-3">{accountPending ? t.success.accountTitle : t.success.title}</h4>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {accountPending ? t.success.accountDesc : (<>{t.success.descPre}<strong>{t.success.descStrong}</strong>{t.success.descPost}</>)}
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

              {/* ── Clases a la semana (mínimo 2, sin "1 día" — Parte 17) ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t.diasSemanaLabel}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([2, 3, 4, 5] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDiasSemana(n)}
                      className={`py-3 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all whitespace-nowrap ${
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
                <div className="flex flex-wrap gap-2.5">
                  {DIAS.map(({ key, label }) => {
                    const sel = diasSel.includes(key);
                    const maxed = !sel && diasSel.length >= diasSemana;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={maxed}
                        onClick={() => toggleDia(key)}
                        className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold border-2 transition-all ${
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
                <p className="text-xs text-muted-foreground">{t.franjaHint}</p>
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

              {/* ── Plataforma de práctica IA — fija, sin selector (Parte 17: solo Speakology) ── */}
              <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-3">
                <p className="text-sm font-bold text-foreground">🤖 {t.iaPlatformTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.iaPlatformDesc(SPEAKOLOGY_FEE_USD.toFixed(2))}</p>
              </div>

              {/* ── Resumen de precio dinámico ── */}
              <div key={`${horasDia}-${diasSemana}`} className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
                <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-base">💰</span>
                  <p className="text-white text-sm font-bold">{t.resumenTitle}</p>
                  <span className="ml-auto text-violet-200 text-xs font-medium">{t.horasPorMes(precio.horasMes)}</span>
                </div>

                <div className="px-5 py-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t.precioBase}</p>
                    <p className="text-base font-semibold text-muted-foreground line-through">
                      {formatUSD2(precioRegular)} USD
                    </p>
                    <p className="text-xs text-violet-700 font-semibold mt-2 mb-0.5">{t.totalEsteMes}</p>
                    <p className="text-3xl font-extrabold text-violet-700 leading-none">
                      {formatUSD2(totalEsteMes)}
                      <span className="text-sm font-bold ml-1">USD</span>
                    </p>
                    <p className="text-[11px] text-neutral-800 font-semibold mt-1">
                      {t.speakologyChargeNote(SPEAKOLOGY_FEE_USD.toFixed(2))}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="bg-white border border-violet-200 rounded-xl px-3 py-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                        {t.porHora}
                      </p>
                      <p className="text-base font-extrabold text-violet-600">{formatUSD2(precioHora)}</p>
                    </div>
                    {ahorraMonto > 0 && (
                      <p className="text-xs text-primary font-bold mt-1.5">
                        {t.ahorras(ahorraMonto.toFixed(2))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-3">
                  <p className="text-[11px] text-muted-foreground">{t.contactNote}</p>
                </div>
              </div>

              {/* ── Método de pago — fijo, sin selector (Parte 17: solo PayPal/USD) ── */}
              <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-3">
                <p className="text-sm font-bold text-foreground">💳 {t.metodoPagoTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.metodoPagoDesc}</p>
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

export default PlanEspanolModal;
