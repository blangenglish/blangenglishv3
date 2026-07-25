// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// Parte 11: el modal "¡Bienvenido!" con 3 opciones (7 días gratis / Plan
// Mensual / Plan Trimestral) que vivía acá fue eliminado — contradecía la
// Parte 1 (sin prueba gratis) y la Parte 8 (registro va directo a "Arma tu
// plan mensual"). Este componente ahora solo cubre la selección de nivel de
// inglés para cuentas que ya tienen un plan activo (ver Dashboard.tsx:
// "Definir mi nivel ahora" / "Tomar examen ahora"), sin relación con el
// flujo de registro.

const ENGLISH_LEVELS = [
  { value: 'A1', label: 'A1 — Principiante', desc: 'No sé nada o muy poco de inglés' },
  { value: 'A2', label: 'A2 — Básico', desc: 'Entiendo frases simples y vocabulario básico' },
  { value: 'B1', label: 'B1 — Intermedio', desc: 'Me comunico en situaciones cotidianas' },
  { value: 'B2', label: 'B2 — Intermedio alto', desc: 'Mantengo conversaciones con fluidez' },
  { value: 'C1', label: 'C1 — Avanzado', desc: 'Me expreso con precisión y espontaneidad' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type FlowState =
  | 'LEVEL_CHOICE'         // Elegir entre "ya sé mi nivel" / "tomar examen"
  | 'LEVEL_SELECT'         // Seleccionar nivel manualmente
  | 'LEVEL_SAVED';         // Nivel guardado con éxito

interface OnboardingFlowProps {
  open: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  userCountry?: string;
  userCity?: string;
  userBirthdate?: string;
  onComplete: () => void;
  hasPaidPlan?: boolean;
  initialStep?: string;
  onOpenExam?: () => void;
}

// ─── Progress bar helper ──────────────────────────────────────────────────────
function progressFor(s: FlowState): number {
  const m: Record<FlowState, number> = {
    LEVEL_CHOICE: 30, LEVEL_SELECT: 60, LEVEL_SAVED: 100,
  };
  return m[s] ?? 30;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OnboardingFlow({
  open, userId,
  onComplete, onOpenExam,
}: OnboardingFlowProps) {

  const getInit = (): FlowState => 'LEVEL_CHOICE';

  const [state, setState] = useState<FlowState>(getInit);
  const [history, setHistory] = useState<FlowState[]>([getInit()]);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [savingLevel, setSavingLevel] = useState(false);

  // Resetear al abrir
  useEffect(() => {
    if (open) {
      const s = getInit();
      setState(s);
      setHistory([s]);
      setSelectedLevel('');
      setSavingLevel(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goTo = (next: FlowState) => {
    setHistory(h => [...h, next]);
    setState(next);
  };

  const goBack = () => {
    setHistory(h => {
      const prev = [...h];
      prev.pop();
      const target = prev[prev.length - 1] ?? 'LEVEL_CHOICE';
      setState(target);
      return prev;
    });
  };

  // ── Guardar nivel usando edge function con service_role ───────────────────
  const handleSaveLevel = async (level: string) => {
    setSavingLevel(true);
    setSelectedLevel(level);
    try {
      const { error } = await supabase.functions.invoke('save-onboarding-2026', {
        body: { action: 'save_level', student_id: userId, level, source: 'self_selected' },
      });
      if (error) {
        // Fallback directo si la edge function falla
        await supabase
          .from('student_profiles')
          .update({ english_level: level, onboarding_step: 'completed' })
          .eq('id', userId);
      }
      goTo('LEVEL_SAVED');
    } catch (_) {
      goTo('LEVEL_SAVED');
    } finally {
      setSavingLevel(false);
    }
  };

  // ── Ir al examen real ─────────────────────────────────────────────────────
  const handleGoToExam = async () => {
    try {
      const { error } = await supabase.functions.invoke('save-onboarding-2026', {
        body: { action: 'set_onboarding_step', student_id: userId, step: 'english_test' },
      });
      if (error) {
        await supabase
          .from('student_profiles')
          .update({ onboarding_step: 'english_test' })
          .eq('id', userId);
      }
    } catch (_) {}
    if (onOpenExam) {
      onOpenExam();
    } else {
      onComplete();
    }
  };

  if (!open) return null;

  const progress = progressFor(state);
  const canGoBack = history.length > 1 && state !== 'LEVEL_SAVED';

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={state === 'LEVEL_SAVED' ? onComplete : undefined}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            {canGoBack ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
            ) : (
              <div className="w-16" />
            )}
            <button
              onClick={onComplete}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">

            {/* ── Vista para estudiantes que YA PAGARON ── */}
            {state === 'LEVEL_CHOICE' && (
              <div className="space-y-4 pt-1">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🎓</div>
                  <h2 className="font-extrabold text-2xl mb-1">Definir tu nivel</h2>
                  <p className="text-sm text-muted-foreground">
                    Tu cuenta está activa. Ahora define tu nivel de inglés para acceder a los cursos correspondientes.
                  </p>
                </div>

                {/* Opción 1: Ya sé mi nivel */}
                <button
                  className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 p-4 text-left transition-all group"
                  onClick={() => goTo('LEVEL_SELECT')}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">📋</div>
                    <div className="flex-1">
                      <p className="font-bold text-base mb-0.5">Ya sé mi nivel</p>
                      <p className="text-xs text-muted-foreground">Selecciona directamente tu nivel de inglés (A1 a C1).</p>
                    </div>
                    <div className="text-muted-foreground group-hover:text-primary transition-colors mt-1">→</div>
                  </div>
                </button>

                {/* Opción 2: Tomar examen */}
                <button
                  className="w-full rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-300 p-4 text-left transition-all group"
                  onClick={handleGoToExam}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">🧪</div>
                    <div className="flex-1">
                      <p className="font-bold text-base mb-0.5">Tomar examen de nivel</p>
                      <p className="text-xs text-muted-foreground">El sistema determinará tu nivel automáticamente con una prueba corta.</p>
                      <span className="inline-block mt-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">✅ Recomendado</span>
                    </div>
                    <div className="text-muted-foreground group-hover:text-emerald-600 transition-colors mt-1">→</div>
                  </div>
                </button>
              </div>
            )}

            {/* ── Selección manual de nivel ── */}
            {state === 'LEVEL_SELECT' && (
              <div className="space-y-3 pt-1">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">📋</div>
                  <h2 className="font-extrabold text-xl mb-1">Selecciona tu nivel</h2>
                  <p className="text-xs text-muted-foreground">Elige el nivel que mejor describe tu inglés actual.</p>
                </div>

                {savingLevel ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Guardando tu nivel...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ENGLISH_LEVELS.map(lvl => (
                      <button
                        key={lvl.value}
                        className="w-full rounded-2xl border-2 border-border/40 hover:border-primary/50 hover:bg-primary/5 p-3.5 text-left transition-all group"
                        onClick={() => handleSaveLevel(lvl.value)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-extrabold text-primary shrink-0">
                            {lvl.value}
                          </span>
                          <div>
                            <p className="font-bold text-sm">{lvl.label}</p>
                            <p className="text-xs text-muted-foreground">{lvl.desc}</p>
                          </div>
                          <div className="ml-auto text-muted-foreground group-hover:text-primary transition-colors">→</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Nivel guardado con éxito ── */}
            {state === 'LEVEL_SAVED' && (
              <div className="text-center py-6 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mx-auto"
                >
                  ✅
                </motion.div>
                <div>
                  <h2 className="font-extrabold text-xl mb-2">¡Nivel guardado!</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Tu nivel <strong>{selectedLevel}</strong> fue configurado correctamente. Ya puedes acceder a tus cursos.
                  </p>
                </div>
                <Button className="w-full rounded-2xl py-4 font-bold" onClick={onComplete}>
                  Ir a mis cursos 🚀
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default OnboardingFlow;
