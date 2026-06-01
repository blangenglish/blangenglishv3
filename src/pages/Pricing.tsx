// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Calendar, User, Mail, Phone, Clock, ChevronLeft, AlertCircle, BookOpen } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePricingPlans, useSiteSettings } from '@/hooks/useSupabaseData';
import type { DBPricingPlan } from '@/lib/admin';
import type { AuthModal } from '@/lib/index';
import { supabase } from '@/integrations/supabase/client';
import { ClasesVirtualesModal } from '@/components/ClasesVirtualesModal';
import { EmpresasPersonaModal, EmpresasCotizarModal } from '@/components/EmpresasModals';

interface PricingPageProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 30 } },
};

const PLAN_GRADIENTS: Record<string, string> = {
  prueba: 'from-green-50 to-emerald-50 border-green-200',
  mensual: 'from-primary/5 to-purple-50 border-primary/30',
  'clase-vivo': 'from-blue-50 to-indigo-50 border-blue-200',
};
const PLAN_BTN: Record<string, string> = {
  prueba: 'bg-green-500 hover:bg-green-600 text-white',
  mensual: 'bg-primary hover:bg-primary/90 text-primary-foreground',
  'clase-vivo': 'bg-blue-600 hover:bg-blue-700 text-white',
};

function PlanCard({ plan, onSelect, onMensualPlan }: { plan: DBPricingPlan; onSelect: () => void; onMensualPlan?: () => void }) {
  const features: string[] = Array.isArray(plan.features) ? (plan.features as string[]) : [];
  const isFree = plan.price_usd === 0;
  const gradient = PLAN_GRADIENTS[plan.slug] ?? 'from-muted/30 to-muted/10 border-border/50';
  const btnClass = PLAN_BTN[plan.slug] ?? 'bg-primary hover:bg-primary/90 text-primary-foreground';

  return (
    <motion.div variants={fadeUp} className="h-full">
      <div
        className={`relative h-full flex flex-col rounded-3xl border-2 bg-gradient-to-br ${gradient} p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
      >
        {plan.is_popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-primary/30">
              ⭐ Más Popular
            </span>
          </div>
        )}

        {plan.badge && (
          <div className="mb-3">
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
              {plan.badge}
            </span>
          </div>
        )}

        <div className="mb-6">
          <div className="text-4xl mb-3">{plan.emoji}</div>
          <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}

          <div className="mt-4">
            {isFree ? (
              <span className="text-4xl font-extrabold text-green-600">GRATIS</span>
            ) : (
              <div className="space-y-1">
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-extrabold">${plan.price_usd}</span>
                  <span className="text-muted-foreground mb-1.5 text-sm">USD/{plan.billing_period}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-foreground/70">
                    ${Number(plan.price_cop).toLocaleString('es-CO')}
                  </span>
                  <span className="text-muted-foreground text-sm">COP/{plan.billing_period}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <ul className="flex-1 space-y-3 mb-7">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground/80 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        <Button
          className={`w-full rounded-xl py-6 font-bold text-sm ${btnClass}`}
          onClick={onSelect}
        >
          {plan.cta_text} →
        </Button>

        {onMensualPlan && (
          <Button
            className="w-full rounded-xl py-5 font-bold text-sm mt-2 bg-violet-600 hover:bg-violet-700 text-white transition-all"
            onClick={onMensualPlan}
          >
            📅 Arma tu plan mensual
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function TrimestralPlanCard({ onSelect }: { onSelect: () => void }) {
  const features = [
    'Acceso completo a TODOS los cursos',
    'Módulos A1, A2, B1, B2, C1',
    'Práctica con IA para cada módulo de cada unidad (Speakology)',
    'Acceso completo a English for you: Fonética, Inglés para el Mundo Real, Escritura, Lectura, Gramática, Listening y Vocabulario',
    'Sin contratos anuales',
  ];
  return (
    <motion.div variants={fadeUp} className="h-full">
      <div className="relative h-full flex flex-col rounded-3xl border-2 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-300 p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-amber-400 text-black text-xs font-bold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            ⭐ Mejor valor
          </span>
        </div>

        <div className="mb-6 pt-2">
          <div className="text-4xl mb-3">💎</div>
          <h3 className="text-xl font-bold mb-1">Plan Trimestral</h3>
          <p className="text-sm text-muted-foreground">3 meses de acceso completo</p>
          <div className="mt-4 space-y-1">
            <div className="flex items-end gap-1.5">
              <span className="text-5xl font-extrabold">$60</span>
              <span className="text-muted-foreground mb-1.5 text-sm">USD / 3 meses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-foreground/70">$240,000</span>
              <span className="text-muted-foreground text-sm">COP / 3 meses</span>
            </div>
          </div>
        </div>

        <ul className="flex-1 space-y-3 mb-7">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-violet-700" />
              </div>
              <span className="text-sm text-foreground/80 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full rounded-xl py-6 font-bold text-sm bg-violet-600 hover:bg-violet-700 text-white"
          onClick={onSelect}
        >
          Inscribirme ahora →
        </Button>
      </div>
    </motion.div>
  );
}

function EmpresasPlanCard({
  onPersona,
  onCotizar,
}: {
  onPersona: () => void;
  onCotizar: () => void;
}) {
  const features = [
    'Acceso completo a TODOS los cursos',
    'Módulos A1, A2, B1, B2, C1',
    'Práctica con IA para cada módulo de cada unidad (Speakology)',
    'Acceso completo a English for you: Fonética, Inglés para el Mundo Real, Escritura, Lectura, Gramática, Listening y Vocabulario',
    'Sin contratos anuales',
    'Acceso exclusivo a módulos de inglés empresarial (B1, B2, C1): vocabulario, expresiones y contextos laborales',
  ];

  return (
    <motion.div variants={fadeUp} className="h-full">
      <div className="relative h-full flex flex-col rounded-3xl border-2 bg-gradient-to-br from-teal-50 to-emerald-50/60 border-teal-300 p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-teal-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            🏢 Para Empresas
          </span>
        </div>

        <div className="mb-6 pt-2">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-xl font-bold mb-1">Inglés para Empresas</h3>
          <p className="text-sm text-muted-foreground">3 meses de acceso completo</p>
          <div className="mt-4 space-y-1">
            <div className="flex items-end gap-1.5">
              <span className="text-5xl font-extrabold">$80</span>
              <span className="text-muted-foreground mb-1.5 text-sm">USD / 3 meses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-foreground/70">$300,000</span>
              <span className="text-muted-foreground text-sm">COP / por persona</span>
            </div>
          </div>
        </div>

        <ul className="flex-1 space-y-3 mb-7">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-teal-700" />
              </div>
              <span className="text-sm text-foreground/80 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* Dos botones */}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full rounded-xl py-5 font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white"
            onClick={onPersona}
          >
            Inscribirme como persona →
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl py-5 font-bold text-sm border-teal-400 text-teal-700 hover:bg-teal-50"
            onClick={onCotizar}
          >
            🏢 Cotizar para mi empresa →
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

const FAQ = [
  { q: '¿Cuánto cuesta después de los días gratis?', a: 'Solo $15 USD ó $55,000 COP al mes. Sin contratos ni compromisos.' },
  { q: '¿Cómo puedo pagar?', a: 'Aceptamos transferencia bancaria o pago por PayPal. Escríbenos y te indicamos el método más conveniente para ti.' },
  { q: '¿Puedo cancelar cuando quiera?', a: '¡Claro! No hay contratos ni compromisos. Cancelas cuando quieras desde tu perfil, sin cargos ocultos.' },
  { q: '¿Las sesiones en vivo son incluidas?', a: 'Las sesiones 1 a 1 son un complemento opcional por $10 USD ó $35,000 COP por sesión, independiente de tu suscripción mensual.' },
  { q: '¿Hay compromiso al empezar?', a: 'No. Los días de prueba son completamente gratis y sin ningún compromiso. Cancelas cuando quieras.' },
];

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
function formatTime(t: string) {
  if (!t) return '';
  const [h, min] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export default function PricingPage({ isLoggedIn = false, onOpenAuth, onLogout, userName }: PricingPageProps) {
  const { data: plans, loading } = usePricingPlans();
  const { data: settings } = useSiteSettings();

  const trialDays = settings?.trial_days ?? '7';

  const [showClasesModal, setShowClasesModal] = useState(false);
  const [showEmpresasPersona, setShowEmpresasPersona] = useState(false);
  const [showEmpresasCotizar, setShowEmpresasCotizar] = useState(false);

  // Slots booking modal state
  const [showSlots, setShowSlots] = useState(false);
  const [slotsStep, setSlotsStep] = useState<'list' | 'form' | 'success'>('list');
  const [pubSlots, setPubSlots] = useState<{ id: string; date: string; start_time: string; end_time: string; teacher_name: string }[]>([]);
  const [pubSlotsLoading, setPubSlotsLoading] = useState(false);
  const [selSlot, setSelSlot] = useState<{ id: string; date: string; start_time: string; end_time: string; teacher_name: string } | null>(null);
  const [pubForm, setPubForm] = useState({ name: '', email: '', phone: '', topic: '', paymentMethod: '' });
  const [pubSubmitting, setPubSubmitting] = useState(false);
  const [pubError, setPubError] = useState('');

  const openSlotBooking = async () => {
    setShowSlots(true);
    setSlotsStep('list');
    setSelSlot(null);
    setPubForm({ name: '', email: '', phone: '', topic: '', paymentMethod: '' });
    setPubError('');
    setPubSlotsLoading(true);
    const { data } = await supabase
      .from('schedule_slots')
      .select('id, date, start_time, end_time, teacher_name')
      .eq('status', 'available')
      .gt('available_spots', 0)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });
    setPubSlots(data ?? []);
    setPubSlotsLoading(false);
  };

  const handlePublicSubmit = async () => {
    if (!selSlot || !pubForm.name.trim() || !pubForm.email.trim() || !pubForm.topic.trim()) return;
    setPubSubmitting(true);
    setPubError('');
    try {
      const { data, error } = await supabase.rpc('book_schedule_slot', {
        p_slot_id: selSlot.id,
        p_student_name: pubForm.name.trim(),
        p_student_email: pubForm.email.trim(),
        p_topic: pubForm.topic.trim(),
        p_student_phone: pubForm.phone.trim(),
      });
      if (error || data?.error) {
        setPubError(data?.error || 'Ocurrió un error. Intenta de nuevo.');
        return;
      }
      supabase.functions.invoke('send-session-email', {
        body: {
          type: 'slot_booking',
          studentName: pubForm.name.trim(),
          studentEmail: pubForm.email.trim(),
          studentPhone: pubForm.phone.trim(),
          date: selSlot.date,
          startTime: selSlot.start_time,
          endTime: selSlot.end_time,
          teacherName: selSlot.teacher_name,
          topic: pubForm.topic.trim(),
          paymentMethod: pubForm.paymentMethod,
        },
      }).catch(() => {});
      setSlotsStep('success');
    } catch {
      setPubError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setPubSubmitting(false);
    }
  };

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>

      {/* PAGE BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/60 to-background pointer-events-none" />

      {/* HERO */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-primary" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.div variants={fadeUp} className="mb-5">
                <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-semibold px-4 py-2 rounded-full border border-white/20 backdrop-blur">
                  💰 Precios claros, sin sorpresas
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight">
                Elige tu plan y<br />
                <span className="text-amber-400">empieza hoy gratis</span> 🎉
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-white/80 max-w-xl mb-4">
                {trialDays} días de prueba gratis. Luego solo <strong className="text-white">$15 USD</strong> ó <strong className="text-white">$55,000 COP</strong> al mes.
              </motion.p>
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 bg-green-400/20 text-green-300 text-sm font-bold px-5 py-2 rounded-full border border-green-400/30">
                  ✅ {trialDays} días gratis · Sin compromisos · Cancela cuando quieras
                </span>
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="flex flex-col items-center gap-5">
              <div className="relative">
                <img
                  src={IMAGES.INSTRUCTOR_NOBG}
                  alt="Instructor BLANG"
                  className="w-56 h-56 md:w-72 md:h-72 object-contain"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.3))' }}
                />
                <motion.div
                  animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-2 -right-2 bg-white text-gray-900 rounded-2xl px-3 py-1.5 shadow-xl font-bold text-xs"
                >
                  💰 $15 USD / mes
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -left-2 bg-amber-400 text-black rounded-2xl px-3 py-1.5 shadow-xl font-extrabold text-xs"
                >
                  🎁 {trialDays} días GRATIS
                </motion.div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {[{e:'🎁',t:'Prueba Gratis'},{e:'🚀',t:'Plan Mensual'},{e:'💎',t:'Plan Trimestral'},{e:'🎥',t:'Clases Vivo'},{e:'🏢',t:'Para Empresas'}].map(({e,t}) => (
                  <div key={t} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-2 py-2.5 text-center">
                    <span className="text-xl block mb-0.5">{e}</span>
                    <p className="text-white/90 text-xs font-semibold leading-tight">{t}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="pb-20 -mt-4">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid sm:grid-cols-2 xl:grid-cols-5 gap-6 max-w-7xl mx-auto items-start"
              initial="hidden" animate="visible" variants={stagger}
            >
              {(plans ?? []).filter(p => p.is_published).flatMap((plan) => {
                const card = (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={plan.slug === 'clase-vivo' ? openSlotBooking : () => onOpenAuth?.('register')}
                    onMensualPlan={plan.slug === 'clase-vivo' ? () => setShowClasesModal(true) : undefined}
                  />
                );
                // Insertar Plan Trimestral justo después del plan mensual
                if (plan.slug === 'mensual') {
                  return [card, <TrimestralPlanCard key="trimestral" onSelect={() => onOpenAuth?.('register')} />];
                }
                return [card];
              })}

              {/* Plan Empresas — siempre visible, al final */}
              <EmpresasPlanCard
                onPersona={() => setShowEmpresasPersona(true)}
                onCotizar={() => setShowEmpresasCotizar(true)}
              />
            </motion.div>
          )}

          <motion.p
            className="text-center text-sm text-muted-foreground mt-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            ✅ {trialDays} días gratis &nbsp;·&nbsp; ✅ Sin compromisos &nbsp;·&nbsp; ✅ Sin contratos
          </motion.p>
        </div>
      </section>

      {/* HOW PAYMENT WORKS */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-3xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                💳 Pagos
              </span>
              <h2 className="text-3xl font-bold">¿Cómo funciona el pago?</h2>
              <p className="text-muted-foreground mt-2 text-sm">Proceso simple, sin sorpresas</p>
            </motion.div>
            <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5">
              {[
                { icon: '📝', step: '1', title: 'Regístrate gratis', desc: `Comienza con ${trialDays} días de acceso completo sin pagar nada.` },
                { icon: '💬', step: '2', title: 'Contáctanos', desc: 'Al terminar tu prueba, escríbenos y te indicamos cómo realizar el pago.' },
                { icon: '🚀', step: '3', title: 'Activa tu plan', desc: 'Confirmado el pago, activamos tu cuenta en máximo 24 horas hábiles.' },
              ].map(({ icon, step, title, desc }) => (
                <motion.div key={step} variants={fadeUp} className="bg-background border border-border/40 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mx-auto mb-3">{step}</div>
                  <div className="text-3xl mb-2">{icon}</div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                📧 Escríbenos a{' '}
                <a href="mailto:blangenglishlearning@blangenglish.com" className="text-primary font-semibold hover:underline">
                  blangenglishlearning@blangenglish.com
                </a>
                {' '}— respondemos en máximo 24 horas hábiles.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-2xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-3xl font-bold">Preguntas frecuentes</h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Accordion type="single" collapsible className="space-y-3">
                {FAQ.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-background border border-border/50 rounded-2xl px-6 shadow-sm"
                  >
                    <AccordionTrigger className="text-base font-semibold hover:no-underline py-5 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-500" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="max-w-2xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-5xl mb-4">🚀</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              ¡Empieza gratis hoy!
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-8">
              {trialDays} días gratis. Luego solo $15 USD o $55,000 COP al mes 🎊
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('register')}
              >
                Registrarse gratis 🎉
              </Button>
              <Button size="lg" variant="outline"
                className="border-white/40 text-white hover:bg-white/10 rounded-full px-10 py-6 text-lg"
                onClick={() => onOpenAuth?.('login')}
              >
                Ya tengo cuenta
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SLOTS BOOKING MODAL */}
      <AnimatePresence>
        {showSlots && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSlots(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative bg-background rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 rounded-t-3xl" />
              <div className="p-7">
                <button
                  onClick={() => setShowSlots(false)}
                  className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* STEP: success */}
                {slotsStep === 'success' && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h3>
                    <p className="text-muted-foreground mb-2">
                      Recibimos tu reserva. El profe revisará tu solicitud y te confirmaremos por correo.
                    </p>
                    {selSlot && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 mb-6 text-left">
                        <p className="font-semibold mb-1">📅 {formatDate(selSlot.date)}</p>
                        <p className="text-blue-600">{formatTime(selSlot.start_time)} – {formatTime(selSlot.end_time)}</p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setShowSlots(false);
                        setSlotsStep('list');
                        setSelSlot(null);
                        setPubForm({ name: '', email: '', phone: '', topic: '', paymentMethod: '' });
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                )}

                {/* STEP: list */}
                {slotsStep === 'list' && (
                  <div>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-extrabold mb-1">Reserva tu clase 🎥</h2>
                      <p className="text-sm text-muted-foreground">Selecciona un horario disponible</p>
                    </div>

                    {pubSlotsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                      </div>
                    ) : pubSlots.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="font-semibold text-muted-foreground">No hay clases disponibles en este momento</p>
                        <p className="text-sm text-muted-foreground mt-1">Pronto agregaremos nuevos horarios 😊</p>
                        <a
                          href="mailto:blangenglishlearning@blangenglish.com"
                          className="inline-block mt-4 text-blue-600 font-semibold text-sm hover:underline"
                        >
                          blangenglishlearning@blangenglish.com
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pubSlots.map((slot) => (
                          <button
                            key={slot.id}
                            className="w-full text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-400 rounded-2xl p-4 transition-all group"
                            onClick={() => { setSelSlot(slot); setSlotsStep('form'); }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-blue-900 capitalize text-sm">
                                  📅 {formatDate(slot.date)}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 text-blue-700 text-sm">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                </div>
                                <p className="text-xs text-blue-500 mt-0.5">👤 {slot.teacher_name}</p>
                              </div>
                              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full group-hover:bg-blue-700 transition-colors">
                                Reservar →
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP: form */}
                {slotsStep === 'form' && selSlot && (
                  <div>
                    <button
                      onClick={() => setSlotsStep('list')}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Volver a horarios
                    </button>

                    <div className="text-center mb-5">
                      <h2 className="text-2xl font-extrabold mb-1">Tus datos 📋</h2>
                      <p className="text-sm text-muted-foreground">Completa el formulario para reservar</p>
                    </div>

                    {/* Selected slot preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                      <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Horario seleccionado</p>
                      <p className="font-bold text-blue-900 capitalize text-sm">📅 {formatDate(selSlot.date)}</p>
                      <div className="flex items-center gap-1.5 text-blue-700 text-sm mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(selSlot.start_time)} – {formatTime(selSlot.end_time)}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pub-name" className="text-sm font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" /> Nombre completo
                        </Label>
                        <Input
                          id="pub-name"
                          placeholder="Tu nombre completo"
                          value={pubForm.name}
                          onChange={e => setPubForm(p => ({ ...p, name: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pub-email" className="text-sm font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary" /> Correo electrónico
                        </Label>
                        <Input
                          id="pub-email"
                          type="email"
                          placeholder="tucorreo@ejemplo.com"
                          value={pubForm.email}
                          onChange={e => setPubForm(p => ({ ...p, email: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pub-phone" className="text-sm font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" /> Teléfono / WhatsApp
                        </Label>
                        <Input
                          id="pub-phone"
                          type="tel"
                          placeholder="+57 300 000 0000"
                          value={pubForm.phone}
                          onChange={e => setPubForm(p => ({ ...p, phone: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pub-topic" className="text-sm font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> ¿Qué quieres estudiar?
                        </Label>
                        <Input
                          id="pub-topic"
                          placeholder="Ej: Conversación, Gramática, Pronunciación..."
                          value={pubForm.topic}
                          onChange={e => setPubForm(p => ({ ...p, topic: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>

                      {pubError && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {pubError}
                        </div>
                      )}

                      {/* Resumen de pago */}
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-blue-200/70 flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Resumen de pago</span>
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-blue-900">$10 USD</span>
                            <span className="text-xs text-blue-600 ml-1.5">/ $35.000 COP</span>
                          </div>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-[11px] font-semibold text-blue-700 mb-2 uppercase tracking-wide">Selecciona tu método de pago</p>
                          <div className="flex items-center gap-2">
                            {/* PayPal */}
                            <button
                              type="button"
                              onClick={() => setPubForm(p => ({ ...p, paymentMethod: p.paymentMethod === 'PayPal' ? '' : 'PayPal' }))}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border-2 transition-all duration-150 shadow-sm ${
                                pubForm.paymentMethod === 'PayPal'
                                  ? 'bg-[#003087] border-[#003087] shadow-md scale-105'
                                  : 'bg-white border-blue-200 hover:border-blue-400'
                              }`}
                            >
                              <span className={`text-sm font-extrabold ${pubForm.paymentMethod === 'PayPal' ? 'text-white' : ''}`} style={pubForm.paymentMethod === 'PayPal' ? {} : { color: '#003087' }}>Pay</span>
                              <span className={`text-sm font-extrabold ${pubForm.paymentMethod === 'PayPal' ? 'text-blue-200' : ''}`} style={pubForm.paymentMethod === 'PayPal' ? {} : { color: '#009cde' }}>Pal</span>
                            </button>
                            {/* Bold / PSE */}
                            <button
                              type="button"
                              onClick={() => setPubForm(p => ({ ...p, paymentMethod: p.paymentMethod === 'Bold (PSE)' ? '' : 'Bold (PSE)' }))}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border-2 transition-all duration-150 shadow-sm ${
                                pubForm.paymentMethod === 'Bold (PSE)'
                                  ? 'bg-gray-800 border-gray-800 shadow-md scale-105'
                                  : 'bg-white border-blue-200 hover:border-blue-400'
                              }`}
                            >
                              <span className={`text-sm font-extrabold ${pubForm.paymentMethod === 'Bold (PSE)' ? 'text-white' : 'text-gray-800'}`}>Bold</span>
                              <span className={`text-[10px] font-medium ${pubForm.paymentMethod === 'Bold (PSE)' ? 'text-gray-300' : 'text-gray-400'}`}>(PSE)</span>
                            </button>
                          </div>
                          {pubForm.paymentMethod && (
                            <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                              <Check className="w-3 h-3" /> {pubForm.paymentMethod} seleccionado
                            </p>
                          )}
                          <p className="text-[10px] text-blue-500 mt-1.5">
                            💬 Te enviaremos el link de pago después de confirmar tu reserva.
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6"
                        disabled={pubSubmitting || !pubForm.name.trim() || !pubForm.email.trim() || !pubForm.topic.trim() || !pubForm.paymentMethod}
                        onClick={handlePublicSubmit}
                      >
                        {pubSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                            Enviando...
                          </span>
                        ) : (
                          'Enviar solicitud 📅'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClasesVirtualesModal
        open={showClasesModal}
        onClose={() => setShowClasesModal(false)}
      />

      <EmpresasPersonaModal
        open={showEmpresasPersona}
        onClose={() => setShowEmpresasPersona(false)}
      />
      <EmpresasCotizarModal
        open={showEmpresasCotizar}
        onClose={() => setShowEmpresasCotizar(false)}
      />
    </Layout>
  );
}
