// @ts-nocheck
// ── Cotizador: el formulario que abre el botón "Cotizar" de las tarjetas ─────
//
// SOLO COTIZA. No pide datos personales, no pide método de pago, no manda nada
// por WhatsApp y no inscribe a nadie: el visitante mueve las horas y los días y
// ve cuánto le costaría. Para inscribirse está el botón "Registrarse", que
// sigue el flujo de siempre.
//
// Es un componente aparte de ClasesVirtualesModal (el de la solicitud real) a
// propósito: ese modal pide nombre, correo, días, franja horaria, método de
// pago y aceptación de términos, y mete la solicitud al sistema. Meterle un
// "modo cotización" habría sido tocar el camino del pago para un cambio que es
// solo informativo. Los precios salen de @/lib/precios, los mismos que usa el
// modal de pago, así que las dos pantallas no pueden decir cifras distintas.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';
import {
  PRECIOS,
  SPEAKOLOGY_FEE,
  cotizacionDePlan,
  formatCOP,
  formatUSD,
} from '@/lib/precios';

interface CotizadorModalProps {
  open: boolean;
  onClose: () => void;
  /** Plan que se está cotizando (id de t.planes.items) */
  planId: string;
  /** Título y etiqueta de la tarjeta, para que se vea qué se está cotizando */
  planTitle?: string;
  planTag?: string;
  /** Continuar al registro. Si no se pasa, el botón no aparece. */
  onRegistrarse?: () => void;
}

export function CotizadorModal({
  open,
  onClose,
  planId,
  planTitle,
  planTag,
  onRegistrarse,
}: CotizadorModalProps) {
  const { lang } = useLanguage();
  const t = translations[lang].english.planes.cotizacion;
  const tm = translations[lang].modal; // etiquetas de horas/días ya traducidas

  // Arranca en el plan más pequeño (1 hora, 1 día): así el primer número que
  // ve el visitante es el más bajo y sube desde ahí, no al revés.
  const [horasDia, setHorasDia] = useState<1 | 2>(1);
  const [diasSemana, setDiasSemana] = useState(1);

  if (!open) return null;

  const conProfesor = planId === 'mensual-profesor' || planId === 'mensual-profesor-ninos';
  const precio = conProfesor ? PRECIOS[horasDia][diasSemana] : null;
  const fija = conProfesor ? null : cotizacionDePlan(planId);

  // Ni un plan con profesor ni uno de autoaprendizaje conocido: no se inventa
  // un precio, simplemente no se abre nada.
  if (!conProfesor && !fija) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
            aria-label={t.cerrar}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-12">
            <span className="text-3xl">🧮</span>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">{t.title}</h3>
              <p className="text-white/80 text-xs mt-0.5">
                {planTitle}
                {planTag ? ` · ${planTag}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {conProfesor ? (
            <>
              <p className="text-sm text-muted-foreground leading-snug">{t.ajusta}</p>

              {/* ── Horas por día ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{tm.horasLabel}</Label>
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
                      {tm.horaSuffix(h)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Clases a la semana ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{tm.diasSemanaLabel}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
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
                      {tm.diaSuffix(n)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Resultado ── */}
              <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/60 overflow-hidden">
                <div className="bg-violet-600 px-4 py-2.5">
                  <p className="text-white font-bold text-sm">{tm.resumenTitle}</p>
                </div>
                <div className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{tm.precioRegular}</p>
                    <p className="text-base font-semibold text-muted-foreground line-through">
                      {formatCOP(precio.regular)} COP
                    </p>
                    <p className="text-xs text-violet-700 font-semibold mt-2 mb-0.5">{tm.precioFinal}</p>
                    <p className="text-3xl font-extrabold text-violet-700 leading-none">
                      {formatCOP(precio.final)}
                      <span className="text-sm font-bold ml-1">COP / {t.periodoMes}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatUSD(precio.final)}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {tm.unidadesPorMes(precio.unidades, tm.unitLabel[precio.label])}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="bg-white border border-violet-200 rounded-xl px-3 py-2 shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                        {tm.porUnidad(tm.unitLabel[precio.label])}
                      </p>
                      <p className="text-base font-extrabold text-violet-600">~{formatCOP(precio.valorUnit)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatUSD(precio.valorUnit)}</p>
                    </div>
                    {precio.final < precio.regular && (
                      <p className="text-xs text-primary font-bold mt-1.5">
                        {tm.ahorras(formatCOP(precio.regular - precio.final))}
                      </p>
                    )}
                  </div>
                </div>
                {/* La plataforma va incluida; Speakology es lo único que suma
                    aparte, y solo si el estudiante la elige. Decirlo acá evita
                    que el cobro aparezca de sorpresa más adelante. */}
                <div className="px-4 pb-3 space-y-1">
                  <p className="text-xs text-violet-500">{tm.platformFreeNote}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.speakologyOpcional(formatCOP(SPEAKOLOGY_FEE))}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* ── Autoaprendizaje: precio fijo, no hay nada que elegir ── */
            <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/60 overflow-hidden">
              <div className="bg-violet-600 px-4 py-2.5">
                <p className="text-white font-bold text-sm">{tm.resumenTitle}</p>
              </div>
              <div className="p-4">
                <p className="text-3xl font-extrabold text-violet-700 leading-none">
                  {formatCOP(fija.cop)}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {fija.periodo === 'trimestre' ? t.porTrimestre : t.porMes}
                  {' · ≈ $'}{fija.usd}{' USD'}
                </p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground leading-snug">{t.nota}</p>

          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl py-5 font-bold text-sm border-2"
              onClick={onClose}
            >
              {t.cerrar}
            </Button>
            {onRegistrarse && (
              <Button
                className="flex-1 rounded-xl py-5 font-bold text-sm bg-[#111111] hover:bg-[#111111]/90 text-white gap-1.5"
                onClick={() => {
                  onClose();
                  onRegistrarse();
                }}
              >
                {translations[lang].english.planes.ctaRegistrarse}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
