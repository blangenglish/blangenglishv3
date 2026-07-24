// @ts-nocheck
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePricingPlans, useSiteSettings } from '@/hooks/useSupabaseData';
import type { DBPricingPlan } from '@/lib/admin';
import type { AuthModal } from '@/lib/index';
import { ClasesVirtualesModal } from '@/components/ClasesVirtualesModal';
import { BeneficiosClasesModal } from '@/components/BeneficiosClasesModal';

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

function PlanCard({ plan, onSelect, onMensualPlan, onBeneficios }: { plan: DBPricingPlan; onSelect?: () => void; onMensualPlan?: () => void; onBeneficios?: () => void }) {
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
          <div className="mb-3">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
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

        {onSelect && (
          <Button
            className={`w-full rounded-xl py-6 font-bold text-sm ${btnClass}`}
            onClick={onSelect}
          >
            {plan.cta_text} →
          </Button>
        )}

        {onMensualPlan && (
          <Button
            className="w-full rounded-xl py-5 font-bold text-sm mt-2 bg-violet-600 hover:bg-violet-700 text-white transition-all"
            onClick={onMensualPlan}
          >
            📅 Arma tu plan mensual
          </Button>
        )}

        {onBeneficios && (
          <Button
            variant="outline"
            className="w-full rounded-xl py-5 font-bold text-sm mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 transition-all"
            onClick={onBeneficios}
          >
            📊 Beneficios
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
        <div className="mb-3">
          <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
            ⭐ Mejor valor
          </span>
        </div>

        <div className="mb-6">
          <div className="text-4xl mb-3">💎</div>
          <h3 className="text-xl font-bold mb-1">Plan Trimestral</h3>
          <p className="text-sm text-muted-foreground">3 meses de acceso completo</p>
          <div className="mt-4 space-y-1">
            <div className="flex items-end gap-1.5">
              <span className="text-5xl font-extrabold">$68</span>
              <span className="text-muted-foreground mb-1.5 text-sm">USD / 3 meses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-foreground/70">$250,000</span>
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

const FAQ = [
  { q: '¿Cuánto cuesta después de los días gratis?', a: 'Solo $16 USD ó $60,000 COP al mes. Sin contratos ni compromisos.' },
  { q: '¿Cómo puedo pagar?', a: 'Aceptamos transferencia bancaria o pago por PayPal. Escríbenos y te indicamos el método más conveniente para ti.' },
  { q: '¿Puedo cancelar cuando quiera?', a: '¡Claro! No hay contratos ni compromisos. Cancelas cuando quieras desde tu perfil, sin cargos ocultos.' },
  { q: '¿Las sesiones en vivo son incluidas?', a: 'Las sesiones 1 a 1 no están incluidas en el plan mensual de cursos — arma tu propio plan de clases en vivo eligiendo días, horas y horario, desde $37,500 COP por clase.' },
  { q: '¿Hay compromiso al empezar?', a: 'No. Los días de prueba son completamente gratis y sin ningún compromiso. Cancelas cuando quieras.' },
];

export default function PricingPage({ isLoggedIn = false, onOpenAuth, onLogout, userName }: PricingPageProps) {
  const { data: plans, loading } = usePricingPlans();
  const { data: settings } = useSiteSettings();

  const trialDays = settings?.trial_days ?? '7';

  const [showClasesModal, setShowClasesModal] = useState(false);
  const [showBeneficiosModal, setShowBeneficiosModal] = useState(false);

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
                {trialDays} días de prueba gratis. Luego solo <strong className="text-white">$16 USD</strong> ó <strong className="text-white">$60,000 COP</strong> al mes.
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
                  💰 $16 USD / mes
                </motion.div>
                <motion.div
                  animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -left-2 bg-amber-400 text-black rounded-2xl px-3 py-1.5 shadow-xl font-extrabold text-xs"
                >
                  🎁 {trialDays} días GRATIS
                </motion.div>
              </div>
              <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                {[{e:'🎁',t:'Prueba Gratis'},{e:'🚀',t:'Plan Mensual'},{e:'💎',t:'Trimestral'},{e:'🎥',t:'Clases Vivo'}].map(({e,t}) => (
                  <div key={t} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-1.5 py-2.5 text-center">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto items-stretch"
              initial="hidden" animate="visible" variants={stagger}
            >
              {/* Prueba Gratis + Plan Mensual + Plan Trimestral */}
              {(plans ?? []).filter(p => p.is_published && p.slug !== 'clase-vivo').flatMap((plan) => {
                const card = (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={() => onOpenAuth?.('register')}
                  />
                );
                if (plan.slug === 'mensual') {
                  return [card, <TrimestralPlanCard key="trimestral" onSelect={() => onOpenAuth?.('register')} />];
                }
                return [card];
              })}

              {/* Clases en Vivo */}
              {(plans ?? []).filter(p => p.is_published && p.slug === 'clase-vivo').map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onMensualPlan={() => setShowClasesModal(true)}
                  onBeneficios={() => setShowBeneficiosModal(true)}
                />
              ))}

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
                📲 Escríbenos por{' '}
                <a href="https://wa.me/573236405246" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                  WhatsApp +57 323 640 5246
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
              {trialDays} días gratis. Luego solo $16 USD o $60,000 COP al mes 🎊
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

      <ClasesVirtualesModal
        open={showClasesModal}
        onClose={() => setShowClasesModal(false)}
      />

      <BeneficiosClasesModal
        open={showBeneficiosModal}
        onClose={() => setShowBeneficiosModal(false)}
      />

    </Layout>
  );
}
