// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePricingPlans } from '@/hooks/useSupabaseData';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { getAllProgressForStudent, getUnitProgress, hasMigrated, markMigrated, mergeFromRemote } from '@/lib/localProgress';
import { openWhatsApp } from '@/lib/whatsapp';
import { TermsAcceptBox } from '@/components/TermsAcceptBox';
import { supabase } from '@/integrations/supabase/client';
import { UnitViewer } from '@/components/UnitViewer';
import { RenewalAlert } from '@/components/RenewalAlert';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { LevelExam } from '@/components/LevelExam';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  User, Users, CreditCard, HelpCircle, LogOut,
  ChevronRight, BookOpen, Lock, Eye, EyeOff, Check,
  AlertCircle, Flame, Star, Award, ChevronDown, ChevronUp,
  FlaskConical, Calendar, GraduationCap, MapPin,
  Video, Plus, Trash2, Clock, Mail, History, CheckCircle2,
  ExternalLink, Copy, MessageSquare, Sparkles, Globe,
} from 'lucide-react';
import { EnglishForYou } from '@/components/EnglishForYou';
import { ClasesVirtualesModal } from '@/components/ClasesVirtualesModal';
import { MUNDO_REAL_TOPICS, MR_CATEGORIES } from '@/pages/MundoRealData';

interface DashboardProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
  userId?: string;
}

type TabId = 'cursos' | 'cuenta' | 'pagos' | 'progreso' | 'sesion' | 'ayuda' | 'english';

const LEVEL_COLORS: Record<string, { color: string; badge: string }> = {
  A1: { color: 'from-green-400/20 to-emerald-400/20 border-green-200', badge: 'bg-green-100 text-green-700' },
  A2: { color: 'from-teal-400/20 to-cyan-400/20 border-teal-200', badge: 'bg-teal-100 text-teal-700' },
  B1: { color: 'from-blue-400/20 to-indigo-400/20 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  B2: { color: 'from-purple-400/20 to-violet-400/20 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  C1: { color: 'from-amber-400/20 to-yellow-400/20 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
};

const FAQ_QUICK = [
  { q: '¿Cómo cancelo mi suscripción?', a: 'Ve a la pestaña "Pagos" en tu perfil y selecciona "Cancelar suscripción". Tu acceso continuará hasta el final del período pagado.' },
  { q: '¿Puedo cambiar mi correo?', a: 'Por seguridad el correo no se puede cambiar directamente. Escríbenos por WhatsApp al +57 323 640 5246 con tu solicitud.' },
  { q: '¿Cómo reservo una sesión en vivo?', a: 'Desde la sección "Sesión con Profesor" del menú podrás ver los horarios disponibles y reservar. El costo es de $14 USD / $50,000 COP por sesión. Para un plan mensual personalizado escríbenos por WhatsApp al +57 323 640 5246.' },
  { q: '¿Cómo funciona la práctica con IA?', a: 'Al final de cada unidad encontrarás el paso 5 de práctica con IA, donde podrás conversar y escribir con inteligencia artificial para reforzar lo aprendido.' },
  { q: '¿Qué pasa si tengo un problema técnico?', a: 'Escríbenos usando el formulario de la sección de Preguntas Frecuentes o por nuestros canales de WhatsApp e Instagram.' },
];

interface DBCourseRow { id: string; emoji: string; title: string; level: string; total_units: number; is_published: boolean; sort_order: number; description: string; required_level?: string; }
interface DBUnitRow { id: string; course_id: string; title: string; description: string; sort_order: number; is_published: boolean; }

// ── PayPal Hosted Button (oficial SDK) ──
const PAYPAL_CLIENT_ID = 'BAA2srggiH3C_NZOPi5WgvxY9uAmQ5IdL4jsKRt4OdZ_xB6nE1vAWM6800tAFqwddu-eYQBLEEEuXhDNJg';
const PAYPAL_BUTTON_ID  = 'LSDLRPXB2WLJL';

function PayPalHostedButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  useEffect(() => {
    // Unique container id to avoid collisions
    const containerId = `paypal-container-${PAYPAL_BUTTON_ID}`;
    if (containerRef.current) containerRef.current.id = containerId;

    // If SDK already loaded, render immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).paypal?.HostedButtons) {
      renderButton(containerId);
      return;
    }

    // Remove any previous duplicate script
    const existing = document.getElementById('paypal-sdk-script');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id  = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`;
    script.async = true;
    script.onload = () => renderButton(containerId);
    script.onerror = () => setError(true);
    document.body.appendChild(script);

    return () => {
      // Clean up rendered button on unmount
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderButton(containerId: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).paypal.HostedButtons({ hostedButtonId: PAYPAL_BUTTON_ID }).render(`#${containerId}`);
      setLoaded(true);
    } catch {
      setError(true);
    }
  }

  if (error) {
    return (
      <a
        href="https://www.paypal.com/paypalme/blangenglish"
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#003087] hover:bg-[#002070] text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors w-full"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
        Pagar con PayPal
      </a>
    );
  }

  return (
    <div className="w-full">
      {!loaded && (
        <div className="flex items-center justify-center gap-2 bg-[#FFC439]/10 border border-[#FFC439]/40 rounded-xl py-4 text-sm text-[#003087] font-medium">
          <div className="w-4 h-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
          Cargando PayPal...
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

// ── PlanSelector: 2 opciones (nuevo) o solo pago (reactivar) ──
function PlanSelector({ currentUserId, currentEmail, onPlanSaved, onOpenPaypal, mode = 'new' }: {
  currentUserId: string;
  currentEmail: string;
  onPlanSaved: () => void;
  onOpenPaypal: () => void;
  mode?: 'new' | 'reactivate';
}) {
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'full' | null>(null);
  const trialDays = 7;
  const [payMethod, setPayMethod] = useState<'pse' | 'paypal' | 'bancolombia' | 'breb'>('paypal');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'select' | 'pay'>('select');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke('save-onboarding-2026', {
      body: { action: 'save_subscription', student_id: currentUserId, plan: selectedPlan, method: payMethod },
    });
    if (error) {
      // Fallback directo
      const today = new Date();
      const trialEnd = new Date(today); trialEnd.setDate(today.getDate() + 7);
      const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
      const isPaid = selectedPlan === 'full';
      const subData = {
        student_id: currentUserId,
        plan_slug: isPaid ? 'monthly' : 'free_trial',
        plan_name: isPaid ? 'Plan Mensual' : '7 días gratis',
        status: isPaid ? 'pending_approval' : 'trial',
        amount_usd: isPaid ? 15 : 0,
        payment_method: payMethod,
        approved_by_admin: !isPaid,
        account_enabled: !isPaid,
        current_period_end: isPaid ? monthEnd.toISOString() : trialEnd.toISOString(),
        trial_ends_at: !isPaid ? trialEnd.toISOString() : null,
      };
      const { error: e1 } = await supabase.from('subscriptions').insert(subData);
      if (e1) await supabase.from('subscriptions').update(subData).eq('student_id', currentUserId);
    }
    setSaving(false);
    onPlanSaved();
  };

  if (step === 'pay' && selectedPlan === 'full') {
    const amountUsd = 15;
    const planLabel = 'Plan Mensual';
    const waMsg = (metodo: string) => [
      `💳 *SOLICITUD DE PAGO — BLANG ENGLISH*`,
      ``,
      `📋 *PLAN SELECCIONADO*`,
      `• Plan: ${planLabel}`,
      `• Monto: $${amountUsd} USD`,
      ``,
      `💳 *MÉTODO DE PAGO*`,
      `• ${metodo}`,
      ``,
      `✅ _El estudiante aceptó los términos y condiciones._`,
    ].join('\n');
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-primary/20 p-5 bg-background space-y-4">
          <div>
            <button onClick={() => setStep('select')} className="text-xs text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">
              ← Volver
            </button>
            <h3 className="font-extrabold text-lg mb-1">Elige cómo pagar</h3>
            <p className="text-sm text-muted-foreground">{planLabel} — <strong>${amountUsd} USD</strong></p>
          </div>

          <TermsAcceptBox accepted={termsAccepted} onChange={setTermsAccepted} />

          {/* PayPal */}
          <button
            className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-[#003087]/30 bg-[#003087]/5 hover:border-[#003087]/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={saving || !termsAccepted}
            onClick={async () => {
              setSaving(true);
              const { error } = await supabase.functions.invoke('save-onboarding-2026', {
                body: { action: 'save_subscription', student_id: currentUserId, plan: selectedPlan, method: 'paypal' },
              });
              if (error) {
                const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
                const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: planLabel, status: 'pending_approval', amount_usd: amountUsd, payment_method: 'paypal', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
                const { error: e1 } = await supabase.from('subscriptions').insert(d);
                if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
              }
              setSaving(false);
              onPlanSaved();
              onOpenPaypal();
            }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#003087] shrink-0"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
            <div className="text-left">
              <p className="font-bold text-[#003087] text-sm">{saving ? 'Preparando...' : 'Pagar con PayPal 💳'}</p>
              <p className="text-xs text-muted-foreground">Dólares (USD) — activación automática</p>
            </div>
          </button>

          {/* PSE / Bold */}
          <button
            className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-violet-300 bg-violet-50 hover:border-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={saving || !termsAccepted}
            onClick={async () => {
              setSaving(true);
              const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
              const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: planLabel, status: 'pending_approval', amount_usd: amountUsd, payment_method: 'pse', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
              const { error: e1 } = await supabase.from('subscriptions').insert(d);
              if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
              openWhatsApp(waMsg('💳 Bold / PSE — COP (+$10.000 recargo)'));
              setSaving(false);
              onPlanSaved();
            }}
          >
            <span className="text-2xl">💳</span>
            <div className="text-left">
              <p className="font-bold text-violet-700 text-sm">{saving ? 'Preparando...' : 'Bold / PSE'}</p>
              <p className="text-xs text-muted-foreground">Pesos (COP) — +$10.000 recargo transacción</p>
            </div>
          </button>

          {/* Bancolombia */}
          <button
            className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-yellow-300 bg-yellow-50 hover:border-yellow-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={saving || !termsAccepted}
            onClick={async () => {
              setSaving(true);
              const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
              const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: planLabel, status: 'pending_approval', amount_usd: amountUsd, payment_method: 'bancolombia', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
              const { error: e1 } = await supabase.from('subscriptions').insert(d);
              if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
              openWhatsApp(waMsg('🟡 Transferencia Bancolombia — COP (cta. ahorros)'));
              setSaving(false);
              onPlanSaved();
            }}
          >
            <span className="text-2xl">🟡</span>
            <div className="text-left">
              <p className="font-bold text-yellow-900 text-sm">{saving ? 'Preparando...' : 'Transferencia Bancolombia'}</p>
              <p className="text-xs text-muted-foreground">Pesos (COP) — desde cta. Bancolombia (ahorros)</p>
            </div>
          </button>

          {/* Bre-B */}
          <button
            className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-teal-300 bg-teal-50 hover:border-teal-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={saving || !termsAccepted}
            onClick={async () => {
              setSaving(true);
              const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
              const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: planLabel, status: 'pending_approval', amount_usd: amountUsd, payment_method: 'breb', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
              const { error: e1 } = await supabase.from('subscriptions').insert(d);
              if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
              openWhatsApp(waMsg('🔑 Bre-B / Llave — COP (cualquier banco colombiano)'));
              setSaving(false);
              onPlanSaved();
            }}
          >
            <span className="text-2xl">🔑</span>
            <div className="text-left">
              <p className="font-bold text-teal-700 text-sm">{saving ? 'Preparando...' : 'Bre-B / Llave'}</p>
              <p className="text-xs text-muted-foreground">Pesos (COP) — desde cualquier banco colombiano</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Modo reactivar: solo PayPal + PSE, precio normal ──
  if (mode === 'reactivate') {
    const waMsg = (metodo: string) => [
      `💳 *SOLICITUD DE PAGO — BLANG ENGLISH*`,
      ``,
      `📋 *PLAN SELECCIONADO*`,
      `• Plan: Plan Mensual`,
      `• Monto: $16 USD`,
      ``,
      `💳 *MÉTODO DE PAGO*`,
      `• ${metodo}`,
      ``,
      `✅ _El estudiante aceptó los términos y condiciones._`,
    ].join('\n');
    return (
      <div className="rounded-2xl border-2 border-primary/20 p-5 bg-background space-y-4">
        <div>
          <h3 className="font-extrabold text-xl mb-1">Reactivar suscripción 🔄</h3>
          <p className="text-sm text-muted-foreground">Plan Mensual — <strong>$16 USD/mes</strong></p>
        </div>

        <TermsAcceptBox accepted={termsAccepted} onChange={setTermsAccepted} />

        {/* PayPal */}
        <button
          className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-[#003087]/30 bg-[#003087]/5 hover:border-[#003087]/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={saving || !termsAccepted}
          onClick={async () => {
            setSaving(true);
            const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
            const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: 'Plan Mensual', status: 'pending_approval', amount_usd: 15, payment_method: 'paypal', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
            const { error: e1 } = await supabase.from('subscriptions').insert(d);
            if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
            setSaving(false);
            onPlanSaved();
            onOpenPaypal();
          }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#003087] shrink-0"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
          <div className="text-left">
            <p className="font-bold text-[#003087] text-sm">{saving ? 'Preparando...' : 'Pagar con PayPal'}</p>
            <p className="text-xs text-muted-foreground">Dólares (USD)</p>
          </div>
        </button>

        {/* PSE / Bold */}
        <button
          className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-violet-300 bg-violet-50 hover:border-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={saving || !termsAccepted}
          onClick={async () => {
            setSaving(true);
            const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
            const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: 'Plan Mensual', status: 'pending_approval', amount_usd: 15, payment_method: 'pse', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
            const { error: e1 } = await supabase.from('subscriptions').insert(d);
            if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
            openWhatsApp(waMsg('💳 Bold / PSE — COP (+$10.000 recargo)'));
            setSaving(false);
            onPlanSaved();
          }}
        >
          <span className="text-2xl">💳</span>
          <div className="text-left">
            <p className="font-bold text-violet-700 text-sm">{saving ? 'Preparando...' : 'Bold / PSE'}</p>
            <p className="text-xs text-muted-foreground">Pesos (COP) — +$10.000 recargo transacción</p>
          </div>
        </button>

        {/* Bancolombia */}
        <button
          className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-yellow-300 bg-yellow-50 hover:border-yellow-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={saving || !termsAccepted}
          onClick={async () => {
            setSaving(true);
            const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
            const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: 'Plan Mensual', status: 'pending_approval', amount_usd: 15, payment_method: 'bancolombia', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
            const { error: e1 } = await supabase.from('subscriptions').insert(d);
            if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
            openWhatsApp(waMsg('🟡 Transferencia Bancolombia — COP (cta. ahorros)'));
            setSaving(false);
            onPlanSaved();
          }}
        >
          <span className="text-2xl">🟡</span>
          <div className="text-left">
            <p className="font-bold text-yellow-900 text-sm">{saving ? 'Preparando...' : 'Transferencia Bancolombia'}</p>
            <p className="text-xs text-muted-foreground">Pesos (COP) — desde cta. Bancolombia (ahorros)</p>
          </div>
        </button>

        {/* Bre-B */}
        <button
          className="w-full rounded-2xl border-2 p-4 flex items-center gap-3 border-teal-300 bg-teal-50 hover:border-teal-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={saving || !termsAccepted}
          onClick={async () => {
            setSaving(true);
            const today = new Date(); const monthEnd = new Date(today); monthEnd.setMonth(today.getMonth() + 1);
            const d = { student_id: currentUserId, plan_slug: 'monthly', plan_name: 'Plan Mensual', status: 'pending_approval', amount_usd: 15, payment_method: 'breb', approved_by_admin: false, account_enabled: false, current_period_end: monthEnd.toISOString() };
            const { error: e1 } = await supabase.from('subscriptions').insert(d);
            if (e1) await supabase.from('subscriptions').update(d).eq('student_id', currentUserId);
            openWhatsApp(waMsg('🔑 Bre-B / Llave — COP (cualquier banco colombiano)'));
            setSaving(false);
            onPlanSaved();
          }}
        >
          <span className="text-2xl">🔑</span>
          <div className="text-left">
            <p className="font-bold text-teal-700 text-sm">{saving ? 'Preparando...' : 'Bre-B / Llave'}</p>
            <p className="text-xs text-muted-foreground">Pesos (COP) — desde cualquier banco colombiano</p>
          </div>
        </button>
      </div>
    );
  }

  // ── Modo nuevo usuario: 2 opciones ──
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-border/50 p-5 bg-background">
        <h3 className="font-extrabold text-xl mb-1">Elige tu plan 🎓</h3>
        <p className="text-sm text-muted-foreground mb-5">Selecciona una opción para habilitar tus cursos.</p>
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Opción 1: Prueba gratis */}
          <button
            onClick={() => setSelectedPlan('trial')}
            className={`rounded-2xl border-2 p-5 text-left flex flex-col gap-3 transition-all ${
              selectedPlan === 'trial'
                ? 'border-blue-400 bg-blue-50/50 shadow-md'
                : 'border-border/50 hover:border-blue-300 hover:bg-blue-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">🌱</span>
              {selectedPlan === 'trial' && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">✓</span>}
            </div>
            <div>
              <p className="font-extrabold text-base">Prueba Gratis</p>
              <p className="text-xs text-muted-foreground mb-1">{trialDays ?? 7} días</p>
              <p className="text-2xl font-black text-blue-600">$0</p>
            </div>
            <ul className="space-y-1">
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500" /> Cancela cuando quieras</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500" /> Acceso módulo A1</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500" /> Después $16 USD / $60,000 COP/mes</li>
            </ul>
          </button>

          {/* Opción 2: Plan completo */}
          <button
            onClick={() => setSelectedPlan('full')}
            className={`rounded-2xl border-2 p-5 text-left flex flex-col gap-3 transition-all relative ${
              selectedPlan === 'full'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <span className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">⭐ Recomendado</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🚀</span>
              {selectedPlan === 'full' && <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">✓</span>}
            </div>
            <div>
              <p className="font-extrabold text-base">Plan Mensual</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-primary">$16 USD</p>
              </div>
              <p className="text-xs text-muted-foreground">o $60,000 COP / mes</p>
            </div>
            <ul className="space-y-1">
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> Acceso completo a TODOS los cursos</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> A1, A2, B1, B2, C1</li>
              <li className="text-xs text-foreground/70 flex items-center gap-1.5"><Check className="w-3 h-3 text-primary" /> PSE o PayPal</li>
            </ul>
          </button>
        </div>

        {selectedPlan && (
          <div className="mt-5">
            {selectedPlan === 'trial' ? (
              <Button className="w-full rounded-xl py-3 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleConfirmPlan} disabled={saving}>
                {saving ? 'Activando...' : '🌱 Activar prueba gratis →'}
              </Button>
            ) : (
              <Button className="w-full rounded-xl py-3 font-bold"
                onClick={() => setStep('pay')}>
                Continuar con Plan Mensual → $16 USD
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PlanSelectorWithDelete: selector de 2 planes + formulario + eliminar cuenta ──
// Usado en deshabilitado y prueba_finalizada (reemplaza PagoSolicitudForm directo)
function PlanSelectorWithDelete({
  defaultName, defaultEmail, userId,
  trialView, setTrialView,
  trialPlan, setTrialPlan,
  trialDeleteReason, setTrialDeleteReason,
  trialDeleteSent, setTrialDeleteSent,
  trialDeleteSending, setTrialDeleteSending,
  onSuccess,
}: {
  defaultName: string; defaultEmail: string; userId: string;
  trialView: string; setTrialView: (v: any) => void;
  trialPlan: string | null; setTrialPlan: (v: any) => void;
  trialDeleteReason: string; setTrialDeleteReason: (v: string) => void;
  trialDeleteSent: boolean; setTrialDeleteSent: (v: boolean) => void;
  trialDeleteSending: boolean; setTrialDeleteSending: (v: boolean) => void;
  onSuccess: () => void;
}) {
  // Vista: selector de plan (dos tarjetas + formulario)
  if (trialView === 'plan') {
    return (
      <div className="space-y-4">
        <button
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { setTrialView('actions'); setTrialPlan(null); }}
        >
          ← Volver
        </button>

        <div className="grid grid-cols-2 gap-3">
          {/* Plan Mensual */}
          <button
            type="button"
            onClick={() => setTrialPlan('mensual')}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              trialPlan === 'mensual'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <div className="text-2xl mb-2">🚀</div>
            <p className="font-bold text-sm">Plan Mensual</p>
            <p className="text-xl font-extrabold text-primary mt-1">$16 USD</p>
            <p className="text-xs text-muted-foreground">$60,000 COP / mes</p>
            {trialPlan === 'mensual' && (
              <span className="inline-block mt-2 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">✓ Seleccionado</span>
            )}
          </button>

          {/* Plan Trimestral */}
          <button
            type="button"
            onClick={() => setTrialPlan('trimestral')}
            className={`rounded-2xl border-2 p-4 text-left transition-all relative ${
              trialPlan === 'trimestral'
                ? 'border-violet-500 bg-violet-50 shadow-md'
                : 'border-border/50 hover:border-violet-400 hover:bg-violet-50/50'
            }`}
          >
            <span className="absolute top-2 right-2 text-[10px] font-extrabold bg-amber-400 text-black rounded-full px-2 py-0.5">⭐ Mejor valor</span>
            <div className="text-2xl mb-2">💎</div>
            <p className="font-bold text-sm">Plan Trimestral</p>
            <p className="text-xl font-extrabold text-violet-700 mt-1">$68 USD</p>
            <p className="text-xs text-muted-foreground">$250,000 COP / 3 meses</p>
            {trialPlan === 'trimestral' && (
              <span className="inline-block mt-2 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">✓ Seleccionado</span>
            )}
          </button>
        </div>

        {trialPlan && (
          <PagoSolicitudForm
            defaultName={defaultName}
            defaultEmail={defaultEmail}
            userId={userId}
            planSlug={trialPlan === 'mensual' ? 'monthly' : 'trimestral'}
            planName={trialPlan === 'mensual' ? 'Plan Mensual' : 'Plan Trimestral'}
            planPrice={trialPlan === 'mensual' ? '$16 USD / $60,000 COP al mes' : '$68 USD / $250,000 COP por 3 meses'}
            planAmount={trialPlan === 'mensual' ? 16 : 68}
            onSuccess={onSuccess}
          />
        )}
      </div>
    );
  }

  // Vista: formulario eliminar cuenta
  if (trialView === 'delete_request') {
    return (
      <DeleteAccountRequest
        name={defaultName} email={defaultEmail} userId={userId}
        trialView={trialView} setTrialView={setTrialView}
        trialDeleteReason={trialDeleteReason} setTrialDeleteReason={setTrialDeleteReason}
        trialDeleteSent={trialDeleteSent} setTrialDeleteSent={setTrialDeleteSent}
        trialDeleteSending={trialDeleteSending} setTrialDeleteSending={setTrialDeleteSending}
      />
    );
  }

  // Vista por defecto: dos botones de plan + link eliminar
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Elige un plan para continuar</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="rounded-xl py-6 font-bold text-sm bg-primary hover:bg-primary/90 flex-col h-auto gap-1"
          onClick={() => { setTrialView('plan'); setTrialPlan('mensual'); }}
        >
          <span className="text-lg">🚀</span>
          <span>Plan Mensual</span>
          <span className="text-xs font-normal opacity-80">$16 USD / mes</span>
        </Button>
        <Button
          className="rounded-xl py-6 font-bold text-sm bg-violet-600 hover:bg-violet-700 flex-col h-auto gap-1"
          onClick={() => { setTrialView('plan'); setTrialPlan('trimestral'); }}
        >
          <span className="text-lg">💎</span>
          <span>Plan Trimestral</span>
          <span className="text-xs font-normal opacity-80">$68 USD / 3 meses</span>
        </Button>
      </div>
      <div className="text-center pt-1">
        <button
          className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
          onClick={() => { setTrialView('delete_request'); setTrialDeleteSent(false); setTrialDeleteReason(''); }}
        >
          🗑️ Solicitar eliminar cuenta
        </button>
      </div>
    </div>
  );
}

// ── DeleteAccountRequest: link + formulario para solicitar eliminación de cuenta ──
function DeleteAccountRequest({
  name, email, userId,
  trialView, setTrialView,
  trialDeleteReason, setTrialDeleteReason,
  trialDeleteSent, setTrialDeleteSent,
  trialDeleteSending, setTrialDeleteSending,
}: {
  name: string; email: string; userId: string;
  trialView: string; setTrialView: (v: any) => void;
  trialDeleteReason: string; setTrialDeleteReason: (v: string) => void;
  trialDeleteSent: boolean; setTrialDeleteSent: (v: boolean) => void;
  trialDeleteSending: boolean; setTrialDeleteSending: (v: boolean) => void;
}) {
  if (trialView !== 'delete_request') {
    return (
      <div className="text-center pt-1">
        <button
          className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
          onClick={() => { setTrialView('delete_request'); setTrialDeleteSent(false); setTrialDeleteReason(''); }}
        >
          🗑️ Solicitar eliminar cuenta
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border-2 border-border/50 bg-background p-5 space-y-4">
      <button
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setTrialView('actions')}
      >
        ← Volver
      </button>
      {trialDeleteSent ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-bold text-base">Solicitud enviada ✅</p>
          <p className="text-sm text-muted-foreground">
            Recibimos tu solicitud. El administrador procesará la eliminación de tu cuenta en breve y te confirmará por correo.
          </p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="font-bold text-base mb-1">🗑️ Solicitar eliminación de cuenta</h3>
            <p className="text-xs text-muted-foreground">
              Esta acción enviará una solicitud al administrador. Recibirás confirmación por correo cuando tu cuenta sea eliminada.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Motivo (opcional)</Label>
            <textarea
              value={trialDeleteReason}
              onChange={e => setTrialDeleteReason(e.target.value)}
              placeholder="Ej: Ya no me interesa la plataforma, encontré otra opción..."
              rows={3}
              className="w-full rounded-xl border border-border/60 px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">
              ⚠️ Al eliminar tu cuenta se borrarán todos tus datos, progreso e historial de forma permanente.
            </p>
          </div>
          <Button
            variant="destructive"
            className="w-full rounded-xl py-5 font-bold"
            disabled={trialDeleteSending}
            onClick={async () => {
              if (!userId) return;
              setTrialDeleteSending(true);
              try {
                openWhatsApp(
                  `🗑️ SOLICITUD DE ELIMINACIÓN DE CUENTA\n\n` +
                  `Nombre: ${name}\nCorreo: ${email}\nID: ${userId}\n\nMotivo: ${trialDeleteReason || 'No especificado'}`
                );
              } catch { /* non-fatal */ }
              setTrialDeleteSent(true);
              setTrialDeleteSending(false);
            }}
          >
            {trialDeleteSending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando solicitud...
              </span>
            ) : '🗑️ Enviar solicitud de eliminación'}
          </Button>
        </>
      )}
    </div>
  );
}

// ── PagoSolicitudForm: formulario directo para solicitar plan mensual ──
// Usado en: prueba_activa, prueba_finalizada, deshabilitado
function PagoSolicitudForm({
  defaultName,
  defaultEmail,
  userId,
  onSuccess,
  planSlug = 'monthly',
  planName = 'Plan Mensual',
  planPrice = '$16 USD / $60,000 COP al mes',
  planAmount = 16,
}: {
  defaultName: string;
  defaultEmail: string;
  userId: string;
  onSuccess: () => void;
  planSlug?: string;
  planName?: string;
  planPrice?: string;
  planAmount?: number;
}) {
  const [nombre, setNombre] = useState(defaultName);
  const [correo, setCorreo] = useState(defaultEmail);
  const [metodo, setMetodo] = useState<'paypal' | 'bold_pse' | 'bancolombia' | 'breb'>('paypal');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const canSubmit = nombre.trim() && correo.trim() && termsAccepted;

  const metodoLabel =
    metodo === 'paypal'      ? '🌐 PayPal — USD' :
    metodo === 'bancolombia' ? '🟡 Transferencia Bancolombia — COP (cta. ahorros)' :
    metodo === 'breb'        ? '🔑 Bre-B / Llave — COP (cualquier banco colombiano)' :
                               '💳 Bold / PSE — COP (+$10.000 recargo)';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    setFormError('');
    try {
      // 1. Notificar al admin por WhatsApp (non-fatal)
      try {
        const waMsg = [
          `💳 *SOLICITUD DE PAGO — BLANG ENGLISH*`,
          ``,
          `👤 *DATOS DEL ESTUDIANTE*`,
          `• Nombre: ${nombre.trim()}`,
          `• Correo: ${correo.trim()}`,
          ``,
          `📋 *PLAN SELECCIONADO*`,
          `• Plan: ${planName}`,
          `• Precio: ${planPrice}`,
          ``,
          `💳 *MÉTODO DE PAGO*`,
          `• ${metodoLabel}`,
          ``,
          `✅ _El estudiante aceptó los términos y condiciones._`,
        ].join('\n');
        openWhatsApp(waMsg);
      } catch (_) { /* non-fatal */ }

      // 2. Actualizar estado en BD
      if (userId) {
        await supabase.from('student_profiles').update({
          trial_active: false,
          account_status: 'pending_payment',
          updated_at: new Date().toISOString(),
        }).eq('id', userId);

        const { error: subUpErr } = await supabase.from('subscriptions').update({
          trial_active: false,
          status: 'pending_approval',
          account_enabled: false,
          payment_method: metodo,
          updated_at: new Date().toISOString(),
        }).eq('student_id', userId);

        // Si no había suscripción previa, insertar una nueva
        if (subUpErr) {
          const periodEnd = new Date();
          if (planSlug === 'trimestral') periodEnd.setMonth(periodEnd.getMonth() + 3);
          else periodEnd.setMonth(periodEnd.getMonth() + 1);
          await supabase.from('subscriptions').insert({
            student_id: userId,
            plan_slug: planSlug,
            plan_name: planName,
            status: 'pending_approval',
            amount_usd: planAmount,
            payment_method: metodo,
            approved_by_admin: false,
            account_enabled: false,
            current_period_end: periodEnd.toISOString(),
          });
        }
      }

      setSent(true);
      onSuccess();
    } catch (_err) {
      setFormError('Hubo un error al enviar. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-green-50 border-2 border-green-300 p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-extrabold text-lg">¡Solicitud enviada! 🎉</h3>
        <p className="text-sm text-muted-foreground">
          Activaremos tu cuenta en máximo 48 horas hábiles. Recibirás confirmación en <strong>{correo}</strong>.
        </p>
        <p className="text-xs text-muted-foreground">
          ¿Dudas?{' '}
          <a href="https://wa.me/573236405246" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
            +57 323 640 5246 (WhatsApp)
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-background p-5 space-y-4">
      <div>
        <h3 className="font-extrabold text-base mb-0.5">💳 Adquirir {planName}</h3>
        <p className="text-sm text-muted-foreground">{planPrice} · Acceso completo a todos los cursos</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Nombre completo *</Label>
        <Input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Tu nombre completo"
          className="rounded-xl"
        />
      </div>

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

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Método de pago *</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMetodo('paypal')}
            className={`py-3 px-2 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${metodo === 'paypal' ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm' : 'border-border/50 text-muted-foreground hover:border-blue-300 hover:text-foreground'}`}
          >
            <span>🌐 PayPal</span>
            <span className="text-[10px] font-normal opacity-70">USD</span>
          </button>
          <button
            type="button"
            onClick={() => setMetodo('bold_pse')}
            className={`py-3 px-2 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${metodo === 'bold_pse' ? 'border-violet-500 bg-violet-50 text-violet-800 shadow-sm' : 'border-border/50 text-muted-foreground hover:border-violet-300 hover:text-foreground'}`}
          >
            <span>💳 Bold / PSE</span>
            <span className="text-[10px] font-normal opacity-70">COP +$10.000</span>
          </button>
          <button
            type="button"
            onClick={() => setMetodo('bancolombia')}
            className={`py-3 px-2 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${metodo === 'bancolombia' ? 'border-yellow-400 bg-yellow-50 text-yellow-900 shadow-sm' : 'border-border/50 text-muted-foreground hover:border-yellow-300 hover:text-foreground'}`}
          >
            <span>🟡 Bancolombia</span>
            <span className="text-[10px] font-normal opacity-70">COP (ahorros)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetodo('breb')}
            className={`py-3 px-2 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${metodo === 'breb' ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm' : 'border-border/50 text-muted-foreground hover:border-teal-300 hover:text-foreground'}`}
          >
            <span>🔑 Bre-B / Llave</span>
            <span className="text-[10px] font-normal opacity-70">COP</span>
          </button>
        </div>
      </div>

      <TermsAcceptBox accepted={termsAccepted} onChange={setTermsAccepted} />

      <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
        Al enviar, el administrador verificará el pago y activará tu cuenta en máximo 48 horas hábiles. Escríbenos por{' '}
        <a href="https://wa.me/573236405246" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
          WhatsApp +57 323 640 5246
        </a>{' '}con cualquier duda.
      </div>

      {formError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{formError}</p>
      )}

      <Button
        className="w-full rounded-xl py-5 font-bold"
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
            <Mail className="w-4 h-4" />
            Enviar solicitud de pago
          </span>
        )}
      </Button>
    </div>
  );
}

// ── PlanPickerInline: 3 opciones de plan para primer_registro (sin modal) ──
function PlanPickerInline({
  defaultName,
  defaultEmail,
  userId,
  onSuccess,
}: {
  defaultName: string;
  defaultEmail: string;
  userId: string;
  onSuccess: () => void;
}) {
  type PlanChoice = 'trial' | 'mensual' | 'trimestral';
  const [selected, setSelected] = useState<PlanChoice | null>(null);
  const [nombre, setNombre] = useState(defaultName);
  const [correo, setCorreo] = useState(defaultEmail);
  const [metodo, setMetodo] = useState<'paypal' | 'bold_pse' | 'bancolombia'>('paypal');
  const [trialMsg, setTrialMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  const canSubmit = nombre.trim() && correo.trim();

  const PLAN_INFO = {
    trial:      { slug: 'free_trial',  name: '7 días gratis',  amount: 0,  period: 0 },
    mensual:    { slug: 'monthly',     name: 'Plan Mensual',    amount: 15, period: 1 },
    trimestral: { slug: 'trimestral',  name: 'Plan Trimestral', amount: 68, period: 3 },
  };

  const handleSubmit = async () => {
    if (!selected || !canSubmit) return;
    setSending(true);
    setFormError('');
    const info = PLAN_INFO[selected];
    const isTrial = selected === 'trial';
    const methodLabel = metodo === 'paypal' ? 'PayPal (USD)' : metodo === 'bancolombia' ? 'Transferencia Bancolombia (COP)' : 'Bold / PSE (COP)';

    try {
      // 1. Notificar al admin por WhatsApp (non-fatal)
      try {
        const msg = isTrial
          ? `📋 SOLICITUD DE PRUEBA GRATUITA — BLANG ENGLISH\n\nNombre: ${nombre.trim()}\nCorreo: ${correo.trim()}${trialMsg ? '\nMensaje: ' + trialMsg : ''}`
          : `💳 SOLICITUD DE PAGO — BLANG ENGLISH\n\nPlan: ${info.name}\nNombre: ${nombre.trim()}\nCorreo: ${correo.trim()}\nMétodo de pago: ${methodLabel}\nMonto: $${info.amount} USD`;
        openWhatsApp(msg);
      } catch (_) { /* non-fatal */ }

      // 2. Actualizar BD
      if (userId) {
        await supabase.from('student_profiles').update({
          account_status: 'pending_payment',
          updated_at: new Date().toISOString(),
        }).eq('id', userId);

        if (isTrial) {
          // Guardar en trial_requests
          try {
            await supabase.from('trial_requests').insert({
              student_id: userId,
              student_name: nombre.trim(),
              student_email: correo.trim(),
              message: trialMsg || '',
              request_type: 'trial_7days',
              status: 'pending',
            });
          } catch (_) { /* non-fatal */ }
        } else {
          // Upsert subscriptions
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + info.period);
          const subData = {
            student_id: userId,
            plan_slug: info.slug,
            plan_name: info.name,
            status: 'pending_approval',
            amount_usd: info.amount,
            payment_method: metodo,
            approved_by_admin: false,
            account_enabled: false,
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error: upErr } = await supabase.from('subscriptions')
            .update(subData).eq('student_id', userId);
          if (upErr) {
            await supabase.from('subscriptions').insert(subData);
          }
        }
      }

      setSent(true);
      onSuccess();
    } catch (_err) {
      setFormError('Hubo un error al enviar. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  // ── Éxito ──
  if (sent) {
    const isTrial = selected === 'trial';
    return (
      <div className="rounded-2xl bg-green-50 border-2 border-green-300 p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-extrabold text-lg">¡Listo! 🎉</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {isTrial
            ? 'Tu solicitud fue recibida. El equipo BLANG te contactará en máximo 48 horas hábiles para activar tu prueba.'
            : 'Revisa tu correo — te enviaremos el link de pago para completar tu inscripción. Tu acceso se activa en máximo 24 horas hábiles tras confirmar el pago.'}
        </p>
        <p className="text-xs text-muted-foreground">
          ¿Dudas?{' '}
          <a href="https://wa.me/573236405246" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
            +57 323 640 5246 (WhatsApp)
          </a>
        </p>
      </div>
    );
  }

  // ── Formulario del plan seleccionado ──
  if (selected) {
    const isTrial = selected === 'trial';
    const info = PLAN_INFO[selected];
    return (
      <div className="rounded-2xl border-2 border-primary/20 bg-background p-5 space-y-4">
        {/* Volver */}
        <button
          type="button"
          onClick={() => { setSelected(null); setFormError(''); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver a opciones
        </button>

        {/* Header */}
        <div>
          <h3 className="font-extrabold text-base mb-0.5">
            {isTrial ? '🎁 Solicitar 7 días gratis' : selected === 'mensual' ? '📅 Plan Mensual' : '💎 Plan Trimestral'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isTrial
              ? 'Sin pago — el equipo BLANG activará tu prueba manualmente'
              : selected === 'mensual'
                ? '$16 USD / $60,000 COP al mes · Acceso completo'
                : '$68 USD / $250,000 COP por 3 meses · Acceso completo'}
          </p>
        </div>

        {/* Nombre */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Nombre completo *</Label>
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" className="rounded-xl" />
        </div>

        {/* Correo */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Correo electrónico *</Label>
          <Input type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="tucorreo@ejemplo.com" className="rounded-xl" />
        </div>

        {/* Método de pago (solo planes de pago) */}
        {!isTrial && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">¿Cómo prefieres pagar?</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'paypal', label: '💳 PayPal', sub: 'Dólares (USD)' },
                { id: 'bold_pse', label: '🏦 PSE / Bold', sub: 'Pesos (COP)' },
                { id: 'bancolombia', label: '🟡 Bancolombia', sub: 'Pesos (COP)' },
              ] as const).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodo(m.id)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${
                    metodo === m.id
                      ? m.id === 'bancolombia'
                        ? 'border-yellow-400 bg-yellow-50 text-yellow-900 shadow-sm'
                        : 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border/50 text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span>{m.label}</span>
                  <span className="text-[10px] font-normal opacity-70">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje opcional (solo trial) */}
        {isTrial && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Mensaje (opcional)</Label>
            <textarea
              value={trialMsg}
              onChange={e => setTrialMsg(e.target.value)}
              placeholder="¿Por qué quieres aprender inglés con BLANG?"
              rows={3}
              className="w-full border border-border/60 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>
        )}

        {/* Nota */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          {isTrial
            ? 'ℹ️ El equipo BLANG revisará tu solicitud y te contactará en máximo 48 horas hábiles.'
            : '📧 Al confirmar, te enviaremos el link de pago a tu correo. Tu acceso se activa en máximo 24 horas hábiles tras confirmar el pago.'}
        </div>

        {formError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{formError}</p>
        )}

        {/* Botón */}
        <Button
          className="w-full rounded-xl py-5 font-bold"
          onClick={handleSubmit}
          disabled={sending || !canSubmit}
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {isTrial ? 'Enviar solicitud' : 'Confirmar solicitud'}
            </span>
          )}
        </Button>
      </div>
    );
  }

  // ── Vista inicial: 3 tarjetas de plan ──
  return (
    <div className="space-y-3">
      {/* 7 días gratis */}
      <button
        type="button"
        onClick={() => setSelected('trial')}
        className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 p-4 text-left transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">🎁</div>
          <div className="flex-1">
            <p className="font-bold text-base mb-0.5">Solicitar 7 días gratis</p>
            <p className="text-xs text-muted-foreground">Sin pago. El equipo BLANG revisará tu solicitud y te contactará.</p>
            <span className="inline-block mt-1.5 text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">✉️ Activación manual</span>
          </div>
          <div className="text-muted-foreground group-hover:text-primary transition-colors mt-1">→</div>
        </div>
      </button>

      {/* Plan Mensual */}
      <button
        type="button"
        onClick={() => setSelected('mensual')}
        className="w-full rounded-2xl border-2 border-green-200 bg-green-50/60 hover:bg-green-50 hover:border-green-300 p-4 text-left transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">📅</div>
          <div className="flex-1">
            <p className="font-bold text-base mb-0.5">Plan Mensual</p>
            <p className="text-xs text-muted-foreground">$16 USD / $60,000 COP al mes. Acceso completo a todos los cursos.</p>
            <span className="inline-block mt-1.5 text-xs font-bold text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">⏱ Activación en máx. 24 h hábiles</span>
          </div>
          <div className="text-muted-foreground group-hover:text-green-600 transition-colors mt-1">→</div>
        </div>
      </button>

      {/* Plan Trimestral */}
      <button
        type="button"
        onClick={() => setSelected('trimestral')}
        className="w-full rounded-2xl border-2 border-violet-200 bg-violet-50/60 hover:bg-violet-50 hover:border-violet-300 p-4 text-left transition-all group relative overflow-hidden"
      >
        <div className="absolute top-3 right-3">
          <span className="bg-amber-400 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">⭐ Mejor valor</span>
        </div>
        <div className="flex items-start gap-3 pr-20">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl shrink-0">💎</div>
          <div className="flex-1">
            <p className="font-bold text-base mb-0.5">Plan Trimestral</p>
            <p className="text-xs text-muted-foreground">$68 USD / $250,000 COP por 3 meses. ¡Ahorra frente al mensual!</p>
            <span className="inline-block mt-1.5 text-xs font-bold text-violet-700 bg-violet-100 rounded-full px-2.5 py-0.5">⏱ Activación en máx. 24 h hábiles</span>
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-violet-600 transition-colors">→</div>
      </button>
    </div>
  );
}

// ── TrialPaymentActiveBlock: pantalla de pagos DURANTE el período de prueba ──
// SOLO muestra: mensaje bienvenida + fecha vencimiento + 2 botones exactos
// ⚠️ NUNCA muestra planes adicionales, precios ni más opciones aquí
function TrialPaymentActiveBlock({
  fmt, trialEnd, regDate, onCancelTrial, onWantPay
}: {
  fmt: (d: Date | null) => string;
  trialEnd: Date;
  regDate: Date;
  payConfig: Record<string, string>;
  onCancelTrial: () => void;
  onWantPay: () => void;
}) {
  return (
    <div className="space-y-4">

      {/* ── Mensaje de bienvenida con fecha dinámica ── */}
      <div className="rounded-2xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50/60 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl shrink-0">🌱</div>
          <div className="flex-1">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-green-100 text-green-700 border border-green-200">
              ✅ Prueba activa
            </span>
            <h2 className="font-extrabold text-lg leading-snug mb-2">
              Bienvenido/a a este plan de 7 días gratis, tienes hasta el{' '}
              <span className="text-green-700 underline decoration-dotted">{fmt(trialEnd)}</span>.
            </h2>
            <p className="text-xs text-muted-foreground">Acceso al nivel A1 · Primeros 5 módulos desbloqueados</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
            <p className="text-xs text-muted-foreground mb-0.5">📅 Activación</p>
            <p className="font-bold text-sm">{fmt(regDate)}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
            <p className="text-xs text-muted-foreground mb-0.5">⏰ Vencimiento</p>
            <p className="font-bold text-sm text-green-700">{fmt(trialEnd)}</p>
          </div>
        </div>
      </div>

      {/* ── SOLO estos 2 botones — regla estricta, no agregar más ── */}
      <div className="rounded-2xl border-2 border-border/50 bg-background p-5 space-y-3">
        {/* Botón 1: pagar plan mensual */}
        <Button
          className="w-full rounded-xl py-5 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onWantPay}
        >
          💳 Terminar 7 días gratis, pagar plan mensual
        </Button>
        {/* Botón 2: cancelar suscripción */}
        <Button
          variant="outline"
          className="w-full rounded-xl py-5 font-medium text-sm text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={onCancelTrial}
        >
          🚪 Cancelar suscripción
        </Button>
      </div>

    </div>
  );
}

// ── TrialPaymentBlock: selector de planes con métodos de pago ──
// SOLO se muestra cuando: prueba_finalizada | deshabilitado
// NUNCA se muestra a: estudiantes nuevos | prueba_activa | pendiente_pago
function TrialPaymentBlock({
  fmtDate, trialEnd, onSelectPlan, payConfig, mode
}: {
  fmtDate: (d: Date | null) => string;
  trialEnd: Date;
  onSelectPlan: (amount: number, planLabel: string) => void;
  payConfig: Record<string, string>;
  mode?: 'trial' | 'reactivate' | 'pending' | 'trial_expired' | 'primer_registro';
}) {
  const [activeMethod, setActiveMethod] = useState<'paypal'|'pse'>('paypal');
  const [selectedPlan, setSelectedPlan] = useState<'full'>('full');
  const [copied, setCopied] = useState(false);
  const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';
  const pseBankName = payConfig['pse_bank_name'] || '';
  const pseAccountType = payConfig['pse_account_type'] || 'Ahorros';
  const pseAccountNumber = payConfig['pse_account_number'] || '';
  const pseOwnerName = payConfig['pse_owner_name'] || '';
  const paypalLink = payConfig['paypal_link'] || 'https://paypal.me/blangenglish';
  const amount = 15;

  const copyEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Aviso según modo */}
      {/* modo 'trial': solo si se pasa explícitamente (no se usa actualmente) */}
      {mode === 'trial' && (
        <div className="rounded-2xl bg-blue-50 border-2 border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🌱</span>
            <p className="font-bold text-blue-900">Prueba gratis activa — acceso módulo A1</p>
          </div>
          <p className="text-sm text-blue-800">
            Tu prueba termina el <strong>{fmtDate(trialEnd)}</strong>. Al vencer, tu cuenta quedará <strong>deshabilitada automáticamente</strong>. Para continuar con todos los cursos (A2–C1) elige un plan abajo.
          </p>
        </div>
      )}
      {mode === 'reactivate' && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🔒</span>
            <p className="font-bold text-red-900">Tu cuenta está deshabilitada</p>
          </div>
          <p className="text-sm text-red-800">
            Elige un plan, realiza el pago y envía el comprobante al administrador para reactivar tu cuenta.
          </p>
        </div>
      )}
      {mode === 'trial_expired' && (
        <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⌛</span>
            <p className="font-bold text-orange-900">Tu período de prueba ha terminado</p>
          </div>
          <p className="text-sm text-orange-800">
            Tu prueba gratuita venció el <strong>{fmtDate(trialEnd)}</strong>. Para continuar con todos los cursos (A2–C1), elige un plan:
          </p>
        </div>
      )}
      {mode === 'primer_registro' && (
        <div className="rounded-2xl bg-primary/5 border-2 border-primary/20 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <p className="font-bold text-foreground">Elige tu plan para comenzar</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona el plan que más te convenga, realiza el pago y envía el comprobante. Tu cuenta se activará en máximo 48 horas hábiles.
          </p>
        </div>
      )}
      {mode === 'pending' && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏳</span>
            <p className="font-bold text-amber-900">Completa tu pago para activar la cuenta</p>
          </div>
          <p className="text-sm text-amber-800">
            Tu solicitud fue registrada. Elige el plan que deseas pagar y envía el comprobante al administrador.
          </p>
        </div>
      )}

      {/* Plan único */}
      <div className="rounded-2xl p-4 text-left border-2 border-primary bg-primary/5 shadow-md">
        <p className="font-extrabold text-sm">Plan Mensual</p>
        <p className="text-xl font-black text-primary">$16 <span className="text-xs font-normal text-muted-foreground">USD / mes</span></p>
        <p className="text-sm text-muted-foreground">o $60,000 COP al mes</p>
      </div>

      {/* Selector de método de pago */}
      <div className="rounded-2xl border-2 border-border/50 overflow-hidden">
        <div className="bg-muted/30 px-5 py-3 flex items-center gap-2 border-b border-border/40">
          <CreditCard className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Método de pago — <span className="text-primary">${amount} USD</span></span>
        </div>
        <div className="p-4 space-y-4">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveMethod('paypal')}
              className={`rounded-xl py-2.5 text-sm font-bold transition-all border-2 ${
                activeMethod === 'paypal' ? 'border-[#003087] bg-[#003087]/5 text-[#003087]' : 'border-border/40 text-muted-foreground hover:border-[#003087]/30'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 inline mr-1.5 fill-current"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
              PayPal
            </button>
            <button
              onClick={() => setActiveMethod('pse')}
              className={`rounded-xl py-2.5 text-sm font-bold transition-all border-2 ${
                activeMethod === 'pse' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border/40 text-muted-foreground hover:border-emerald-400'
              }`}
            >
              🏦 PSE / Transferencia
            </button>
          </div>

          {/* PayPal instructions */}
          {activeMethod === 'paypal' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-800">Instrucciones de pago — PayPal</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Accede a tu cuenta de PayPal</li>
                <li>Envía <strong>${amount} USD</strong> a la cuenta BLANG</li>
                <li>En el concepto escribe: <strong>tu nombre + correo de registro</strong></li>
                <li>Envía el comprobante al correo del administrador</li>
              </ol>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-100">
                <span className="text-xs font-mono text-foreground flex-1 truncate">{ADMIN_EMAIL}</span>
                <button onClick={copyEmail} className="text-primary shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a href={paypalLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold">
                <ExternalLink className="w-3 h-3" /> Ir a PayPal para pagar →
              </a>
              <Button
                className="w-full rounded-xl bg-[#003087] hover:bg-[#002070] text-white font-bold gap-2"
                onClick={() => onSelectPlan(amount, 'Plan Mensual')}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
                Ya realicé el pago de ${amount} USD con PayPal
              </Button>
              <p className="text-xs text-amber-700">⏱ Tu cuenta se activará en máximo 48h hábiles al confirmar el pago.</p>
            </div>
          )}

          {/* PSE instructions */}
          {activeMethod === 'pse' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-800">Instrucciones de pago — PSE / Transferencia bancaria</p>
              <p className="text-xs text-emerald-700">Solo disponible para Colombia · Activación en máximo 48 horas hábiles.</p>
              <div className="bg-white rounded-lg p-3 border border-emerald-100 space-y-1.5">
                {pseBankName ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Banco:</span>
                    <span className="font-semibold">{pseBankName}</span>
                    <span className="text-muted-foreground">Tipo de cuenta:</span>
                    <span className="font-semibold">{pseAccountType}</span>
                    {pseAccountNumber && (<><span className="text-muted-foreground">N° de cuenta:</span><span className="font-bold font-mono">{pseAccountNumber}</span></>)}
                    {pseOwnerName && (<><span className="text-muted-foreground">Titular:</span><span className="font-semibold">{pseOwnerName}</span></>)}
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-extrabold text-emerald-700">${amount} USD</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">📌 Los datos bancarios serán enviados a tu correo al confirmar la solicitud.</p>
                )}
              </div>
              <p className="text-xs font-bold text-foreground">Envía el comprobante a:</p>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                <span className="text-xs font-mono flex-1 truncate">{ADMIN_EMAIL}</span>
                <button onClick={copyEmail} className="text-primary shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <Button
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                onClick={() => onSelectPlan(amount, 'Plan Mensual')}
              >
                🏦 Ya realicé la transferencia de ${amount} USD
              </Button>
              <p className="text-xs text-amber-700">⚠️ El pago es <strong>manual</strong>. Envía el soporte al menos <strong>1 día antes</strong> del vencimiento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UpdateRequestForm: solicitud de cambio de datos al admin ──
function UpdateRequestForm({ studentName, studentEmail }: { studentName: string; studentEmail: string }) {
  const FIELDS = [
    { value: 'full_name', label: 'Nombre completo' },
    { value: 'country', label: 'País' },
    { value: 'city', label: 'Ciudad' },
    { value: 'birthday', label: 'Fecha de nacimiento' },
    { value: 'education_level', label: 'Nivel de educación' },
    { value: 'other', label: 'Otro' },
  ];
  const [field, setField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!field || !newValue.trim()) { setFormError('Por favor selecciona el dato y escribe el nuevo valor.'); return; }
    setFormError('');
    setSending(true);
    try {
      openWhatsApp(
        `📝 SOLICITUD DE ACTUALIZACIÓN DE PERFIL\n\n` +
        `Nombre: ${studentName}\nCorreo: ${studentEmail}\n\n` +
        `Campo a cambiar: ${field}\nNuevo valor: ${newValue.trim()}` +
        `${message.trim() ? `\n\nMensaje adicional: ${message.trim()}` : ''}`
      );
      setSent(true);
    } catch (_) {
      setFormError('Hubo un problema al enviar tu solicitud. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-bold text-base">¡Solicitud enviada! 📬</p>
          <p className="text-sm text-muted-foreground max-w-xs">Tu solicitud fue recibida. El administrador actualizará tu información pronto.</p>
          <button onClick={() => { setSent(false); setField(''); setNewValue(''); setMessage(''); }} className="text-sm text-primary underline mt-1">Enviar otra solicitud</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
      <h2 className="font-bold text-base mb-1 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" /> Solicitar cambio de datos
      </h2>
      <p className="text-sm text-muted-foreground mb-5">¿Necesitas actualizar algún dato de tu perfil? Envíanos una solicitud y lo haremos por ti.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">¿Qué dato quieres actualizar?</Label>
          <select
            value={field}
            onChange={e => setField(e.target.value)}
            className="w-full border border-border/60 bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          >
            <option value="">Selecciona un campo...</option>
            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Nuevo valor</Label>
          <Input
            placeholder={field === 'birthday' ? 'Ej: 11/03/2001' : 'Escribe el nuevo valor...'}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Mensaje adicional <span className="text-xs">(opcional)</span></Label>
          <textarea
            placeholder="Si necesitas aclarar algo más..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            className="w-full border border-border/60 bg-background rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={sending} className="rounded-xl bg-primary text-primary-foreground px-6 h-9 text-sm">
          {sending ? 'Enviando...' : '📤 Enviar solicitud'}
        </Button>
      </form>
    </div>
  );
}

export default function Dashboard({ isLoggedIn = false, onOpenAuth, onLogout, userName, userId: userIdProp = '' }: DashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('cursos');
  const [showInstrucciones, setShowInstrucciones] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', country: '', city: '', birthday: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileLoading, setProfileLoading] = useState<boolean>(() => {
    // Si ya hay un caché de perfil en sessionStorage, no mostrar spinner desde el inicio
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        if (sessionStorage.key(i)?.startsWith('blang_pcache_v1_')) return false;
      }
    } catch {}
    return true;
  });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  // unit progress map: unitId → number of completed stages
  const [unitProgressMap, setUnitProgressMap] = useState<Record<string, number>>({});
  // total stages per unit (from unit_stage_materials + unit_stage_quizzes)
  const [unitStageTotalMap, setUnitStageTotalMap] = useState<Record<string, number>>({});

  // Session booking form state
  interface SessionSlot { date: string; topic: string; }
  const [sessionName, setSessionName] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [sessionSlots, setSessionSlots] = useState<SessionSlot[]>([{ date: '', topic: '' }]);
  const [sessionWeekly, setSessionWeekly] = useState(false);
  const [sessionWeeklyHours, setSessionWeeklyHours] = useState('');
  const [sessionWeeklySchedule, setSessionWeeklySchedule] = useState('');
  const [sessionObjective, setSessionObjective] = useState('');
  const [sessionSent, setSessionSent] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', message: '' });
  const [teacherSent, setTeacherSent] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  // ── Trial action states ──────────────────────────────────────────────────────
  const [trialView, setTrialView] = useState<'actions' | 'plan' | 'cancel' | 'delete_request'>('actions');
  const [trialPlan, setTrialPlan] = useState<'mensual' | 'trimestral' | null>(null);
  const [trialDeleteReason, setTrialDeleteReason] = useState('');
  const [trialDeleteSent, setTrialDeleteSent] = useState(false);
  const [trialDeleteSending, setTrialDeleteSending] = useState(false);
  const [trialCancelDone, setTrialCancelDone] = useState(false);
const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalModalAmount, setPaypalModalAmount] = useState(15);
  const [payConfig, setPayConfig] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<{ plan_name: string; plan_slug?: string; status: string; amount_usd: number; current_period_end: string; payment_method?: string; renewal_due_at?: string; approved_by_admin?: boolean; account_enabled?: boolean; created_at?: string; trial_ends_at?: string; trial_active?: boolean } | null>(null);
  // Payment history
  interface PaymentHistoryRow { id: string; event_type: string; amount_usd: number; payment_method: string; notes?: string; created_at: string; created_by?: string; }
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRow[]>([]);
  // Progress from DB
  const [totalUnitsCompleted, setTotalUnitsCompleted] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [realCompletedUnits, setRealCompletedUnits] = useState(0);
  const [currentEmail, setCurrentEmail] = useState('');
  const [studentProfile, setStudentProfile] = useState<{
    english_level?: string;
    onboarding_step?: string;
    is_admin_only?: boolean;
    birthday?: string;
    country?: string;
    city?: string;
    education_level?: string;
    education_other?: string;
    account_enabled?: boolean;
    account_status?: string;  // 'pending' | 'active_trial' | 'active' | 'disabled' | 'cancelled' | 'pending_payment' | 'expired_trial'
    trial_active?: boolean;
    trial_start_date?: string;
    trial_end_date?: string;
    created_at?: string;
  } | null>(null);
  // IDs de cursos/unidades con acceso explícito habilitado por admin
  const [grantedModuleIds, setGrantedModuleIds] = useState<string[]>([]);
  // IDs de cursos/unidades con acceso explícitamente revocado por admin
  const [revokedModuleIds, setRevokedModuleIds] = useState<string[]>([]);
  // IDs de unidades individuales con acceso habilitado (filas donde unit_id NO es null)
  const [grantedUnitIds, setGrantedUnitIds] = useState<string[]>([]);
  // IDs de cursos que tienen al menos una unidad con grant individual
  const [courseIdsWithUnitGrants, setCourseIdsWithUnitGrants] = useState<string[]>([]);
  const [showRenewalAlert, setShowRenewalAlert] = useState(false);
  const [showLevelOnboarding, setShowLevelOnboarding] = useState(false);
  const [showLevelExam, setShowLevelExam] = useState(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<string>('welcome');
  const [currentUserId, setCurrentUserId] = useState(userIdProp);

  // Real courses & units from Supabase — inicializados desde caché para evitar spinner en recarga
  const [dbCourses, setDbCourses] = useState<DBCourseRow[]>(() => {
    try {
      const raw = localStorage.getItem('blang_courses_v1');
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (data && Date.now() - ts < 3_600_000) return data as DBCourseRow[];
      }
    } catch {}
    return [];
  });
  const [coursesLoading, setCoursesLoading] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('blang_courses_v1');
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (data && Date.now() - ts < 3_600_000) return false;
      }
    } catch {}
    return true;
  });
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courseUnits, setCourseUnits] = useState<Record<string, DBUnitRow[]>>({});
const [loadingUnits, setLoadingUnits] = useState<string | null>(null);
  const [viewerUnit, setViewerUnit] = useState<{ id: string; title: string; description: string; isReview?: boolean } | null>(null);
  // Modal payment tab state (used in showPaypalModal)
  const [modalTab, setModalTab] = useState<'paypal'|'pse'>('paypal');
  const [modalCopied, setModalCopied] = useState(false);

  const [showClasesModal, setShowClasesModal] = useState(false);

  // Schedule slots (sesión con profesor)
  const [scheduleSlots, setScheduleSlots] = useState<{ id: string; date: string; start_time: string; end_time: string; teacher_name: string; available_spots: number }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set());
  const [myBookedSlot, setMyBookedSlot] = useState<{ id: string; date: string; start_time: string; end_time: string; teacher_name: string; status: string; session_topic?: string } | null | 'loading'>('loading');
  const [bookingModalSlot, setBookingModalSlot] = useState<{ id: string; date: string; start_time: string; end_time: string; teacher_name: string } | null>(null);
  const [bookingFormTopic, setBookingFormTopic] = useState('');
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Mundo Real state
  const [showMundoReal, setShowMundoReal] = useState(false);
  const [mundoRealTopic, setMundoRealTopic] = useState<string | null>(null);
  const [mundoRealTab, setMundoRealTab] = useState<'vocab'|'frases'|'expresiones'|'phrasal'|'estructura'|'dialogo'>('vocab');
  const [mrAnswers, setMrAnswers] = useState<Record<string, number>>({});
  const [mrWordOrder, setMrWordOrder] = useState<string[]>([]);
  const [mrWordSubmitted, setMrWordSubmitted] = useState(false);
  const [mrCategoryFilter, setMrCategoryFilter] = useState('Todos');
  const [mrSearch, setMrSearch] = useState('');
  const [mrOverrides, setMrOverrides] = useState<Record<string, any>>({});

  // Review state
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string } | null | 'loading'>('loading');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewSending, setReviewSending] = useState(false);

  function openMRTopic(id: string | null) {
    setMundoRealTopic(id);
    setMundoRealTab('vocab');
    setMrAnswers({});
    setMrWordOrder([]);
    setMrWordSubmitted(false);
  }

  useEffect(() => {
    if (activeTab !== 'english') {
      setShowMundoReal(false);
      openMRTopic(null);
    }
    if (activeTab === 'sesion') {
      // Cargar horarios disponibles
      if (scheduleSlots.length === 0 && !slotsLoading) {
        setSlotsLoading(true);
        supabase
          .from('schedule_slots')
          .select('id, date, start_time, end_time, teacher_name, available_spots')
          .gt('available_spots', 0)
          .eq('status', 'available')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .then(({ data }) => {
            setScheduleSlots(data || []);
            setSlotsLoading(false);
          });
      }
      // Cargar la sesión reservada del estudiante (por su email)
      const emailToCheck = currentEmail || userEmail;
      if (emailToCheck) {
        setMyBookedSlot('loading');
        supabase
          .from('schedule_slots')
          .select('id, date, start_time, end_time, teacher_name, status, session_topic')
          .eq('booked_student_email', emailToCheck)
          .in('status', ['pending', 'confirmed'])
          .maybeSingle()
          .then(({ data }) => setMyBookedSlot(data ?? null));
      } else {
        setMyBookedSlot(null);
      }
    }
  }, [activeTab]);

useEffect(() => {
    // Load payment config
    supabase.from('payment_config').select('key, value').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: { key: string; value: string | null }) => { map[r.key] = r.value || ''; });
        setPayConfig(map);
      }
    });
  }, []);

  useEffect(() => {
    // Mostrar cursos cacheados inmediatamente (sin spinner) si existen
    const COURSES_CACHE_KEY = 'blang_courses_v1';
    try {
      const raw = localStorage.getItem(COURSES_CACHE_KEY);
      if (raw) {
        const { data: cachedData, ts } = JSON.parse(raw);
        if (cachedData && Date.now() - ts < 3_600_000) { // caché válido 1 hora
          setDbCourses(cachedData);
          setCoursesLoading(false);
        }
      }
    } catch {}

    // Refrescar desde Supabase en segundo plano
    const safetyTimer = setTimeout(() => setCoursesLoading(false), 8000);
    supabase.from('courses').select('*').eq('is_published', true).order('sort_order').then(({ data, error }) => {
      clearTimeout(safetyTimer);
      if (error) console.error('[Dashboard] courses error:', error);
      if (data) {
        setDbCourses(data as DBCourseRow[]);
        try { localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
      }
      setCoursesLoading(false);
    });
    return () => clearTimeout(safetyTimer);
  }, []);

  // Cargar overrides de Mundo Real (ediciones del admin)
  useEffect(() => {
    supabase
      .from('mundo_real_overrides')
      .select('topic_id, vocabulary, phrases, structure, dialogue, expressions, phrasal_verbs')
      .then(({ data }) => {
        if (data?.length) {
          const map: Record<string, any> = {};
          data.forEach((row: any) => { map[row.topic_id] = row; });
          setMrOverrides(map);
        }
      });
  }, []);

  // Fusionar datos estáticos con overrides del admin
  const mergedMundoRealTopics = useMemo(() =>
    MUNDO_REAL_TOPICS.map(t => {
      const ov = mrOverrides[t.id];
      if (!ov) return t;
      return {
        ...t,
        vocabulary:   [...(t.vocabulary ?? []), ...(ov.vocabulary ?? [])],
        phrases:      [...(t.phrases ?? []),     ...(ov.phrases ?? [])],
        structure:    ov.structure     ?? t.structure,
        dialogue:     ov.dialogue      ?? t.dialogue,
        expressions:  ov.expressions   ?? t.expressions  ?? [],
        phrasalVerbs: ov.phrasal_verbs ?? t.phrasalVerbs ?? [],
      };
    }),
  [mrOverrides]);

  const loadUnitsForCourse = async (courseId: string) => {
    if (courseUnits[courseId]) return; // already loaded
    setLoadingUnits(courseId);
    try {
      const unitsTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10_000)
      );
      const { data } = await Promise.race([
        supabase.from('units').select('*').eq('course_id', courseId).eq('is_published', true).order('sort_order'),
        unitsTimeout,
      ]) as { data: DBUnitRow[] | null };
      const units = (data || []) as DBUnitRow[];
      setCourseUnits(prev => ({ ...prev, [courseId]: units }));

      // Cargar progreso + total real de partes de cada unidad
      if (units.length > 0 && currentUserId) {
        const unitIds = units.map(u => u.id);

        // Materiales + quizzes desde Supabase; progreso completado desde localStorage
        const [{ data: matStages }, { data: quizStages }] = await Promise.all([
          supabase.from('unit_stage_materials')
            .select('unit_id, stage')
            .in('unit_id', unitIds),
          supabase.from('unit_stage_quizzes')
            .select('unit_id, stage')
            .in('unit_id', unitIds),
        ]);
        const progData = unitIds.flatMap(uid => {
          const stages = getUnitProgress(currentUserId, uid);
          return Object.values(stages).filter((s: any) => s?.completed).map(() => ({ unit_id: uid }));
        });

        // Total de partes por unidad = stages únicos con material O quiz
        const stageSetMap: Record<string, Set<string>> = {};
        [...(matStages || []), ...(quizStages || [])].forEach((r: { unit_id: string; stage: string }) => {
          if (!stageSetMap[r.unit_id]) stageSetMap[r.unit_id] = new Set();
          stageSetMap[r.unit_id].add(r.stage);
        });
        const newTotalMap: Record<string, number> = {};
        unitIds.forEach(uid => { newTotalMap[uid] = stageSetMap[uid]?.size || 1; });
        setUnitStageTotalMap(prev => ({ ...prev, ...newTotalMap }));

        // Partes completadas por unidad
        const newMap: Record<string, number> = {};
        (progData || []).forEach((p: { unit_id: string }) => {
          newMap[p.unit_id] = (newMap[p.unit_id] || 0) + 1;
        });
        setUnitProgressMap(prev => ({ ...prev, ...newMap }));
      }
    } catch {
      setCourseUnits(prev => ({ ...prev, [courseId]: prev[courseId] ?? [] }));
    } finally {
      setLoadingUnits(null);
    }
  };

  const toggleCourse = (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    loadUnitsForCourse(courseId);
  };

  // ── refreshProfile: carga perfil + suscripción + historial usando cliente directo ──
  const PROFILE_CACHE_PREFIX = 'blang_pcache_v1_';

  const applyProfileData = (prof: any, sub: any, hist: any, grantedIds: string[], revokedIds: string[], grantedUnitIds: string[], cidsWithUnitGrants: string[]) => {
    if (prof) {
      const dbName = (prof as { full_name?: string }).full_name || '';
      const displayFullName = dbName || userName || '';
      setProfileForm({
        name: displayFullName,
        country: (prof as { country?: string }).country || '',
        city: (prof as { city?: string }).city || '',
        birthday: (prof as { birthday?: string }).birthday || '',
      });
      setStudentProfile(prof as typeof studentProfile);
      setTeacherForm((tf: typeof teacherForm) => ({ ...tf, name: displayFullName }));
      setSessionName(displayFullName);
    }
    if (hist) setPaymentHistory(hist as PaymentHistoryRow[]);
    setSubscription(sub ? (sub as typeof subscription) : null);
    if (sub) {
      const method = (sub as { payment_method?: string }).payment_method;
      const dueAt  = (sub as { renewal_due_at?: string }).renewal_due_at;
      if ((method === 'pse' || method === 'paypal') && dueAt) {
        const ms = new Date(dueAt).getTime() - Date.now();
        if (ms > 0 && ms <= 24 * 60 * 60 * 1000) setShowRenewalAlert(true);
      }
    }
    setGrantedModuleIds(grantedIds);
    setRevokedModuleIds(revokedIds);
    setGrantedUnitIds(grantedUnitIds);
    setCourseIdsWithUnitGrants(cidsWithUnitGrants);
  };

  const refreshProfile = async (userId: string) => {
    // Mostrar caché inmediatamente (sin spinner) si existe en sessionStorage
    let hasCachedData = false;
    try {
      const raw = sessionStorage.getItem(PROFILE_CACHE_PREFIX + userId);
      if (raw) {
        const c = JSON.parse(raw);
        applyProfileData(c.prof, c.sub, c.hist, c.grantedIds || [], c.revokedIds || [], c.grantedUnitIds || [], c.cidsWithUnitGrants || []);
        setProfileLoading(false);
        hasCachedData = true;
      }
    } catch {}

    // Siempre refrescar desde Supabase (spinner solo si no hay caché)
    if (!hasCachedData) setProfileLoading(true);
    try {
    const profileTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout cargando perfil')), 12_000)
    );
    const [profRes, subRes, histRes, modRes] = await Promise.race([
      Promise.all([
        supabase
          .from('student_profiles')
          .select('full_name, english_level, onboarding_step, is_admin_only, birthday, country, city, education_level, education_other, account_enabled, account_status, trial_active, trial_start_date, trial_end_date, created_at')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('payment_history')
          .select('*')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('student_module_access')
          .select('course_id, unit_id, is_active')
          .eq('student_id', userId),
      ]),
      profileTimeout,
    ]);

    const prof = profRes.data;
    const sub  = subRes.data;
    const hist = histRes.data;
    const mods = modRes.data;

    if (profRes.error) console.error('[refreshProfile] student_profiles error:', profRes.error);
    if (subRes.error)  console.error('[refreshProfile] subscriptions error:', subRes.error);
    if (histRes.error) console.error('[refreshProfile] payment_history error:', histRes.error);

    if (!prof && !profRes.error) {
      // Perfil no existe — crearlo
      const newName = userName || '';
      await supabase.from('student_profiles').upsert({
        id: userId,
        full_name: newName || null,
        onboarding_step: 'pending_plan',
        account_status: 'pending',
      });
      setProfileForm(p => ({ ...p, name: newName }));
      setSessionName(newName);
      setTeacherForm(tf => ({ ...tf, name: newName }));
    } else if (profRes.error) {
      setProfileForm(p => ({ ...p, name: p.name || userName || '' }));
    }

    const allMods = ((mods ?? []) as { course_id?: string; unit_id?: string; is_active?: boolean }[]);
    const grantedIds = allMods.filter(m => m.is_active === true).map(m => m.unit_id || m.course_id || '').filter(Boolean);
    const revokedIds = allMods.filter(m => m.is_active === false).map(m => m.unit_id || m.course_id || '').filter(Boolean);
    const unitOnlyGranted = allMods.filter(m => m.is_active === true && !!m.unit_id);
    const grantedUnitIds = unitOnlyGranted.map(m => m.unit_id as string);
    const cidsWithUnitGrants = [...new Set(unitOnlyGranted.map(m => m.course_id as string).filter(Boolean))];

    applyProfileData(prof, sub, hist, grantedIds, revokedIds, grantedUnitIds, cidsWithUnitGrants);

    // Guardar en sessionStorage para recarga instantánea
    try {
      sessionStorage.setItem(PROFILE_CACHE_PREFIX + userId, JSON.stringify({ prof, sub, hist, grantedIds, revokedIds, grantedUnitIds, cidsWithUnitGrants }));
    } catch {}

    } catch (err) {
      console.error('[refreshProfile] error inesperado:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    // Si ya tenemos el userId desde App.tsx, cargar el perfil de inmediato sin esperar getSession()
    if (userIdProp) refreshProfile(userIdProp);
    // Timeout de seguridad: si getSession() tarda más de 8s, liberar el spinner
    const safetyTimer = setTimeout(() => setProfileLoading(false), 8000);
    // Cargar sesión y perfil al montar — usando getSession para tener el token listo
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(safetyTimer);
      const user = session?.user;
      if (!user) { setProfileLoading(false); return; }
      setCurrentEmail(user.email || '');
      setCurrentUserId(user.id);
      setSessionEmail(user.email || '');
      refreshProfile(user.id);
      // Sincronizar progreso desde Supabase en cada inicio de sesión
      // para que el progreso se refleje en todos los dispositivos del estudiante.
      try {
        const { data: remoteRows } = await supabase
          .from('unit_progress')
          .select('unit_id, stage, completed, completed_at, quiz_passed')
          .eq('student_id', user.id);
        if (remoteRows) mergeFromRemote(user.id, remoteRows);
      } catch (e) {
        console.error('[Dashboard] Error sincronizando progreso desde Supabase:', e);
      }
      markMigrated(user.id);
      // Progreso real: leído de localStorage (fuente de verdad), no de Supabase
      const localData = getAllProgressForStudent(user.id).filter(p => p.completed);
      const uniqueUnits = new Set(localData.map(p => p.unitId));
      setRealCompletedUnits(uniqueUnits.size);
      setTotalUnitsCompleted(uniqueUnits.size);
      const dates = localData.map(p => p.completed_at).filter(Boolean) as string[];
      const uniqueDays = [...new Set(dates.map(d => d.slice(0, 10)))].sort().reverse();
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (uniqueDays.length === 0 || (uniqueDays[0] !== today && uniqueDays[0] !== yesterday)) {
        setStreakDays(0);
      } else {
        let streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = new Date(uniqueDays[i - 1]);
          const curr = new Date(uniqueDays[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (Math.round(diff) === 1) streak++;
          else break;
        }
        setStreakDays(streak);
      }
    });
  }, [isLoggedIn]); // userName excluido: cambia después del primer load y dispararía doble carga

  // Cargar reseña existente del estudiante
  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from('student_reviews')
      .select('rating, comment')
      .eq('user_id', currentUserId)
      .maybeSingle()
      .then(({ data }) => setExistingReview(data ?? null));
  }, [currentUserId]);

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewComment.trim() || !currentUserId) return;
    setReviewSending(true);
    try {
      const { error } = await supabase.from('student_reviews').insert({
        user_id: currentUserId,
        full_name: profileForm.name || userName || 'Estudiante',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (!error) {
        setExistingReview({ rating: reviewRating, comment: reviewComment.trim() });
      }
    } catch (_) {
      // silenciar error de red
    } finally {
      setReviewSending(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!bookingModalSlot || !bookingFormTopic.trim()) return;
    setBookingSubmitting(true);
    setBookingError('');
    const studentName = profileForm.name || userName || 'Estudiante';
    const studentEmail = currentEmail || userEmail || '';
    try {
      const { data, error } = await supabase.rpc('book_schedule_slot', {
        p_slot_id: bookingModalSlot.id,
        p_student_name: studentName,
        p_student_email: studentEmail,
        p_topic: bookingFormTopic.trim(),
      });
      if (error) {
        setBookingError('Ocurrió un error al procesar tu reserva. Intenta de nuevo.');
      } else if (data?.success === false || data?.error) {
        setBookingError('Este horario ya no está disponible. Por favor elige otro.');
        // Recargar slots para reflejar el estado real
        supabase.from('schedule_slots').select('id, date, start_time, end_time, teacher_name, available_spots')
          .gt('available_spots', 0).eq('status', 'available')
          .order('date').order('start_time')
          .then(({ data: fresh }) => { if (fresh) setScheduleSlots(fresh); });
      } else {
        // Éxito (data?.success === true o cualquier respuesta sin error)
        setScheduleSlots(prev => prev.filter(s => s.id !== bookingModalSlot.id));
        setBookingSuccess(true);
        // Fire-and-forget: abrir WhatsApp con los detalles de la reserva
        openWhatsApp(
          `📅 RESERVA DE SESIÓN EN VIVO\n\n` +
          `Estudiante: ${studentName}\nCorreo: ${studentEmail}\n\n` +
          `Fecha: ${bookingModalSlot.date}\n` +
          `Horario: ${bookingModalSlot.start_time} – ${bookingModalSlot.end_time}\n` +
          `Profesor: ${bookingModalSlot.teacher_name}\n` +
          `Tema: ${bookingFormTopic.trim()}\n` +
          `Método de pago: ${bookingPaymentMethod}`
        );
      }
    } catch (_) {
      setBookingError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Realtime + polling para detectar cambios del admin (onboarding_step, plan, acceso módulos)
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;

    const doRefresh = () => refreshProfile(currentUserId);

    // Canal único: escucha student_profiles + subscriptions + student_module_access
    const channel = supabase
      .channel(`admin-changes-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_profiles',      filter: `id=eq.${currentUserId}` },       doRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions',         filter: `student_id=eq.${currentUserId}` }, doRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_module_access', filter: `student_id=eq.${currentUserId}` }, doRefresh)
      .subscribe();

    // Polling de respaldo cada 8s para asegurar que cambios admin se reflejen
    const interval = setInterval(doRefresh, 8000);
    const onFocus = () => doRefresh();
    window.addEventListener('focus', onFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, currentUserId]);

  // Level-based course visibility
  const studentLevel = studentProfile?.english_level;
  const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const studentLevelIdx = studentLevel ? LEVEL_ORDER.indexOf(studentLevel) : -1;

  // Estados de suscripción
  const subStatus      = subscription?.status;
  const subEnabled     = subscription?.account_enabled;
  const subApproved    = subscription?.approved_by_admin;
  const subPlan        = subscription?.plan_slug;
  const isTrial7       = (subPlan === 'free_trial' || subStatus === 'trial') && subStatus !== 'cancelled';
  const isPendingPayment = subApproved === false && subEnabled === false && subStatus !== 'cancelled';

  // ── Fuente de verdad del perfil (tiene prioridad sobre subscription) ──
  const profStatus     = studentProfile?.account_status;
  const profEnabled    = studentProfile?.account_enabled;
  // Cuenta activa según el perfil (admin habilitó directamente en student_profiles)
  const isProfileActive = profStatus === 'active' && profEnabled === true;
  // Cuenta deshabilitada según el perfil (tiene prioridad máxima)
  const isProfileDisabled = profStatus === 'disabled' || (profEnabled === false && profStatus !== 'active_trial');

  /**
   * isCourseVisible — ÚNICA fuente de verdad para bloqueo/acceso de cursos.
   * Orden de prioridad (de mayor a menor):
   *  0. Sin suscripción activa => bloquear todo (excepto revokes/grants explícitos)
   *  1. Revocación explícita del admin => siempre bloqueado
   *  2. Concesión explícita del admin  => siempre visible
   *  3. Plan gratuito admin (free_admin, active) => acceso por nivel (sin nivel = todo)
   *  4. Cancelado => bloqueado
   *  5. Deshabilitado por admin (account_enabled=false) => bloqueado
   *  6. Trial (status=trial) => solo A1
   *  7. Pago pendiente de aprobación => bloqueado
   *  8. Plan activo + aprobado => acceso por nivel (sin nivel = A1 por defecto)
   */
  const isCourseVisible = (course: DBCourseRow): boolean => {
    // Mientras el perfil/suscripción aún está cargando no bloqueamos nada
    // (evita el flash de "todos los cursos bloqueados" en el primer render).
    if (profileLoading) return true;

    // Prioridad 1: revocación explícita
    if (revokedModuleIds.includes(course.id)) return false;

    // Prioridad 1b: cuenta cancelada o deshabilitada
    if (subStatus === 'cancelled') {
      // Plan de pago cancelado pero dentro del período pagado → mantener acceso
      const isTrial = subscription?.plan_slug === 'free_trial';
      const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
      const withinPeriod = !isTrial && periodEnd && new Date() <= periodEnd;
      if (!withinPeriod) return false; // trial o período vencido → bloquear
      // else: fall through, acceso hasta fin de período
    }
    if (isProfileDisabled) return false;
    if (subEnabled === false && profEnabled === false) return false;

    // Prioridad 2: concesión explícita del curso completo
    if (grantedModuleIds.includes(course.id)) return true;
    // Prioridad 2b: al menos una unidad del curso tiene grant individual → curso visible
    if (courseIdsWithUnitGrants.includes(course.id)) return true;

    // Sin suscripción => solo acceso si hay grant explícito (ya chequeado arriba)
    if (!subscription) return false;

    // Examen de nivel pendiente => bloquear TODO hasta que lo complete
    if (studentProfile?.onboarding_step === 'english_test') return false;

    // Prioridad 3: plan free_admin activo => acceso completo
    if (subPlan === 'free_admin' && subStatus === 'active') {
      // Ya no se exige completar el nivel anterior para desbloquear el siguiente
      return true;
    }

    // Prioridad 4: cancelado
    if (subStatus === 'cancelled') return false;

    // Prioridad 5: deshabilitado — perfil tiene prioridad sobre subscription
    if (isProfileDisabled) return false;
    if (subEnabled === false && !isProfileActive) return false;

    // Prioridad 6: trial activo => solo A1
    if (isTrial7) {
      const lvl = course.required_level || course.level;
      return lvl === 'A1';
    }

    // Prioridad 7: pendiente de aprobación
    if (isPendingPayment) return false;

    // Prioridad 8a: cuenta activa por perfil (admin habilitó directo en student_profiles)
    if (isProfileActive) {
      // Ya no se exige completar el nivel anterior para desbloquear el siguiente
      return true;
    }

    // Prioridad 8b: plan activo y aprobado en subscription
    if (subStatus === 'active' && subApproved === true && subEnabled === true) {
      // Ya no se exige completar el nivel anterior para desbloquear el siguiente
      return true;
    }

    // Por defecto bloquear
    return false;
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filledSlots = sessionSlots.filter(s => s.date || s.topic);
    if (filledSlots.length === 0) return;
    setSessionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Save to DB
      await supabase.from('session_requests').insert({
        student_id: user?.id || null,
        student_name: sessionName,
        student_email: sessionEmail,
        sessions: filledSlots,
        weekly_plan: sessionWeekly,
        weekly_hours: sessionWeekly ? sessionWeeklyHours : null,
        weekly_schedule: sessionWeekly ? sessionWeeklySchedule : null,
        objective: sessionObjective || null,
      });
      // Notificar al admin por WhatsApp
      const slotsTexto = filledSlots.map((s, i) => `  Sesión ${i + 1}: ${s.date || '?'} — ${s.topic || 'sin tema'}`).join('\n');
      openWhatsApp(
        `🎓 SOLICITUD DE CLASES SEMANALES\n\n` +
        `Estudiante: ${sessionName}\nCorreo: ${sessionEmail}\n\n` +
        `Sesiones solicitadas:\n${slotsTexto}` +
        `${sessionWeekly ? `\n\nPlan semanal: Sí\nHoras semanales: ${sessionWeeklyHours}\nHorario: ${sessionWeeklySchedule}` : ''}` +
        `${sessionObjective ? `\n\nObjetivo: ${sessionObjective}` : ''}`
      );
    } catch (_) { /* ignore, still show success */ }
    setSessionLoading(false);
    setSessionSent(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveError('');
    // Usar el userId ya cargado en estado; si no hay, obtenerlo de la sesión
    let uid = currentUserId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id || '';
    }
    if (!uid) {
      setProfileSaveError('No se pudo identificar tu sesión. Por favor recarga la página.');
      return;
    }
    setLoading(true);
    const patch = {
      full_name: profileForm.name.trim() || null,
      country: profileForm.country.trim() || null,
      city: profileForm.city.trim() || null,
      birthday: profileForm.birthday || null,
      education_level: studentProfile?.education_level || null,
      education_other: studentProfile?.education_other || null,
      updated_at: new Date().toISOString(),
    };
    // Upsert asegura crear o actualizar el perfil
    const { error: saveErr } = await supabase
      .from('student_profiles')
      .upsert({ id: uid, ...patch }, { onConflict: 'id' });
    setLoading(false);
    if (saveErr) {
      console.error('Profile save error:', saveErr);
      setProfileSaveError('Error al guardar: ' + saveErr.message);
      return;
    }
    await refreshProfile(uid);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPw.length < 6) { setPwError('La nueva contraseña debe tener mínimo 6 caracteres'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setLoading(false);
    if (error) {
      if (error.message.includes('Auth session missing') || error.message.includes('session')) {
        setPwError('Tu sesión expiró. Por favor, cierra sesión e inicia de nuevo para cambiar la contraseña.');
      } else {
        setPwError(error.message);
      }
      return;
    }
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (_) {}
    if (onLogout) onLogout();
    navigate(ROUTE_PATHS.HOME);
  };

  // Not logged in guard — redirigir al home en vez de mostrar pantalla bloqueada
  if (!isLoggedIn) {
    return <Navigate to={ROUTE_PATHS.HOME} replace />;
  }

  // Use profile name from DB (more up-to-date) or fall back to prop
  const displayName = profileForm.name || userName || 'Estudiante';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50/50 to-background flex flex-col">

{/* ── MODAL PAYPAL/PSE EMERGENTE ── */}
      {showPaypalModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaypalModal(false)} />
            <motion.div
              className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <button
                onClick={() => setShowPaypalModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors text-lg"
              >
                ×
              </button>
              <h3 className="font-extrabold text-xl mb-1">Completar pago 💳</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monto a pagar: <strong>${paypalModalAmount.toFixed(2)} USD</strong>
              </p>

              {/* Tabs — PayPal / PSE */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setModalTab('paypal')}
                    className={`rounded-xl py-2.5 text-sm font-bold border-2 transition-all ${
                      modalTab==='paypal' ? 'border-[#003087] bg-[#003087]/5 text-[#003087]' : 'border-border/40 text-muted-foreground'
                    }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 inline mr-1 fill-current"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.928l-1.182 7.519H12c.46 0 .85-.334.922-.789l.038-.197.733-4.64.047-.257a.932.932 0 0 1 .921-.789h.58c3.76 0 6.701-1.528 7.559-5.95.36-1.85.176-3.395-.578-4.692z"/></svg>
                    PayPal
                  </button>
                  <button onClick={() => setModalTab('pse')}
                    className={`rounded-xl py-2.5 text-sm font-bold border-2 transition-all ${
                      modalTab==='pse' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border/40 text-muted-foreground'
                    }`}>
                    🏦 PSE / Transferencia
                  </button>
                </div>

                {modalTab === 'paypal' && (
                  <div className="rounded-2xl border-2 border-[#FFC439]/60 bg-[#FFC439]/5 p-4 space-y-3">
                    <p className="text-xs font-bold text-[#003087]">Instrucciones — PayPal</p>
                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Accede a tu cuenta de PayPal</li>
                      <li>Envía <strong>${paypalModalAmount.toFixed(2)} USD</strong> a la cuenta BLANG</li>
                      <li>En el concepto escribe tu nombre + correo</li>
                      <li>Envía el comprobante al administrador</li>
                    </ol>
                    <a href={payConfig['paypal_link'] || 'https://paypal.me/blangenglish'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold">
                      <ExternalLink className="w-3 h-3" /> Ir a PayPal para pagar →
                    </a>
                    <PayPalHostedButton />
                    <p className="text-xs text-muted-foreground">✅ Tu cuenta se activará en máximo 48h al confirmar el pago.</p>
                  </div>
                )}

                {modalTab === 'pse' && (
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-800">Instrucciones — PSE / Transferencia bancaria (Colombia)</p>
                    <div className="bg-white rounded-lg p-3 border border-emerald-100">
                      {payConfig['pse_bank_name'] ? (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          <span className="text-muted-foreground">Banco:</span><span className="font-semibold">{payConfig['pse_bank_name']}</span>
                          <span className="text-muted-foreground">Tipo de cuenta:</span><span className="font-semibold">{payConfig['pse_account_type'] || 'Ahorros'}</span>
                          {payConfig['pse_account_number'] && (<><span className="text-muted-foreground">N° de cuenta:</span><span className="font-bold font-mono">{payConfig['pse_account_number']}</span></>)}
                          {payConfig['pse_owner_name'] && (<><span className="text-muted-foreground">Titular:</span><span className="font-semibold">{payConfig['pse_owner_name']}</span></>)}
                          <span className="text-muted-foreground">Monto:</span><span className="font-extrabold text-emerald-700">${paypalModalAmount.toFixed(2)} USD</span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700">📌 Los datos bancarios serán enviados a tu correo al confirmar la solicitud.</p>
                      )}
                    </div>
                    <p className="text-xs font-bold">Envía el comprobante por WhatsApp:</p>
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
                      <span className="text-xs font-mono flex-1 truncate">+57 323 640 5246</span>
                      <button onClick={() => { navigator.clipboard.writeText('+573236405246'); setModalCopied(true); setTimeout(()=>setModalCopied(false),2000); }} className="text-primary shrink-0">
                        {modalCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-amber-700">⚠️ Pago manual. Tu cuenta se activa en máximo 48h hábiles tras confirmar.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
      )}

      {/* ── TOP HEADER (logged-in only) ── */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <button onClick={() => navigate(ROUTE_PATHS.HOME)} className="flex items-center">
              <img src={IMAGES.BLANG_LOGO} alt="BLANG" className="h-9 w-auto" />
            </button>
            {/* Profile trigger */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hola, <span className="font-bold text-primary">{displayName}</span>
              </span>
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-background rounded-3xl border border-border/50 shadow-sm overflow-hidden">
              {/* Profile header */}
              <div className="bg-gradient-to-br from-primary to-purple-600 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur mx-auto mb-3 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border-4 border-white/30">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-white text-lg leading-tight">{displayName}</p>
                {/* Level badge */}
                {studentProfile?.english_level && (
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <span className="bg-white/25 border border-white/30 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      Nivel {studentProfile.english_level}
                    </span>
                  </div>
                )}
                {!studentProfile?.english_level && (
                  <p className="text-white/60 text-xs mt-1">Estudiante BLANG</p>
                )}
                <div className="flex items-center justify-center gap-1 mt-3 bg-white/15 rounded-full px-3 py-1 w-fit mx-auto">
                  <Flame className="w-3.5 h-3.5 text-orange-300" />
                  <span className="text-white/90 text-xs font-bold">{streakDays} {streakDays === 1 ? 'día' : 'días'} de racha</span>
                </div>
              </div>

              {/* Nav items */}
              <nav className="p-2">
                {([
                  { id: 'cursos',      icon: BookOpen, label: 'Mis Cursos' },
                  { id: 'english',    icon: Sparkles,  label: 'English for you!' },
                  { id: 'sesion',   icon: Video,       label: 'Sesión con Profesor' },
                  { id: 'cuenta',   icon: User,        label: 'Cuenta' },
                  { id: 'pagos',    icon: CreditCard,  label: 'Pagos' },
                  { id: 'ayuda',    icon: HelpCircle,  label: 'Ayuda' },
                ] as { id: TabId; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeTab === id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}

                <div className="border-t border-border/50 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">

            {/* ── BANNER: membresía próxima a vencer ── */}
            {(() => {
              if (!subscription || !subscription.current_period_end) return null;
              const expiry = new Date(subscription.current_period_end);
              const today  = new Date();
              today.setHours(0, 0, 0, 0);
              const diffMs   = expiry.getTime() - today.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const isActive = subscription.status === 'active' && subscription.account_enabled === true && subscription.plan_slug !== 'free_admin';
              if (!isActive || diffDays > 3 || diffDays < 0) return null;
              const fechaStr = expiry.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
              const precio   = subscription.amount_usd ? `$${Number(subscription.amount_usd).toFixed(0)} USD` : 'el valor de tu plan';
              return (
                <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700 px-4 py-3.5 shadow-sm">
                  <span className="text-2xl leading-none mt-0.5">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-amber-800 dark:text-amber-300 text-sm leading-snug">
                      Pronto termina tu membresía
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 text-sm mt-0.5 leading-snug">
                      Recuerda pagar el día <strong>{fechaStr}</strong> un valor de <strong>{precio}</strong>.{' '}
                      Escríbenos por{' '}
                      <a
                        href="https://wa.me/573236405246"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        WhatsApp +57 323 640 5246
                      </a>{' '}
                      para enviarte el link de pago.
                    </p>
                  </div>
                </div>
              );
            })()}

            <AnimatePresence mode="wait">

              {/* ─── CURSOS ─── */}
              {activeTab === 'cursos' && (
                <motion.div key="cursos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                  {/* Renewal alert */}
                  {showRenewalAlert && subscription?.payment_method && (subscription.payment_method === 'pse' || subscription.payment_method === 'paypal') && subscription.renewal_due_at && (
                    <div className="mb-4">
                      <RenewalAlert
                        paymentMethod={subscription.payment_method as 'pse' | 'paypal'}
                        dueDate={subscription.renewal_due_at}
                        onDismiss={() => setShowRenewalAlert(false)}
                      />
                    </div>
                  )}

                  <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">¡Empecemos con los cursos! 🚀</h1>
                    <p className="text-muted-foreground text-sm">Selecciona un nivel para comenzar o continuar tu aprendizaje.</p>
                  </div>

                  {/* ── Stats: racha, unidades, nivel ── */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1.5"><Flame className="w-5 h-5 text-orange-500" /></div>
                      <p className="text-2xl font-extrabold">{streakDays}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Días de racha</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1.5"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                      <p className="text-2xl font-extrabold">{realCompletedUnits}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Unidades completadas</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-1.5"><Award className="w-5 h-5 text-violet-500" /></div>
                      <p className="text-xl font-extrabold leading-tight">{studentProfile?.english_level || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Nivel actual</p>
                    </div>
                  </div>

                  {/* ── Botón instrucciones ── */}
                  <button
                    onClick={() => setShowInstrucciones(true)}
                    className="w-full flex items-center gap-3 rounded-2xl border-2 border-violet-300 bg-violet-50 hover:bg-violet-100 transition-colors px-5 py-4 text-left shadow-sm mb-2"
                  >
                    <span className="text-3xl">📖</span>
                    <div>
                      <p className="font-extrabold text-violet-700 text-sm">¿Cómo usar la plataforma?</p>
                      <p className="text-xs text-violet-500 mt-0.5">Instrucciones paso a paso para sacarle el máximo provecho</p>
                    </div>
                    <span className="ml-auto text-violet-400 text-lg">›</span>
                  </button>

                  {/* ── Califica tu experiencia ── */}
                  <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4 mb-2">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Califica tu experiencia
                    </h2>

                    {existingReview === 'loading' ? (
                      <div className="flex justify-center py-4">
                        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : existingReview !== null ? (
                      <div className="space-y-3">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-6 h-6 ${s <= existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <p className="text-sm bg-muted/50 rounded-xl p-3 text-foreground leading-relaxed">
                          "{existingReview.comment}"
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-500" /> Tu reseña ya fue enviada. ¡Gracias!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">¿Cómo calificarías tu experiencia?</p>
                          <div className="flex gap-1.5">
                            {[1,2,3,4,5].map(s => (
                              <button
                                key={s}
                                onClick={() => setReviewRating(s)}
                                onMouseEnter={() => setReviewHover(s)}
                                onMouseLeave={() => setReviewHover(0)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                              >
                                <Star className={`w-8 h-8 transition-colors ${s <= (reviewHover || reviewRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`} />
                              </button>
                            ))}
                          </div>
                          {reviewRating > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {['', 'Muy malo 😞', 'Malo 😕', 'Regular 😐', 'Bueno 😊', '¡Excelente! 🌟'][reviewRating]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm text-muted-foreground">Deja un comentario (opcional pero muy valioso 💬)</label>
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Cuéntanos tu experiencia aprendiendo inglés con BLANG..."
                            rows={3}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <Button
                          onClick={handleSubmitReview}
                          disabled={reviewSending || !reviewRating || !reviewComment.trim()}
                          className="rounded-xl px-6 h-9 text-sm"
                        >
                          {reviewSending ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Enviando...
                            </span>
                          ) : 'Enviar reseña ⭐'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ── Modal instrucciones (global, accesible desde cualquier tab) ── */}
                  <Dialog open={showInstrucciones} onOpenChange={setShowInstrucciones}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                          📖 Cómo usar la plataforma
                        </DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground -mt-1 mb-4">
                        ¡Bienvenido/a a BLANG English! 🎉 Aquí te explicamos paso a paso cómo aprovechar al máximo tu experiencia de aprendizaje.
                      </p>
                      <div className="space-y-4 text-sm">
                        <div className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center shrink-0 text-xs">1</span>
                          <p><strong>Elige tu nivel:</strong> Despliega la sección de tu nivel y verás todas las unidades disponibles para ti.</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center shrink-0 text-xs">2</span>
                          <p><strong>Selecciona una unidad:</strong> Elige la unidad que quieres trabajar. Te recomendamos siempre empezar por la primera e ir en orden.</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center shrink-0 text-xs">3</span>
                          <p><strong>Dale en "Comenzar":</strong> Se recomienda apartar <strong>una hora u hora y media</strong> para hacer el trabajo completo de la unidad.</p>
                        </div>
                        <div className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center shrink-0 text-xs">4</span>
                          <p><strong>La unidad tiene 5 partes:</strong> Part 1 Grammar · Part 2 Vocabulary · Part 3 Reading · Part 4 Listening · Part 5 IA Practice.</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
                          <p className="font-bold text-xs text-foreground/70 uppercase tracking-wide">Detalle de cada parte</p>
                          <div>
                            <p className="font-bold">📘 Part 1 – Grammar</p>
                            <p className="text-muted-foreground text-xs mt-0.5">Encontrarás un PDF con la explicación de gramática — estúdialo, toma notas. Luego un video y una imagen resumen (ambos los puedes guardar). Al final un quiz: necesitas más del 60% para avanzar.</p>
                          </div>
                          <div>
                            <p className="font-bold">📝 Part 2 – Vocabulary</p>
                            <p className="text-muted-foreground text-xs mt-0.5">Lista de vocabulario con botón para escuchar la pronunciación — repite en voz alta varias veces. En algunos habrá un link a Flashcards (necesitas crear cuenta), en otros una imagen resumen. Al final el quiz.</p>
                          </div>
                          <div>
                            <p className="font-bold">📖 Part 3 – Reading</p>
                            <p className="text-muted-foreground text-xs mt-0.5">Una lectura corta (va creciendo en nivel). Puedes señalar cualquier palabra que no entiendas y la página te la traduce. Al final el quiz sobre la lectura.</p>
                          </div>
                          <div>
                            <p className="font-bold">🎧 Part 4 – Listening</p>
                            <p className="text-muted-foreground text-xs mt-0.5">Escucha el audio las veces que necesites, toma nota, y luego responde el quiz.</p>
                          </div>
                          <div>
                            <p className="font-bold">🤖 Part 5 – IA Practice</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              Según tu plan: <strong>Plan mensual</strong> — copia y pega los prompts en ChatGPT (necesitas crear cuenta ahí). <strong>Plan trimestral</strong> — ingresa a Speakology y haz la unidad asignada.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-extrabold flex items-center justify-center shrink-0 text-xs">✓</span>
                          <p><strong>Marcar como completado:</strong> Una vez termines la Part 5, dale en "Marcar como completado". Espera unos momentos mientras la página guarda la información — luego la unidad aparecerá como completada ✅</p>
                        </div>
                        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <span className="text-xl shrink-0">💡</span>
                          <p className="text-xs text-amber-800"><strong>Consejo:</strong> Si la página se queda cargando, cierra sesión y vuelve a ingresar. A veces por el tiempo de inactividad se puede caer la conexión, pero no es frecuente.</p>
                        </div>
                        <p className="text-center text-xs text-muted-foreground pt-1">
                          ¡Estamos muy felices de que estés aquí aprendiendo! 💜<br/>
                          Cada unidad que completas es un paso más hacia tu meta. ¡Tú puedes!
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* ── Banner: sin suscripción o cancelada → ir a pagos ── */}
                  {/* No mostrar si: cargando | plan de pago cancelado dentro del período (activo_cancelado) | pago pendiente */}
                  {!profileLoading && (!subscription || subscription.status === 'cancelled') &&
                   studentProfile?.account_status !== 'pending_payment' &&
                   !(subscription?.status === 'cancelled' && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date()) &&
                   (
                    <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-foreground">{subscription?.status === 'cancelled' ? '¡Tu suscripción fue cancelada! 🔒' : 'Elige un plan para habilitar tus cursos 🎓'}</p>
                          <p className="text-sm text-muted-foreground mt-1">Tu cuenta está deshabilitada. Ve a Pagos para reactivar tu acceso por $16 USD o $60,000 COP al mes.</p>
                          <Button size="sm" className="mt-3 rounded-xl gap-1.5" onClick={() => setActiveTab('pagos')}>
                            <CreditCard className="w-3.5 h-3.5" /> Ir a Pagos y elegir plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment pending warning — PSE/PayPal not yet approved */}
                  {/* Solo mostrar si hay un pago REAL pendiente (no cancelled) */}
                  {subscription && subscription.status !== 'cancelled' &&
                   (subscription.payment_method === 'pse' || subscription.payment_method === 'paypal' || subscription.payment_method === 'bold_pse') &&
                   subscription.approved_by_admin === false && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-amber-800">⏳ Pago pendiente de aprobación</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Seleccionaste <strong>{subscription.payment_method === 'pse' ? 'PSE' : 'PayPal'}</strong>. Los cursos se habilitarán una vez que el administrador confirme tu pago (1–24h hábiles).
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-1.5"
                            onClick={() => setActiveTab('pagos')}
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Ver instrucciones de pago
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Banner examen de inglés pendiente (asignado por admin) ── */}
                  {studentProfile?.onboarding_step === 'english_test' && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50/60 p-5 shadow-sm mb-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-400" />
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">🧪</div>
                        <div className="flex-1">
                          <p className="font-extrabold text-orange-900 text-base">¡Examen de nivel pendiente!</p>
                          <p className="text-sm text-orange-800 mt-1 mb-3">Para desbloquear tus cursos necesitas completar el examen de inglés. El sistema asignará tu nivel automáticamente al terminar.</p>
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-1.5 font-bold"
                            onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                          >
                            🎓 Tomar examen ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Level not set warning — solo si NO tiene examen pendiente (ese tiene su propio banner) */}
                  {studentProfile && !studentProfile.english_level && !isTrial7 && subscription?.account_enabled === true && !isPendingPayment && studentProfile?.onboarding_step !== 'english_test' && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-amber-800">Cursos bloqueados</p>
                          <p className="text-sm text-amber-700 mt-1">Debes seleccionar tu nivel de inglés para desbloquear los cursos. Puedes hacer el <strong>examen de nivel</strong> o <strong>elegir directamente</strong>.</p>
                          <Button
                            size="sm"
                            className="mt-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-1.5"
                            onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                          >
                            <FlaskConical className="w-3.5 h-3.5" /> Definir mi nivel ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estado de carga / vacío — mutuamente excluyentes */}
                  {(coursesLoading || profileLoading) ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm">Cargando cursos...</p>
                    </div>
                  ) : dbCourses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No hay cursos disponibles aún.</p>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {dbCourses.map((course) => {
                      const colors = LEVEL_COLORS[course.level] || LEVEL_COLORS['A1'];
                      const isOpen = expandedCourse === course.id;
                      const units = courseUnits[course.id] || [];
                      // isCourseVisible ya contiene TODA la lógica (grant, revoke, trial, plan, nivel)
                      const isVisible = isCourseVisible(course);
                      const isLocked = !isVisible;
                      const requiredLevel = course.required_level || course.level;
                      const courseIdx = LEVEL_ORDER.indexOf(requiredLevel);
                      const prevLevel = courseIdx > 0 ? LEVEL_ORDER[courseIdx - 1] : null;
                      return (
                        <div key={course.id} className={`rounded-2xl border-2 overflow-hidden bg-gradient-to-br ${colors.color} ${isLocked ? 'opacity-60' : ''}`}>
                          {/* Course header */}
                          <button
                            type="button"
                            onClick={() => !isLocked && toggleCourse(course.id)}
                            className={`w-full flex items-start gap-3 p-5 text-left transition-colors ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/5'}`}
                          >
                            <span className={`text-3xl ${isLocked ? 'grayscale opacity-50' : ''}`}>{course.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge} inline-block`}>{course.level}</span>
                                {isLocked && prevLevel && (
                                  <span className="text-xs text-muted-foreground">🔒 Completa {prevLevel} primero</span>
                                )}
                              </div>
                              <h3 className="font-bold text-sm leading-snug">{course.title}</h3>
                              <p className="text-xs text-muted-foreground">{course.total_units} unidades</p>
                            </div>
                            {isLocked
                              ? <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                              : isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                          </button>

                          {/* Units list */}
                          {isOpen && (
                            <div className="bg-background/80 border-t border-border/50 p-4 space-y-2">
                              {loadingUnits === course.id && (
                                <p className="text-xs text-center text-muted-foreground py-3">Cargando unidades...</p>
                              )}
                              {loadingUnits !== course.id && units.length === 0 && (
                                <p className="text-xs text-center text-muted-foreground py-3">No hay unidades publicadas aún en este curso</p>
                              )}
                              {units.map(unit => {
                                const unitProg = unitProgressMap[unit.id] || 0;
                                const totalStages = unitStageTotalMap[unit.id] || 5;
                                const progPct = Math.min(100, Math.round((unitProg / totalStages) * 100));
                                const isCompleted = unitProg >= totalStages;

                                // ── Lógica de bloqueo por unidad ──
                                // Si el curso tiene grants individuales de unidades, solo las unidades
                                // con grant explícito están desbloqueadas; las demás quedan bloqueadas.
                                const isUnitLocked = (() => {
                                  if (profileLoading) return false;
                                  // Revocación explícita de esta unidad
                                  if (revokedModuleIds.includes(unit.id)) return true;
                                  // Grant explícito de esta unidad
                                  if (grantedUnitIds.includes(unit.id)) return false;
                                  // El curso usa modelo de grants por unidad → esta unidad no está concedida
                                  if (courseIdsWithUnitGrants.includes(course.id)) return true;
                                  // Sin modelo de unidades individuales → acceso completo al curso
                                  return false;
                                })();

                                return (
                                <div
                                  key={unit.id}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card transition-all text-left ${isUnitLocked ? 'opacity-50' : ''}`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isUnitLocked ? 'bg-muted' : isCompleted ? 'bg-green-100' : 'bg-primary/10'
                                  }`}>
                                    {isUnitLocked
                                      ? <Lock className="w-4 h-4 text-muted-foreground" />
                                      : isCompleted
                                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        : <BookOpen className="w-4 h-4 text-primary" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{unit.title}</p>
                                    {!isUnitLocked && unitProg > 0 ? (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progPct}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{unitProg}/{totalStages}</span>
                                      </div>
                                    ) : (
                                      unit.description && <p className="text-xs text-muted-foreground truncate">{unit.description}</p>
                                    )}
                                  </div>
                                  {isUnitLocked ? (
                                    /* Unidad bloqueada */
                                    <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground cursor-not-allowed">
                                      <Lock className="w-3 h-3" /> Bloqueada
                                    </div>
                                  ) : isCompleted ? (
                                    /* Unidad completada: botón repasar */
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setViewerUnit({ id: unit.id, title: unit.title, description: unit.description, isReview: true })}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                                      >
                                        <History className="w-3 h-3" />
                                        Repasar
                                      </button>
                                    </div>
                                  ) : (
                                    /* Unidad en progreso o sin empezar: botón único */
                                    <button
                                      type="button"
                                      onClick={() => setViewerUnit({ id: unit.id, title: unit.title, description: unit.description })}
                                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                      {unitProg > 0 ? 'Continuar' : 'Comenzar'}
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ─── SESIÓN CON PROFESOR ─── */}
              {activeTab === 'sesion' && (
                <motion.div key="sesion" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Sesión con el Profesor 🎓</h1>
                    <p className="text-muted-foreground text-sm">Reserva una clase 1 a 1 personalizada con el profesor.</p>
                  </div>

                  {/* ── MI SESIÓN RESERVADA ── */}
                  {myBookedSlot === 'loading' ? (
                    <div className="rounded-2xl border border-border/50 p-4 animate-pulse bg-card h-20" />
                  ) : myBookedSlot !== null ? (
                    <div className={`rounded-2xl border-2 p-5 ${
                      myBookedSlot.status === 'confirmed'
                        ? 'border-green-300 bg-green-50/60 dark:bg-green-900/10'
                        : 'border-amber-300 bg-amber-50/60 dark:bg-amber-900/10'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                          myBookedSlot.status === 'confirmed' ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          {myBookedSlot.status === 'confirmed' ? '✅' : '⏳'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              myBookedSlot.status === 'confirmed'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}>
                              {myBookedSlot.status === 'confirmed' ? '✓ Sesión confirmada' : '⏳ Solicitud pendiente'}
                            </span>
                          </div>
                          <p className="font-bold text-sm">
                            {(() => {
                              const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                              const [y,m,d] = myBookedSlot.date.split('-');
                              return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
                            })()}
                            {' · '}
                            {myBookedSlot.start_time.slice(0,5)} – {myBookedSlot.end_time.slice(0,5)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Prof. {myBookedSlot.teacher_name}</p>
                          {myBookedSlot.session_topic && (
                            <p className="text-xs mt-1 text-muted-foreground">📚 {myBookedSlot.session_topic}</p>
                          )}
                          <p className={`text-xs mt-2 font-medium ${
                            myBookedSlot.status === 'confirmed' ? 'text-green-700' : 'text-amber-700'
                          }`}>
                            {myBookedSlot.status === 'confirmed'
                              ? '🎉 ¡Tu clase está lista! Te enviaremos el link de videollamada poco antes de la sesión.'
                              : '📧 Tu solicitud está siendo revisada. Recibirás un correo cuando sea confirmada.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Info notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
                    <p className="font-bold mb-1">📌 Importante sobre las sesiones</p>
                    <p>Las sesiones con el profesor <strong>no reemplazan</strong> tu aprendizaje en la plataforma. Son un complemento para <strong>explicar un tema</strong> específico o <strong>practicar speaking</strong> en vivo. Sigue avanzando en tus cursos para sacar el mayor provecho.</p>
                  </div>

                  {/* Header banner */}
                  <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 pt-6 pb-10">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                      <div className="relative flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden shrink-0 shadow-lg">
                          <img src={IMAGES.INSTRUCTOR_NOBG} alt="Profesor" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">✨ Clases 1 a 1</span>
                          </div>
                          <h2 className="font-extrabold text-xl leading-tight">Sesión con el profesor</h2>
                          <p className="text-white/80 text-sm mt-0.5">Personalizada · $14 USD / sesión</p>
                        </div>
                      </div>
                      <div className="relative flex flex-wrap gap-2 mt-4">
                        {['🎯 Conversación', '📝 Gramática', '🗣️ Pronunciación'].map(tag => (
                          <span key={tag} className="text-xs bg-white/15 border border-white/20 text-white px-2.5 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Horarios disponibles */}
                    <div className="-mt-5 mx-4 mb-4 bg-background rounded-2xl border border-border/50 shadow-md p-5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                        Horarios disponibles
                      </p>

                      {slotsLoading ? (
                        <div className="space-y-3">
                          {[1,2,3].map(i => (
                            <div key={i} className="animate-pulse rounded-2xl border border-border/40 p-4 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-36 bg-muted rounded-full" />
                                <div className="h-3 w-52 bg-muted rounded-full" />
                              </div>
                              <div className="w-20 h-8 bg-muted rounded-xl shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : scheduleSlots.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-semibold text-sm">No hay clases disponibles en este momento</p>
                          <p className="text-xs mt-1">Pronto agregaremos nuevos horarios. ¡Vuelve a revisar!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {scheduleSlots.map(slot => {
                            const isBooked = bookedSlotIds.has(slot.id);
                            const isBooking = bookingSlotId === slot.id;
                            const noSpots = slot.available_spots <= 0;
                            const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                            const [y, m, d] = slot.date.split('-');
                            const dateLabel = `${d} ${months[parseInt(m)-1]} ${y}`;
                            const timeLabel = `${slot.start_time.slice(0,5)} – ${slot.end_time.slice(0,5)}`;

                            return (
                              <motion.div
                                key={slot.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                                  isBooked
                                    ? 'border-green-200 bg-green-50/60'
                                    : noSpots
                                    ? 'border-border/30 bg-muted/30 opacity-60'
                                    : 'border-border/60 bg-background hover:border-primary/30 hover:shadow-sm'
                                }`}
                              >
                                {/* Ícono fecha */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  isBooked ? 'bg-green-100' : 'bg-primary/10'
                                }`}>
                                  {isBooked
                                    ? <Check className="w-5 h-5 text-green-600" />
                                    : <Calendar className="w-5 h-5 text-primary" />
                                  }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm leading-tight">{dateLabel} · {timeLabel}</p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="w-3 h-3" />{slot.teacher_name}
                                    </span>
                                    <span className={`text-xs font-medium flex items-center gap-1 ${
                                      slot.available_spots <= 2 ? 'text-amber-600' : 'text-muted-foreground'
                                    }`}>
                                      <Users className="w-3 h-3" />
                                      {noSpots ? 'Sin cupos' : `${slot.available_spots} cupo${slot.available_spots !== 1 ? 's' : ''}`}
                                    </span>
                                  </div>
                                </div>

                                {/* Botón */}
                                {isBooked ? (
                                  <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-xl shrink-0">
                                    ✓ Reservado
                                  </span>
                                ) : noSpots ? (
                                  <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-xl shrink-0">
                                    Sin cupos
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setBookingModalSlot(slot);
                                      setBookingFormTopic('');
                                      setBookingSuccess(false);
                                      setBookingError('');
                                    }}
                                    className="rounded-xl shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs px-4"
                                  >
                                    Reservar
                                  </Button>

                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground text-center mt-5">
                        💳 El pago se coordina por correo · $50,000 COP / sesión
                      </p>
                    </div>
                  </div>

                  {/* ── CLASES VIRTUALES PERSONALIZADAS MENSUALES ── */}
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
                        📅
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-base text-foreground mb-1">
                          Arma tu plan mensual
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          ¿Quieres un plan mensual fijo? Elige tus días, horario y frecuencia semanal. Nosotros te asignamos el mismo horario todos los meses.
                        </p>
                        <Button
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 h-auto"
                          onClick={() => setShowClasesModal(true)}
                        >
                          Solicitar plan mensual →
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── CUENTA ─── */}
              {activeTab === 'cuenta' && (
                <motion.div key="cuenta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Mi Cuenta 👤</h1>
                    <p className="text-muted-foreground text-sm">Tu información personal y configuración.</p>
                  </div>

                  {/* Profile summary card */}
                  {profileLoading ? (
                    <div className="bg-gradient-to-br from-primary/5 to-background rounded-2xl border border-primary/20 p-5 shadow-sm animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 rounded bg-primary/20 w-3/5" />
                          <div className="h-3 rounded bg-muted w-2/5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/5 via-violet-50/50 to-background rounded-2xl border border-primary/20 p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-extrabold shadow-md shrink-0">
                        {(profileForm.name || userName || 'E').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-lg leading-tight">{profileForm.name || userName || 'Estudiante'}</p>
                          {studentProfile?.english_level && (
                            <span className="text-xs font-extrabold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                              Nivel {studentProfile.english_level}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{currentEmail}</p>
                        {/* Personal details row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {studentProfile?.birthday && (() => {
                            const birth = new Date(studentProfile.birthday!);
                            const today = new Date();
                            let age = today.getFullYear() - birth.getFullYear();
                            const m = today.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                            return (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {birth.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} · {age} años
                              </span>
                            );
                          })()}
                          {(studentProfile?.country || studentProfile?.city) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {[studentProfile.city, studentProfile.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                          {studentProfile?.education_level && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GraduationCap className="w-3 h-3" />
                              {{ bachiller: 'Bachiller', universitario: 'Universitario', posgrado: 'Posgrado', trabajo: 'Laboral', otro: 'Otro' }[studentProfile.education_level] || studentProfile.education_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {/* Edición directa de datos personales */}
                  {profileLoading ? (
                    <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm animate-pulse">
                      <div className="h-5 rounded bg-muted w-2/5 mb-4" />
                      <div className="space-y-3">
                        <div className="h-10 rounded-xl bg-muted" />
                        <div className="h-10 rounded-xl bg-muted" />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-10 rounded-xl bg-muted" />
                          <div className="h-10 rounded-xl bg-muted" />
                        </div>
                        <div className="h-10 rounded-xl bg-muted" />
                        <div className="h-10 rounded-xl bg-muted" />
                      </div>
                    </div>
                  ) : (
                  <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Editar información personal
                    </h2>
                    <form onSubmit={handleProfileSave} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-name" className="text-sm font-medium">Nombre completo</Label>
                        <Input
                          id="prof-name"
                          type="text"
                          placeholder="Tu nombre completo"
                          value={profileForm.name}
                          onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="prof-country" className="text-sm font-medium">País</Label>
                          <Input
                            id="prof-country"
                            type="text"
                            placeholder="Ej: Colombia"
                            value={profileForm.country}
                            onChange={e => setProfileForm(p => ({ ...p, country: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="prof-city" className="text-sm font-medium">Ciudad</Label>
                          <Input
                            id="prof-city"
                            type="text"
                            placeholder="Ej: Bogotá"
                            value={profileForm.city}
                            onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prof-birthday" className="text-sm font-medium">Fecha de nacimiento</Label>
                        <Input
                          id="prof-birthday"
                          type="date"
                          value={profileForm.birthday}
                          onChange={e => setProfileForm(p => ({ ...p, birthday: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      {profileSaved && (
                        <p className="text-sm text-green-600 font-medium text-center">✓ Información actualizada correctamente</p>
                      )}
                      {profileSaveError && (
                        <p className="text-sm text-red-500 font-medium text-center">{profileSaveError}</p>
                      )}
                    </form>
                  </div>
                  )}

                  {/* Change password */}
                  <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Cambiar contraseña</h2>
                    <form onSubmit={handlePwSave} className="space-y-4">
                      {/* Current password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-cur" className="text-sm font-medium">Contraseña actual</Label>
                        <div className="relative">
                          <Input
                            id="pw-cur"
                            type={showPw ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={pwForm.current}
                            onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                            className="rounded-xl pr-10"
                            required
                          />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* New password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-new" className="text-sm font-medium">Nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-new"
                            type={showNewPw ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={pwForm.newPw}
                            onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                            className="rounded-xl pr-10"
                            required
                            minLength={6}
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* Confirm new password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="pw-cfm" className="text-sm font-medium">Confirmar nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            id="pw-cfm"
                            type={showConfirmPw ? 'text' : 'password'}
                            placeholder="Repite tu nueva contraseña"
                            value={pwForm.confirm}
                            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                            className={`rounded-xl pr-10 ${
                              pwForm.confirm.length > 0
                                ? pwForm.confirm === pwForm.newPw
                                  ? 'border-green-400 focus-visible:ring-green-400'
                                  : 'border-destructive focus-visible:ring-destructive'
                                : ''
                            }`}
                            required
                          />
                          <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Inline feedback */}
                        {pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.newPw && (
                          <p className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Las contraseñas no coinciden
                          </p>
                        )}
                        {pwForm.confirm.length > 0 && pwForm.confirm === pwForm.newPw && (
                          <p className="flex items-center gap-1.5 text-xs text-green-600">
                            <Check className="w-3.5 h-3.5 shrink-0" /> ¡Las contraseñas coinciden!
                          </p>
                        )}
                      </div>
                      {pwError && (
                        <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{pwError}</span>
                        </div>
                      )}
                      <Button
                        type="submit"
                        variant="outline"
                        className="rounded-xl px-6 h-9 text-sm"
                        disabled={loading || (pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.newPw)}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Actualizando...
                          </span>
                        ) : pwSaved ? (
                          <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> ¡Contraseña actualizada!</span>
                        ) : 'Actualizar contraseña'}
                      </Button>
                    </form>
                  </div>

                </motion.div>
              )}

              {/* ─── PAGOS ─── */}
              {activeTab === 'pagos' && (
                <motion.div key="pagos" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Pagos y Suscripción 💳</h1>
                    <p className="text-muted-foreground text-sm">Gestiona tu plan y tus pagos.</p>
                  </div>

                  {/* ── BANNER EXAMEN DE INGLÉS (cuando admin asignó "Ninguna") ── */}
                  {studentProfile?.onboarding_step === 'english_test' && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50/60 p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-400" />
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">🧪</div>
                        <div className="flex-1">
                          <h3 className="font-extrabold text-orange-900 text-base mb-1">🎓 Examen de nivel pendiente</h3>
                          <p className="text-sm text-orange-800 mb-4">
                            Para activar tus cursos necesitas completar el examen de inglés. El sistema asignará tu nivel automáticamente al terminar.
                          </p>
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-1.5 font-bold w-full sm:w-auto"
                            onClick={() => { setOnboardingInitialStep('welcome'); setShowLevelOnboarding(true); }}
                          >
                            🎓 Tomar examen ahora
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════════════════════════════
                       BLOQUE DE PAGOS — estado derivado de student_profiles + subscriptions
                       Fuentes de verdad (BD real):
                         student_profiles.account_status: 'pending'|'trial'|'active'|'disabled'|'cancelled'
                         student_profiles.account_enabled: boolean
                         student_profiles.onboarding_step: 'pending_plan'|'english_test'|'completed'
                         subscriptions.status / plan_slug
                  ════════════════════════════════════════════════════════════ */}
                  {(() => {
                    const sub = subscription;
                    const prof = studentProfile; // ← datos reales de la BD
                    const now = new Date();

                    // ─── Estado explícito derivado de la BD ───
                    type EstadoUsuario =
                      | 'primer_registro'    // nuevo: onboarding_step='pending_plan', sin sub
                      | 'prueba_activa'      // account_status='trial', trial no vencido
                      | 'prueba_finalizada'  // trial vencido / status='cancelled'
                      | 'pendiente_pago'     // envió comprobante, admin revisando
                      | 'deshabilitado'      // admin deshabilitó (account_enabled=false)
                      | 'free_admin'         // admin dio acceso gratuito
                      | 'activo_cancelado'   // plan de pago cancelado pero aún dentro del período
                      | 'activo';            // pago aprobado, acceso completo

                    const getEstado = (): EstadoUsuario => {
                      // ═══════════════════════════════════════════════════════
                      // FUENTE DE VERDAD: student_profiles.account_status
                      // ─────────────────────────────────────────────────────
                      // Valores posibles:
                      //   'pending'         → nunca envió solicitud (recién registrado)
                      //   'pending_payment' → envió solicitud, admin revisando
                      //   'active_trial'    → admin activó prueba de 7 días
                      //   'expired_trial'   → prueba terminada
                      //   'active'          → pago confirmado, acceso completo
                      //   'disabled'        → admin deshabilitó manualmente
                      //   'cancelled'       → cancelado
                      // ═══════════════════════════════════════════════════════

                      // P1: Explícitamente deshabilitado (solo si admin lo marcó)
                      if (prof?.account_status === 'disabled') return 'deshabilitado';
                      if (prof?.account_status === 'cancelled') return 'prueba_finalizada';

                      // P2: Acceso gratuito de admin
                      if (sub?.plan_slug === 'free_admin' && sub?.status === 'active') return 'free_admin';

                      // P3: Trial activo — va ANTES de 'activo' para no ser tapado por sub.status='active'
                      // (El edge function activate_plan solía hardcodear status='active' para trials)
                      // isTrialSub: solo es trial si el status NO es cancelled/pending_approval/pending
                      // (evita que un free_trial cancelado o con pago pendiente active la lógica de trial)
                      const isTrialActive = sub?.status === 'trial' || sub?.status === 'active';
                      const isTrialSub  = (sub?.plan_slug === 'free_trial' || sub?.status === 'trial')
                                         && isTrialActive;
                      const isTrialProf = prof?.account_status === 'active_trial' || prof?.trial_active === true;
                      if (isTrialSub || isTrialProf) {
                        const endDate = prof?.trial_end_date
                          ? new Date(prof.trial_end_date)
                          : sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;
                        if (endDate && endDate < now) return 'prueba_finalizada';
                        return 'prueba_activa';
                      }

                      // P3.5: Plan de pago cancelado pero dentro del período pagado
                      // (el estudiante sigue con acceso hasta current_period_end)
                      if (subStatus === 'cancelled' && !isTrialSub) {
                        const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
                        if (periodEnd && periodEnd > now) return 'activo_cancelado';
                      }

                      // P4: Cuenta activa confirmada (pago real, no trial)
                      if (prof?.account_status === 'active' && prof?.account_enabled === true) return 'activo';
                      if (sub?.status === 'active' && sub?.account_enabled === true) return 'activo';

                      // P5: Trial vencido
                      if (prof?.account_status === 'expired_trial') return 'prueba_finalizada';
                      if (sub?.status === 'cancelled') return 'prueba_finalizada';

                      // P6: Solicitud enviada — esperando confirmación del admin
                      if (prof?.account_status === 'pending_payment') return 'pendiente_pago';
                      if (sub?.status === 'pending_approval' || sub?.status === 'pending') return 'pendiente_pago';
                      // Legacy: 'pending' con suscripción = también esperando
                      if (prof?.account_status === 'pending' && sub !== null) return 'pendiente_pago';

                      // P7: Sin solicitud enviada → primer registro (fallback)
                      return 'primer_registro';
                    };

                    const estado = getEstado();
                    const fmt = (d: Date | null) => d ? d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
                    // trialEnd: usar trial_end_date del perfil (guardado al activar), luego sub, luego fallback
                    const trialEnd = prof?.trial_end_date
                      ? new Date(prof.trial_end_date)
                      : sub?.trial_ends_at
                        ? new Date(sub.trial_ends_at)
                        : prof?.created_at
                          ? new Date(new Date(prof.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
                          : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    // regDate: usar trial_start_date del perfil, luego sub.created_at
                    const regDate = prof?.trial_start_date
                      ? new Date(prof.trial_start_date)
                      : sub?.created_at
                        ? new Date(sub.created_at)
                        : prof?.created_at ? new Date(prof.created_at) : now;
                    const nextBilling = sub?.current_period_end ? new Date(sub.current_period_end) : null;
                    const onPay = (amount: number, _label: string) => { setPaypalModalAmount(amount); setShowPaypalModal(true); };

// ─── PRIMER_REGISTRO: nuevo estudiante — muestra 3 opciones inline ───
                    if (estado === 'primer_registro') {
                      return (
                        <div className="space-y-4">
                          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">👋</div>
                              <div>
                                <h2 className="font-extrabold text-lg mb-0.5">Elige tu plan</h2>
                                <p className="text-sm text-muted-foreground">Selecciona cómo quieres comenzar en BLANG English.</p>
                              </div>
                            </div>
                            <PlanPickerInline
                              defaultName={profileForm.name || userName || ''}
                              defaultEmail={currentEmail || ''}
                              userId={currentUserId}
                              onSuccess={async () => { if (currentUserId) await refreshProfile(currentUserId); }}
                            />
                          </div>
                        </div>
                      );
                    }

                    // ─── FREE_ADMIN: sin pagos ───
                    if (estado === 'free_admin') {
                      return (
                        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/40 p-8 flex flex-col items-center text-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl">🎁</div>
                          <div>
                            <h2 className="font-extrabold text-xl text-violet-900 mb-1">Sin pagos pendientes</h2>
                            <p className="text-sm text-violet-700">El administrador ha habilitado tu acceso de forma gratuita. No tienes ningún cobro pendiente.</p>
                          </div>
                          <span className="inline-block bg-violet-100 text-violet-700 font-bold text-sm px-4 py-2 rounded-full">✨ Acceso completo sin costo</span>
                        </div>
                      );
                    }

                    // ─── PRUEBA_ACTIVA: período de 7 días en curso ───
                    if (estado === 'prueba_activa') {
                      const cancelTrial = async () => {
                        if (!currentUserId) return;
                        try {
                          const { error } = await supabase.functions.invoke('save-onboarding-2026', {
                            body: { action: 'cancel_subscription', student_id: currentUserId },
                          });
                          if (error) throw error;
                        } catch {
                          await supabase.from('student_profiles').update({
                            trial_active: false, account_status: 'disabled', account_enabled: false,
                          }).eq('id', currentUserId);
                          await supabase.from('subscriptions').update({
                            trial_active: false, status: 'cancelled', account_enabled: false,
                          }).eq('student_id', currentUserId);
                        }
                        setSubscription(s => s ? { ...s, status: 'cancelled', account_enabled: false } : null);
                        setTrialCancelDone(true);
                        await refreshProfile(currentUserId);
                      };

                      return (
                        <div className="space-y-4">
                          {/* Banner prueba activa */}
                          <div className="rounded-2xl border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50/60 p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl shrink-0">🌱</div>
                              <div className="flex-1">
                                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-green-100 text-green-700 border border-green-200">
                                  ✅ Prueba activa
                                </span>
                                <h2 className="font-extrabold text-lg leading-snug mb-1">
                                  Tienes acceso completo hasta el{' '}
                                  <span className="text-green-700 underline decoration-dotted">{fmt(trialEnd)}</span>
                                </h2>
                                <p className="text-xs text-muted-foreground">Selecciona un plan para seguir aprendiendo al vencer</p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
                                <p className="text-xs text-muted-foreground mb-0.5">📅 Activación</p>
                                <p className="font-bold text-sm">{fmt(regDate)}</p>
                              </div>
                              <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
                                <p className="text-xs text-muted-foreground mb-0.5">⏰ Vencimiento</p>
                                <p className="font-bold text-sm text-green-700">{fmt(trialEnd)}</p>
                              </div>
                            </div>
                          </div>

                          {/* ── Vista: Acciones principales ── */}
                          {trialView === 'actions' && (
                            <div className="space-y-3">
                              <Button
                                className="w-full rounded-xl py-6 font-bold text-base bg-primary hover:bg-primary/90"
                                onClick={() => { setTrialView('plan'); setTrialPlan(null); }}
                              >
                                📋 Escoger plan
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full rounded-xl py-6 font-bold text-base border-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                                onClick={() => setTrialView('cancel')}
                              >
                                🚪 Cancelar suscripción — deshabilitar acceso
                              </Button>
                              <div className="text-center pt-1">
                                <button
                                  className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
                                  onClick={() => { setTrialView('delete_request'); setTrialDeleteSent(false); setTrialDeleteReason(''); }}
                                >
                                  🗑️ Solicitar eliminar cuenta
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ── Vista: Escoger plan ── */}
                          {trialView === 'plan' && (
                            <div className="space-y-4">
                              <button
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setTrialView('actions')}
                              >
                                ← Volver
                              </button>

                              {/* Selector de plan */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Plan Mensual */}
                                <button
                                  type="button"
                                  onClick={() => setTrialPlan('mensual')}
                                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                    trialPlan === 'mensual'
                                      ? 'border-primary bg-primary/5 shadow-md'
                                      : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                                  }`}
                                >
                                  <div className="text-2xl mb-2">🚀</div>
                                  <p className="font-bold text-sm">Plan Mensual</p>
                                  <p className="text-xl font-extrabold text-primary mt-1">$16 USD</p>
                                  <p className="text-xs text-muted-foreground">$60,000 COP / mes</p>
                                  {trialPlan === 'mensual' && (
                                    <span className="inline-block mt-2 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">✓ Seleccionado</span>
                                  )}
                                </button>

                                {/* Plan Trimestral */}
                                <button
                                  type="button"
                                  onClick={() => setTrialPlan('trimestral')}
                                  className={`rounded-2xl border-2 p-4 text-left transition-all relative ${
                                    trialPlan === 'trimestral'
                                      ? 'border-violet-500 bg-violet-50 shadow-md'
                                      : 'border-border/50 hover:border-violet-400 hover:bg-violet-50/50'
                                  }`}
                                >
                                  <span className="absolute top-2 right-2 text-[10px] font-extrabold bg-amber-400 text-black rounded-full px-2 py-0.5">⭐ Mejor valor</span>
                                  <div className="text-2xl mb-2">💎</div>
                                  <p className="font-bold text-sm">Plan Trimestral</p>
                                  <p className="text-xl font-extrabold text-violet-700 mt-1">$68 USD</p>
                                  <p className="text-xs text-muted-foreground">$250,000 COP / 3 meses</p>
                                  {trialPlan === 'trimestral' && (
                                    <span className="inline-block mt-2 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">✓ Seleccionado</span>
                                  )}
                                </button>
                              </div>

                              {/* Formulario según plan seleccionado */}
                              {trialPlan && (
                                <PagoSolicitudForm
                                  defaultName={profileForm.name || userName || ''}
                                  defaultEmail={currentEmail || ''}
                                  userId={currentUserId}
                                  planSlug={trialPlan === 'mensual' ? 'monthly' : 'trimestral'}
                                  planName={trialPlan === 'mensual' ? 'Plan Mensual' : 'Plan Trimestral'}
                                  planPrice={trialPlan === 'mensual' ? '$16 USD / $60,000 COP al mes' : '$68 USD / $250,000 COP por 3 meses'}
                                  planAmount={trialPlan === 'mensual' ? 16 : 68}
                                  onSuccess={async () => { if (currentUserId) await refreshProfile(currentUserId); }}
                                />
                              )}
                            </div>
                          )}

                          {/* ── Vista: Confirmar cancelación ── */}
                          {trialView === 'cancel' && (
                            <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-5 space-y-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                  <p className="font-bold text-destructive text-sm">¿Cancelar acceso?</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tu cuenta quedará <strong>deshabilitada inmediatamente</strong>. Perderás el acceso a todos los cursos hasta que realices un nuevo pago.
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1 rounded-xl"
                                  onClick={cancelTrial}
                                >
                                  Sí, cancelar y deshabilitar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 rounded-xl"
                                  onClick={() => setTrialView('actions')}
                                >
                                  No, mantener acceso
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* ── Vista: Solicitar eliminar cuenta ── */}
                          <DeleteAccountRequest
                            name={profileForm.name || userName || ''}
                            email={currentEmail || ''}
                            userId={currentUserId}
                            trialView={trialView}
                            setTrialView={setTrialView}
                            trialDeleteReason={trialDeleteReason}
                            setTrialDeleteReason={setTrialDeleteReason}
                            trialDeleteSent={trialDeleteSent}
                            setTrialDeleteSent={setTrialDeleteSent}
                            trialDeleteSending={trialDeleteSending}
                            setTrialDeleteSending={setTrialDeleteSending}
                          />
                        </div>
                      );
                    }

                    // ─── PRUEBA_FINALIZADA / cancelada ───
                    if (estado === 'prueba_finalizada') {
                      return (
                        <div className="space-y-4">
                          <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-400" />
                            <div className="flex items-center gap-3">
                              <span className="text-3xl shrink-0">⌛</span>
                              <div>
                                <p className="font-extrabold text-orange-900">Tu período de prueba ha terminado</p>
                                <p className="text-sm text-orange-800 mt-0.5">
                                  La prueba gratuita venció el <strong>{fmt(trialEnd)}</strong>. Elige un plan para continuar aprendiendo.
                                </p>
                              </div>
                            </div>
                          </div>
                          <PlanSelectorWithDelete
                            defaultName={profileForm.name || userName || ''}
                            defaultEmail={currentEmail || ''}
                            userId={currentUserId}
                            trialView={trialView} setTrialView={setTrialView}
                            trialPlan={trialPlan} setTrialPlan={setTrialPlan}
                            trialDeleteReason={trialDeleteReason} setTrialDeleteReason={setTrialDeleteReason}
                            trialDeleteSent={trialDeleteSent} setTrialDeleteSent={setTrialDeleteSent}
                            trialDeleteSending={trialDeleteSending} setTrialDeleteSending={setTrialDeleteSending}
                            onSuccess={async () => { if (currentUserId) await refreshProfile(currentUserId); }}
                          />
                        </div>
                      );
                    }

                    // ─── PENDIENTE_PAGO: envió solicitud, esperando link de pago del admin ───
                    if (estado === 'pendiente_pago') {
                      return (
                        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-6 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">⏳</div>
                            <div className="flex-1">
                              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-amber-100 text-amber-700">⏳ Solicitud en revisión</span>
                              <h2 className="font-extrabold text-xl mb-1">Tu solicitud está siendo revisada</h2>
                              <p className="text-sm text-muted-foreground mb-3">
                                En breve te enviaremos el link de pago a tu correo para completar tu inscripción.{sub?.plan_name ? <> Plan: <strong>{sub.plan_name}</strong>.</> : null}
                              </p>
                              <div className="bg-white/70 rounded-xl p-3 border border-amber-200/60">
                                <p className="text-xs text-muted-foreground mb-0.5">📅 Fecha de solicitud</p>
                                <p className="font-bold text-sm">{fmt(regDate)}</p>
                              </div>
                            </div>
                          </div>
                          <p className="mt-4 text-xs text-amber-700">¿Dudas? Escríbenos por WhatsApp al <strong>+57 323 640 5246</strong></p>
                        </div>
                      );
                    }

                    // ─── DESHABILITADO: cuenta desactivada (plan vencido o admin) ───
                    if (estado === 'deshabilitado') {
                      return (
                        <div className="space-y-4">
                          <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-red-400" />
                            <div className="flex items-center gap-3">
                              <span className="text-3xl shrink-0">🔒</span>
                              <div>
                                <p className="font-extrabold text-red-900">Tu cuenta está deshabilitada</p>
                                <p className="text-sm text-red-800 mt-0.5">
                                  {sub?.status === 'expired'
                                    ? `Tu plan venció el ${fmt(nextBilling)}. Elige un plan para reactivar el acceso.`
                                    : 'Elige un plan para reactivar tu acceso completo a todos los cursos.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          <PlanSelectorWithDelete
                            defaultName={profileForm.name || userName || ''}
                            defaultEmail={currentEmail || ''}
                            userId={currentUserId}
                            trialView={trialView} setTrialView={setTrialView}
                            trialPlan={trialPlan} setTrialPlan={setTrialPlan}
                            trialDeleteReason={trialDeleteReason} setTrialDeleteReason={setTrialDeleteReason}
                            trialDeleteSent={trialDeleteSent} setTrialDeleteSent={setTrialDeleteSent}
                            trialDeleteSending={trialDeleteSending} setTrialDeleteSending={setTrialDeleteSending}
                            onSuccess={async () => { if (currentUserId) await refreshProfile(currentUserId); }}
                          />
                        </div>
                      );
                    }

                    // ─── ACTIVO_CANCELADO: plan de pago cancelado pero dentro del período ───
                    if (estado === 'activo_cancelado') {
                      return (
                        <div className="space-y-4">
                          {/* Aviso de cancelación */}
                          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 flex items-start gap-3">
                            <span className="text-2xl shrink-0">⚠️</span>
                            <div>
                              <p className="font-bold text-amber-900 text-sm">Suscripción cancelada — acceso activo hasta el {fmt(nextBilling)}</p>
                              <p className="text-xs text-amber-800 mt-0.5">
                                Cancelaste tu plan pero sigues teniendo acceso completo hasta el vencimiento. Después de esa fecha tu cuenta quedará deshabilitada.
                              </p>
                            </div>
                          </div>

                          {/* Card info del plan */}
                          <div className="rounded-2xl border-2 border-border/50 bg-background p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex-1">
                                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-amber-100 text-amber-700 border border-amber-200">
                                  ⏳ Cancelado al vencimiento
                                </span>
                                <h2 className="font-extrabold text-xl text-foreground">{sub?.plan_name || 'Plan Mensual'}</h2>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-extrabold text-2xl text-foreground">${sub?.amount_usd}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sub?.plan_slug === 'trimestral' ? 'USD / 3 meses' : 'USD / mes'}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
                                <p className="text-xs text-muted-foreground mb-0.5">📅 Inicio</p>
                                <p className="font-bold text-sm">{fmt(regDate)}</p>
                              </div>
                              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60">
                                <p className="text-xs text-muted-foreground mb-0.5">📆 Acceso hasta</p>
                                <p className="font-bold text-sm text-amber-700">{fmt(nextBilling)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Opciones: reactivar o eliminar cuenta */}
                          <PlanSelectorWithDelete
                            defaultName={profileForm.name || userName || ''}
                            defaultEmail={currentEmail || ''}
                            userId={currentUserId}
                            trialView={trialView} setTrialView={setTrialView}
                            trialPlan={trialPlan} setTrialPlan={setTrialPlan}
                            trialDeleteReason={trialDeleteReason} setTrialDeleteReason={setTrialDeleteReason}
                            trialDeleteSent={trialDeleteSent} setTrialDeleteSent={setTrialDeleteSent}
                            trialDeleteSending={trialDeleteSending} setTrialDeleteSending={setTrialDeleteSending}
                            onSuccess={async () => { if (currentUserId) await refreshProfile(currentUserId); }}
                          />
                        </div>
                      );
                    }

                    // ─── ACTIVO: plan mensual activo ───
                    return (
                      <div className="space-y-4">
                        {/* Card principal: Plan activo */}
                        <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50/40 p-5 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1">
                              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 bg-green-100 text-green-700 border border-green-200">
                                ✅ Plan activo
                              </span>
                              <h2 className="font-extrabold text-xl text-green-900">{sub?.plan_name || 'Plan Mensual'}</h2>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-extrabold text-2xl text-green-800">${sub?.amount_usd}</p>
                              <p className="text-xs text-muted-foreground">
                                {sub?.plan_slug === 'trimestral' ? 'USD / 3 meses' : 'USD / mes'}
                              </p>
                            </div>
                          </div>
                          {/* Fechas y método */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
                              <p className="text-xs text-muted-foreground mb-0.5">📅 Fecha de inicio</p>
                              <p className="font-bold text-sm">{fmt(regDate)}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-3 border border-green-200/60">
                              <p className="text-xs text-muted-foreground mb-0.5">📆 Vence el</p>
                              <p className="font-bold text-sm text-green-700">{fmt(nextBilling)}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-3 border border-green-200/60 col-span-2 sm:col-span-1">
                              <p className="text-xs text-muted-foreground mb-0.5">💳 Método de pago</p>
                              <p className="font-bold text-sm capitalize">{sub?.payment_method?.replace('_', ' / ') || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Confirmación */}
                        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-green-900 text-sm">Pago confirmado — acceso completo habilitado</p>
                            <p className="text-xs text-green-700 mt-0.5">
                              Tienes acceso a todos los cursos y módulos de BLANG English. Al vencer tu plan,
                              encontrarás aquí el formulario de renovación.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

              {/* ── Historial de pagos ── */}
              {activeTab === 'pagos' && paymentHistory.length > 0 && (
                <div className="bg-background rounded-2xl border border-border/50 p-5 shadow-sm mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-base">Historial de pagos</h2>
                  </div>

                  {/* Tabla: visible en pantallas medianas+ */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40">
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">Fecha</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">Plan</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">Monto</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">Método</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {paymentHistory.map(item => {
                          const planName = item.notes?.match(/^(.+?)\s*[—–-]/)?.[1]?.trim()
                            || item.notes?.match(/Plan\s+\w+|7 días gratis/i)?.[0]
                            || '—';
                          const statusInfo =
                            item.event_type === 'payment_approved' ? { label: 'Aprobado', cls: 'bg-green-100 text-green-700' } :
                            item.event_type === 'payment_pending'  ? { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' } :
                            item.event_type === 'cancelled'        ? { label: 'Cancelado', cls: 'bg-red-100 text-red-700' } :
                                                                     { label: 'Registrado', cls: 'bg-muted text-muted-foreground' };
                          return (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-4 text-sm">
                                {new Date(item.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-2.5 pr-4 font-medium">{planName}</td>
                              <td className="py-2.5 pr-4 font-bold text-green-600">
                                {item.amount_usd > 0 ? `$${item.amount_usd} USD` : '—'}
                              </td>
                              <td className="py-2.5 pr-4 capitalize text-muted-foreground">
                                {item.payment_method && item.payment_method !== 'none' ? item.payment_method : '—'}
                              </td>
                              <td className="py-2.5">
                                <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${statusInfo.cls}`}>
                                  {statusInfo.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards: visible en móviles */}
                  <div className="sm:hidden space-y-2">
                    {paymentHistory.map(item => {
                      const planName = item.notes?.match(/^(.+?)\s*[—–-]/)?.[1]?.trim()
                        || item.notes?.match(/Plan\s+\w+|7 días gratis/i)?.[0]
                        || '—';
                      const statusInfo =
                        item.event_type === 'payment_approved' ? { label: 'Aprobado', cls: 'bg-green-100 text-green-700' } :
                        item.event_type === 'payment_pending'  ? { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' } :
                        item.event_type === 'cancelled'        ? { label: 'Cancelado', cls: 'bg-red-100 text-red-700' } :
                                                                 { label: 'Registrado', cls: 'bg-muted text-muted-foreground' };
                      return (
                        <div key={item.id} className="rounded-xl bg-muted/30 border border-border/30 p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{planName}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>{statusInfo.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>📅 {new Date(item.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            {item.amount_usd > 0 && <span className="font-bold text-green-600">${item.amount_usd} USD</span>}
                            {item.payment_method && item.payment_method !== 'none' && <span className="capitalize">{item.payment_method}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Cancelar suscripción (solo para plan activo, no cancelado) ── */}
              {activeTab === 'pagos' && subscription && subscription.status === 'active' && (
                <div className="bg-background rounded-2xl border border-destructive/20 p-6 shadow-sm mt-2 space-y-4">
                  <div>
                    <h2 className="font-bold text-base mb-1 text-destructive/80">⚠️ Cancelar suscripción</h2>
                    <p className="text-sm text-muted-foreground">
                      {subscription.current_period_end
                        ? <>Si cancelas, seguirás teniendo acceso completo hasta el <strong>{new Date(subscription.current_period_end).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>. Después tu cuenta quedará deshabilitada.</>
                        : <>Si cancelas, tu suscripción quedará cancelada al final del período actual.</>
                      }
                    </p>
                  </div>
                  {!cancelConfirm ? (
                    <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl text-sm" onClick={() => setCancelConfirm(true)}>
                      Cancelar suscripción
                    </Button>
                  ) : (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-destructive">¿Estás seguro/a de cancelar?</p>
                      <p className="text-xs text-muted-foreground">
                        {subscription.current_period_end
                          ? `Seguirás con acceso hasta el ${new Date(subscription.current_period_end).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}. Después tu cuenta quedará deshabilitada.`
                          : 'Tu suscripción quedará cancelada. Puedes reactivarla en cualquier momento.'
                        }
                      </p>
                      <div className="flex gap-3">
                        <Button variant="destructive" size="sm" className="rounded-xl text-xs" onClick={async () => {
                          if (currentUserId) {
                            try {
                              const { error } = await supabase.functions.invoke('save-onboarding-2026', {
                                body: { action: 'cancel_subscription', student_id: currentUserId },
                              });
                              if (error) throw error;
                            } catch {
                              await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('student_id', currentUserId);
                            }
                            setSubscription(s => s ? { ...s, status: 'cancelled' } : null);
                            await refreshProfile(currentUserId);
                          }
                          setCancelConfirm(false);
                        }}>Sí, cancelar suscripción</Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setCancelConfirm(false)}>No, mantener</Button>
                      </div>
                    </div>
                  )}

                </div>
              )}
                </motion.div>
              )}

              {/* ─── INGLÉS PARA EL MUNDO REAL (dentro de English for you!) ─── */}
              {activeTab === 'english' && showMundoReal && (() => {
                const topic = mundoRealTopic ? mergedMundoRealTopics.find(t => t.id === mundoRealTopic) : null;
                const categories = MR_CATEGORIES;
                const filtered = mergedMundoRealTopics.filter(t => {
                  const matchCat = mrCategoryFilter === 'Todos' || t.category === mrCategoryFilter;
                  const matchSearch = t.title.toLowerCase().includes(mrSearch.toLowerCase()) || t.category.toLowerCase().includes(mrSearch.toLowerCase());
                  return matchCat && matchSearch;
                });

                if (!topic) {
                  // ── LIST VIEW ──
                  return (
                    <motion.div key="mundo-real-list" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                      <button onClick={() => { setShowMundoReal(false); openMRTopic(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                        ← English for you!
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="w-6 h-6 text-primary" />
                          <h1 className="text-2xl md:text-3xl font-extrabold">Inglés para el Mundo Real</h1>
                        </div>
                        <p className="text-muted-foreground text-sm">Aprende inglés en situaciones cotidianas reales. Elige un tema y practica vocabulario, frases y conversaciones.</p>
                      </div>
                      {/* Search */}
                      <input
                        type="text"
                        placeholder="Buscar tema..."
                        value={mrSearch}
                        onChange={e => setMrSearch(e.target.value)}
                        className="w-full border border-border/60 bg-background rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      {/* Category filter */}
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setMrCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${mrCategoryFilter === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border/60 text-muted-foreground hover:border-primary/60'}`}
                          >{cat}</button>
                        ))}
                      </div>
                      {/* Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.map((t, i) => (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`rounded-2xl border border-border/50 bg-gradient-to-br ${t.cardBg} shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex gap-3 items-start`}
                            onClick={() => openMRTopic(t.id)}
                          >
                            <span className="text-3xl mt-0.5">{t.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.badge}`}>{t.category}</span>
                              <h3 className="font-bold text-sm mt-1 leading-snug">{t.title}</h3>
                            </div>
                            <button
                              className={`shrink-0 mt-1 px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r ${t.color} text-white shadow-sm`}
                              onClick={e => { e.stopPropagation(); openMRTopic(t.id); }}
                            >Explorar</button>
                          </motion.div>
                        ))}
                        {filtered.length === 0 && (
                          <p className="col-span-2 text-center text-muted-foreground text-sm py-8">No se encontraron temas.</p>
                        )}
                      </div>
                    </motion.div>
                  );
                }

                // ── DETAIL VIEW ──
                const tabs = [
                  { id: 'vocab',       label: '📖 Vocabulario' },
                  { id: 'frases',      label: '💬 Frases' },
                  ...(topic.expressions?.length  ? [{ id: 'expresiones', label: '🗣️ Expresiones' }] : []),
                  ...(topic.phrasalVerbs?.length  ? [{ id: 'phrasal',     label: '🔀 Phrasal Verbs' }] : []),
                  { id: 'estructura',  label: '🏗️ Estructura' },
                  { id: 'dialogo',     label: '🎭 Diálogo' },
                ] as const;

                const speak = (text: string) => {
                  const u = new SpeechSynthesisUtterance(text);
                  u.lang = 'en-US'; u.rate = 0.85;
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(u);
                };

                return (
                  <motion.div key={`mr-detail-${topic.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                    {/* Back + header */}
                    <div>
                      <button onClick={() => openMRTopic(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
                        ← Volver a temas
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{topic.emoji}</span>
                        <div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${topic.badge}`}>{topic.category}</span>
                          <h1 className="text-xl md:text-2xl font-extrabold mt-0.5">{topic.title}</h1>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex gap-2 flex-wrap">
                      {tabs.map(tb => (
                        <button
                          key={tb.id}
                          onClick={() => setMundoRealTab(tb.id)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${mundoRealTab === tb.id ? `bg-gradient-to-r ${topic.color} text-white shadow-sm` : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                        >{tb.label}</button>
                      ))}
                    </div>

                    {/* ── VOCABULARY TAB ── */}
                    {mundoRealTab === 'vocab' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
                          {topic.vocabulary.map((v, i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                              <button onClick={() => speak(v.word)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary" title="Escuchar">🔊</button>
                              <div className="flex-1">
                                <span className="font-bold text-base">{v.word}</span>
                                <span className="mx-2 text-muted-foreground">→</span>
                                <span className="text-muted-foreground text-sm">{v.translation}</span>
                                <p className="text-xs text-muted-foreground/80 italic mt-0.5">"{v.example}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Vocab exercise */}
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
                          <h3 className="font-bold text-sm">🎯 Ejercicio: ¿Cuál es la traducción?</h3>
                          {topic.vocabulary.map((v, i) => {
                            const key = `vocab-${i}`;
                            const chosen = mrAnswers[key];
                            const correct = v.options.indexOf(v.translation);
                            return (
                              <div key={key} className={`rounded-xl border p-3 ${chosen !== undefined ? (chosen === correct ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-red-400 bg-red-50 dark:bg-red-950/20') : 'border-border/40'}`}>
                                <p className="font-semibold text-sm mb-2">"{v.word}"</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {v.options.map((opt, oi) => (
                                    <button
                                      key={oi}
                                      disabled={chosen !== undefined}
                                      onClick={() => setMrAnswers(a => ({ ...a, [key]: oi }))}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        chosen !== undefined
                                          ? oi === correct ? 'bg-green-500 text-white border-green-500' : chosen === oi ? 'bg-red-400 text-white border-red-400' : 'bg-muted/40 text-muted-foreground border-border/40'
                                          : 'bg-background border-border/60 hover:border-primary/60 hover:bg-primary/5'
                                      }`}
                                    >{opt}</button>
                                  ))}
                                </div>
                                {chosen !== undefined && (
                                  <p className={`text-xs mt-1.5 font-semibold ${chosen === correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {chosen === correct ? '✅ ¡Correcto!' : `❌ Era: ${v.translation}`}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── PHRASES TAB ── */}
                    {mundoRealTab === 'frases' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
                          {topic.phrases.map((p, i) => (
                            <div key={i} className="p-4 flex gap-3 items-start">
                              <button onClick={() => speak(p.phrase.replace('___', p.missing))} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary mt-0.5" title="Escuchar">🔊</button>
                              <div>
                                <p className="font-bold text-sm">{p.phrase.replace('___', p.missing)}</p>
                                <p className="text-muted-foreground text-xs mt-0.5">{p.meaning}</p>
                                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Cuándo: {p.when}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Phrases exercise */}
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
                          <h3 className="font-bold text-sm">🎯 Ejercicio: Completa la frase</h3>
                          {topic.phrases.map((p, i) => {
                            const key = `phrase-${i}`;
                            const chosen = mrAnswers[key];
                            return (
                              <div key={key} className={`rounded-xl border p-3 ${chosen !== undefined ? (chosen === p.correct ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-red-400 bg-red-50 dark:bg-red-950/20') : 'border-border/40'}`}>
                                <p className="font-semibold text-sm mb-2">{p.phrase}</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {p.options.map((opt, oi) => (
                                    <button
                                      key={oi}
                                      disabled={chosen !== undefined}
                                      onClick={() => setMrAnswers(a => ({ ...a, [key]: oi }))}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        chosen !== undefined
                                          ? oi === p.correct ? 'bg-green-500 text-white border-green-500' : chosen === oi ? 'bg-red-400 text-white border-red-400' : 'bg-muted/40 text-muted-foreground border-border/40'
                                          : 'bg-background border-border/60 hover:border-primary/60 hover:bg-primary/5'
                                      }`}
                                    >{opt}</button>
                                  ))}
                                </div>
                                {chosen !== undefined && (
                                  <p className={`text-xs mt-1.5 font-semibold ${chosen === p.correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {chosen === p.correct ? '✅ ¡Correcto!' : `❌ Era: ${p.options[p.correct]}`}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── EXPRESIONES & IDIOMS TAB ── */}
                    {mundoRealTab === 'expresiones' && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
                          {(topic.expressions ?? []).map((e, i) => (
                            <div key={i} className="p-4 flex gap-3 items-start">
                              <button onClick={() => speak(e.expression)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary mt-0.5 shrink-0" title="Escuchar">🔊</button>
                              <div className="flex-1">
                                <p className="font-bold text-sm">"{e.expression}"</p>
                                <p className="text-muted-foreground text-xs mt-0.5">💡 {e.meaning}</p>
                                <p className="text-xs italic text-muted-foreground/80 mt-1 border-l-2 border-primary/30 pl-2">"{e.example}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Ejercicio: ¿Cuál es el significado? */}
                        {(topic.expressions ?? []).length > 0 && (
                          <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
                            <h3 className="font-bold text-sm">🎯 Ejercicio: ¿Qué significa esta expresión?</h3>
                            {(topic.expressions ?? []).map((e, i) => {
                              const key = `expr-${i}`;
                              const chosen = mrAnswers[key];
                              const allMeanings = (topic.expressions ?? []).map(x => x.meaning);
                              const opts = [...new Set([e.meaning, ...allMeanings.filter(m => m !== e.meaning).slice(0, 3)])].slice(0, 4);
                              const correct = opts.indexOf(e.meaning);
                              return (
                                <div key={key} className={`rounded-xl border p-3 ${chosen !== undefined ? (chosen === correct ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-red-400 bg-red-50 dark:bg-red-950/20') : 'border-border/40'}`}>
                                  <p className="font-semibold text-sm mb-2">"{e.expression}"</p>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {opts.map((opt, oi) => (
                                      <button key={oi} disabled={chosen !== undefined}
                                        onClick={() => setMrAnswers(a => ({ ...a, [key]: oi }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
                                          chosen !== undefined
                                            ? oi === correct ? 'bg-green-500 text-white border-green-500' : chosen === oi ? 'bg-red-400 text-white border-red-400' : 'bg-muted/40 text-muted-foreground border-border/40'
                                            : 'bg-background border-border/60 hover:border-primary/60 hover:bg-primary/5'
                                        }`}>{opt}</button>
                                    ))}
                                  </div>
                                  {chosen !== undefined && (
                                    <p className={`text-xs mt-1.5 font-semibold ${chosen === correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                      {chosen === correct ? '✅ ¡Correcto!' : `❌ Significado: ${e.meaning}`}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── PHRASAL VERBS TAB ── */}
                    {mundoRealTab === 'phrasal' && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm divide-y divide-border/40">
                          {(topic.phrasalVerbs ?? []).map((pv, i) => (
                            <div key={i} className="p-4 flex gap-3 items-start">
                              <button onClick={() => speak(pv.verb)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-primary mt-0.5 shrink-0" title="Escuchar">🔊</button>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-primary">{pv.verb}</span>
                                  <span className="text-muted-foreground text-xs">→</span>
                                  <span className="text-sm text-muted-foreground">{pv.meaning}</span>
                                </div>
                                <p className="text-xs italic text-muted-foreground/80 mt-1 border-l-2 border-primary/30 pl-2">"{pv.example}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Ejercicio: completar con phrasal verb correcto */}
                        {(topic.phrasalVerbs ?? []).length > 0 && (
                          <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
                            <h3 className="font-bold text-sm">🎯 Ejercicio: ¿Cuál es el significado?</h3>
                            {(topic.phrasalVerbs ?? []).map((pv, i) => {
                              const key = `pv-${i}`;
                              const chosen = mrAnswers[key];
                              const allMeanings = (topic.phrasalVerbs ?? []).map(x => x.meaning);
                              const opts = [...new Set([pv.meaning, ...allMeanings.filter(m => m !== pv.meaning).slice(0, 3)])].slice(0, 4);
                              const correct = opts.indexOf(pv.meaning);
                              return (
                                <div key={key} className={`rounded-xl border p-3 ${chosen !== undefined ? (chosen === correct ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-red-400 bg-red-50 dark:bg-red-950/20') : 'border-border/40'}`}>
                                  <p className="font-semibold text-sm mb-2 text-primary">"{pv.verb}"</p>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {opts.map((opt, oi) => (
                                      <button key={oi} disabled={chosen !== undefined}
                                        onClick={() => setMrAnswers(a => ({ ...a, [key]: oi }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-left ${
                                          chosen !== undefined
                                            ? oi === correct ? 'bg-green-500 text-white border-green-500' : chosen === oi ? 'bg-red-400 text-white border-red-400' : 'bg-muted/40 text-muted-foreground border-border/40'
                                            : 'bg-background border-border/60 hover:border-primary/60 hover:bg-primary/5'
                                        }`}>{opt}</button>
                                    ))}
                                  </div>
                                  {chosen !== undefined && (
                                    <p className={`text-xs mt-1.5 font-semibold ${chosen === correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                      {chosen === correct ? '✅ ¡Correcto!' : `❌ Significado: ${pv.meaning}`}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── STRUCTURE TAB ── */}
                    {mundoRealTab === 'estructura' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 space-y-3">
                          <h2 className="font-extrabold text-base">{topic.structure.title}</h2>
                          <p className="text-sm text-muted-foreground">{topic.structure.explanation}</p>
                          <div className="space-y-1.5">
                            {topic.structure.examples.map((ex, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button onClick={() => speak(ex)} className="text-primary hover:opacity-70 transition-opacity" title="Escuchar">🔊</button>
                                <p className="text-sm font-medium italic">"{ex}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Word order exercise */}
                        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
                          <h3 className="font-bold text-sm">🎯 Ejercicio: Ordena las palabras</h3>
                          <p className="text-xs text-muted-foreground">Forma la frase: <span className="font-semibold text-foreground">"{topic.structure.examples[2]}"</span></p>
                          {/* Available words */}
                          <div className="flex flex-wrap gap-2">
                            {topic.structure.words.filter(w => !mrWordOrder.includes(w) || topic.structure.words.filter(x => x === w).length > mrWordOrder.filter(x => x === w).length).map((w, i) => (
                              <button
                                key={`avail-${i}-${w}`}
                                disabled={mrWordSubmitted}
                                onClick={() => setMrWordOrder(o => [...o, w])}
                                className="px-3 py-1 rounded-lg border border-border/60 bg-background text-sm font-medium hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-40"
                              >{w}</button>
                            ))}
                          </div>
                          {/* Current order */}
                          <div className="min-h-[40px] flex flex-wrap gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 p-2">
                            {mrWordOrder.map((w, i) => (
                              <button
                                key={`order-${i}`}
                                disabled={mrWordSubmitted}
                                onClick={() => setMrWordOrder(o => { const n = [...o]; n.splice(i, 1); return n; })}
                                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${mrWordSubmitted ? (mrWordOrder.join(' ') === topic.structure.examples[2] ? 'bg-green-500 text-white border-green-500' : 'bg-red-400 text-white border-red-400') : 'bg-primary/10 text-primary border-primary/40 hover:bg-red-50 hover:border-red-300'}`}
                              >{w}</button>
                            ))}
                            {mrWordOrder.length === 0 && <span className="text-xs text-muted-foreground/60 self-center">Haz clic en las palabras para ordenarlas</span>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={mrWordOrder.length === 0 || mrWordSubmitted}
                              onClick={() => setMrWordSubmitted(true)}
                              className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40"
                            >Verificar</button>
                            <button
                              onClick={() => { setMrWordOrder([]); setMrWordSubmitted(false); }}
                              className="px-4 py-1.5 rounded-xl border border-border/60 text-xs font-medium hover:bg-muted"
                            >Reiniciar</button>
                          </div>
                          {mrWordSubmitted && (
                            <p className={`text-sm font-semibold ${mrWordOrder.join(' ') === topic.structure.examples[2] ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                              {mrWordOrder.join(' ') === topic.structure.examples[2] ? '✅ ¡Perfecto!' : `❌ La respuesta correcta es: "${topic.structure.examples[2]}"`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── DIALOGUE TAB ── */}
                    {mundoRealTab === 'dialogo' && (() => {
                      const bTurns = topic.dialogue.filter(l => l.speaker === 'B' && l.options);
                      const totalB = bTurns.length;
                      const answeredB = bTurns.filter((_, bi) => mrAnswers[`dial-${bi}`] !== undefined).length;
                      const allDone = answeredB === totalB;
                      let bIndex = 0;
                      return (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 space-y-3">
                            {topic.dialogue.map((line, li) => {
                              const isB = line.speaker === 'B';
                              const isInteractive = isB && line.options;
                              const thisBIdx = isInteractive ? bIndex++ : -1;
                              const key = `dial-${thisBIdx}`;
                              const chosen = mrAnswers[key];
                              const prevAnswered = thisBIdx === 0 || mrAnswers[`dial-${thisBIdx - 1}`] !== undefined;

                              if (isInteractive && !prevAnswered) return null;

                              return (
                                <div key={li} className={`flex ${isB ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] ${isB ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <span className="text-xs text-muted-foreground px-1">{isB ? 'Tú' : 'A'}</span>
                                    {!isInteractive ? (
                                      <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${isB ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                                        {line.text}
                                      </div>
                                    ) : chosen !== undefined ? (
                                      <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${chosen === line.correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'} rounded-br-sm`}>
                                        {line.options[chosen]}
                                        {chosen !== line.correct && <span className="block text-xs mt-0.5 opacity-80">✓ {line.options[line.correct]}</span>}
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {line.options.map((opt, oi) => (
                                          <button
                                            key={oi}
                                            onClick={() => setMrAnswers(a => ({ ...a, [key]: oi }))}
                                            className="block w-full text-left px-4 py-2 rounded-xl border border-border/60 bg-background text-sm hover:border-primary/60 hover:bg-primary/5 transition-all"
                                          >{opt}</button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {allDone && (
                            <div className="rounded-2xl border border-green-400 bg-green-50 dark:bg-green-950/20 p-4 text-center">
                              <p className="font-bold text-green-700 dark:text-green-400">
                                🎉 ¡Diálogo completado! Acertaste {bTurns.filter((t, bi) => mrAnswers[`dial-${bi}`] === t.correct).length} de {totalB} respuestas.
                              </p>
                              <button onClick={() => { const reset = {}; bTurns.forEach((_, bi) => { delete reset[`dial-${bi}`]; }); setMrAnswers(a => { const n = { ...a }; bTurns.forEach((_, bi) => delete n[`dial-${bi}`]); return n; }); }} className="mt-2 text-xs text-green-700 dark:text-green-400 underline">Intentar de nuevo</button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </motion.div>
                );
              })()}

              {/* ─── ENGLISH FOR YOU ─── */}
              {activeTab === 'english' && !showMundoReal && (
                <EnglishForYou onMundoReal={() => { setShowMundoReal(true); openMRTopic(null); }} onClasesEnVivo={() => setActiveTab('sesion')} />
              )}

              {/* ─── AYUDA ─── */}
              {activeTab === 'ayuda' && (
                <motion.div key="ayuda" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="mb-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">Ayuda & Soporte 💬</h1>
                    <p className="text-muted-foreground text-sm">Preguntas frecuentes sobre la plataforma.</p>
                  </div>

                  {/* Quick FAQs */}
                  <div className="bg-background rounded-2xl border border-border/50 p-6 shadow-sm">
                    <h2 className="font-bold text-base mb-4">❓ Preguntas frecuentes</h2>
                    <div className="space-y-2">
                      {FAQ_QUICK.map((faq, i) => (
                        <div key={i} className="border border-border/40 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-semibold hover:bg-muted/30 transition-colors"
                          >
                            <span>{faq.q}</span>
                            {openFaq === i ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                          </button>
                          <AnimatePresence>
                            {openFaq === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }} className="overflow-hidden"
                              >
                                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">{faq.a}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="mt-4 w-full rounded-xl text-sm border-primary/30 text-primary" onClick={() => navigate(ROUTE_PATHS.FAQ)}>
                      Ver todas las preguntas frecuentes →
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Unit viewer overlay */}
      {viewerUnit && (
        <UnitViewer
          unitId={viewerUnit.id}
          unitTitle={viewerUnit.title}
          unitDescription={viewerUnit.description}
          studentId={currentUserId}
          isReview={!!viewerUnit.isReview}
          studentPlanSlug={subscription?.plan_slug ?? ''}
          onClose={() => {
            const closingUnit = viewerUnit;
            setViewerUnit(null);
            // Actualizar progreso desde localStorage (fuente de verdad, siempre al día).
            // Antes se leía desde Supabase, que puede llegar tarde vs. el upsert de fondo.
            if (currentUserId && closingUnit?.id) {
              const prog = getUnitProgress(currentUserId, closingUnit.id);
              const stagesCompleted = Object.values(prog).filter((s: any) => s?.completed).length;
              setUnitProgressMap(prev => ({ ...prev, [closingUnit.id]: stagesCompleted }));
              // Actualizar también el contador global de unidades completadas
              const allProg = getAllProgressForStudent(currentUserId).filter(p => p.completed);
              const uniqueUnits = new Set(allProg.map(p => p.unitId));
              setRealCompletedUnits(uniqueUnits.size);
              setTotalUnitsCompleted(uniqueUnits.size);
            }
          }}
        />
      )}

      {/* Confirm dialog for data modifications */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(c => ({ ...c, open: false }))}
      />

      {/* OnboardingFlow — primer ingreso o cambio de plan */}
      {showLevelOnboarding && currentUserId && (
        <OnboardingFlow
          open={showLevelOnboarding}
          userId={currentUserId}
          userName={profileForm.name || userName || 'Estudiante'}
          userEmail={currentEmail}
          userCountry={studentProfile?.country || ''}
          userCity={studentProfile?.city || ''}
          userBirthdate={studentProfile?.birthday || ''}
          initialStep={onboardingInitialStep}
          hasPaidPlan={
            isProfileActive ||
            !!(subscription?.account_enabled === true &&
              subscription?.approved_by_admin === true &&
              subscription?.status !== 'cancelled' &&
              subscription?.status !== 'trial' &&
              subscription?.plan_slug !== 'free_trial')
          }
          onComplete={async () => {
            setShowLevelOnboarding(false);
            setOnboardingInitialStep('welcome');
            if (currentUserId) await refreshProfile(currentUserId);
          }}
          onOpenExam={() => {
            setShowLevelOnboarding(false);
            setShowLevelExam(true);
          }}
        />
      )}

      {/* LevelExam — examen de nivel real */}
      {showLevelExam && currentUserId && (
        <LevelExam
          open={showLevelExam}
          userId={currentUserId}
          onResult={async (_level, _accepted) => {
            setShowLevelExam(false);
            if (currentUserId) await refreshProfile(currentUserId);
          }}
          onClose={() => setShowLevelExam(false)}
        />
      )}

      {/* ── BOOKING CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {bookingModalSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget && !bookingSubmitting) { setBookingModalSlot(null); setBookingSuccess(false); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md overflow-hidden"
            >
              {bookingSuccess ? (
                /* ── SUCCESS STATE ── */
                <div className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl">✅</div>
                  <div>
                    <h3 className="font-extrabold text-lg mb-2">¡Solicitud enviada!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Estate pendiente de tu correo — te llegará el link de pago. Una vez realices el pago, agendaremos tu clase. 🎉
                    </p>
                  </div>
                  <Button
                    className="rounded-xl px-8 mt-2"
                    onClick={() => { setBookingModalSlot(null); setBookingSuccess(false); }}
                  >
                    Cerrar
                  </Button>
                </div>
              ) : (
                /* ── FORM STATE ── */
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-border/60">
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Confirmar reserva
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Revisa los datos y cuéntanos qué quieres practicar.</p>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Slot info (read-only) */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">
                          {(() => {
                            const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                            const [y,m,d] = bookingModalSlot.date.split('-');
                            return `${parseInt(d)} de ${months[parseInt(m)-1]} de ${y}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-3.5 h-3.5 shrink-0" />
                        {bookingModalSlot.start_time.slice(0,5)} – {bookingModalSlot.end_time.slice(0,5)} · Prof. {bookingModalSlot.teacher_name}
                      </div>
                    </div>

                    {/* Name (pre-filled, read-only) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nombre</Label>
                      <Input
                        value={profileForm.name || userName || 'Estudiante'}
                        readOnly
                        className="rounded-xl bg-muted/40 border-border/50 text-sm cursor-not-allowed"
                      />
                    </div>

                    {/* Email (pre-filled, read-only) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Correo</Label>
                      <Input
                        value={currentEmail || userEmail || ''}
                        readOnly
                        className="rounded-xl bg-muted/40 border-border/50 text-sm cursor-not-allowed"
                      />
                    </div>

                    {/* Topic */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        ¿Qué quieres estudiar en esta sesión? <span className="text-destructive">*</span>
                      </Label>
                      <textarea
                        value={bookingFormTopic}
                        onChange={e => setBookingFormTopic(e.target.value)}
                        placeholder="Ej: Verbos en pasado, pronunciación, vocabulario de negocios..."
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Error message */}
                    {bookingError && (
                      <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{bookingError}</span>
                      </div>
                    )}

                    {/* Resumen de pago */}
                    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 overflow-hidden">
                      <div className="px-4 py-3 border-b border-violet-200/70 flex items-center justify-between">
                        <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Resumen de pago</span>
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-violet-900">$14 USD</span>
                          <span className="text-xs text-violet-600 ml-1.5">/ $50.000 COP</span>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[11px] font-semibold text-violet-700 mb-2 uppercase tracking-wide">Selecciona tu método de pago</p>
                        <div className="flex items-center gap-2">
                          {/* PayPal */}
                          <button
                            type="button"
                            onClick={() => setBookingPaymentMethod(p => p === 'PayPal' ? '' : 'PayPal')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border-2 transition-all duration-150 shadow-sm ${
                              bookingPaymentMethod === 'PayPal'
                                ? 'bg-[#003087] border-[#003087] shadow-md scale-105'
                                : 'bg-white border-violet-200 hover:border-violet-400'
                            }`}
                          >
                            <span className={`text-sm font-extrabold`} style={{ color: bookingPaymentMethod === 'PayPal' ? '#ffffff' : '#003087' }}>Pay</span>
                            <span className={`text-sm font-extrabold`} style={{ color: bookingPaymentMethod === 'PayPal' ? '#93c5fd' : '#009cde' }}>Pal</span>
                          </button>
                          {/* Bold / PSE */}
                          <button
                            type="button"
                            onClick={() => setBookingPaymentMethod(p => p === 'Bold (PSE)' ? '' : 'Bold (PSE)')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border-2 transition-all duration-150 shadow-sm ${
                              bookingPaymentMethod === 'Bold (PSE)'
                                ? 'bg-gray-800 border-gray-800 shadow-md scale-105'
                                : 'bg-white border-violet-200 hover:border-violet-400'
                            }`}
                          >
                            <span className={`text-sm font-extrabold ${bookingPaymentMethod === 'Bold (PSE)' ? 'text-white' : 'text-gray-800'}`}>Bold</span>
                            <span className={`text-[10px] font-medium ${bookingPaymentMethod === 'Bold (PSE)' ? 'text-gray-300' : 'text-gray-400'}`}>(PSE)</span>
                          </button>
                        </div>
                        {bookingPaymentMethod && (
                          <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {bookingPaymentMethod} seleccionado
                          </p>
                        )}
                        <p className="text-[10px] text-violet-500 mt-1.5">
                          💬 Te enviaremos el link de pago después de confirmar tu reserva.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <Button
                        variant="outline"
                        className="rounded-xl flex-1"
                        onClick={() => { setBookingModalSlot(null); setBookingSuccess(false); setBookingError(''); setBookingPaymentMethod(''); }}
                        disabled={bookingSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="rounded-xl flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                        onClick={handleSubmitBooking}
                        disabled={bookingSubmitting || !bookingFormTopic.trim() || !bookingPaymentMethod}
                      >
                        {bookingSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Enviando...
                          </span>
                        ) : 'Enviar solicitud'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: CLASES VIRTUALES PERSONALIZADAS MENSUALES ── */}
      <ClasesVirtualesModal
        open={showClasesModal}
        onClose={() => setShowClasesModal(false)}
        defaultName={profileForm.name || userName || ''}
        defaultEmail={currentEmail || ''}
      />
    </div>
  );
}