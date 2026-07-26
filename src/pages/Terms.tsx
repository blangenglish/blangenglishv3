// @ts-nocheck
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';

interface TermsProps {
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
}

const LAST_UPDATED = '25 de julio de 2026';

export default function Terms({ isLoggedIn, onOpenAuth, onLogout, userName }: TermsProps) {
  const navigate = useNavigate();

  const sections = [
    {
      id: '1', title: '1. Aceptación de los Términos',
      content: `Al registrarte y usar BLANG English Academy ("BLANG", "la plataforma", "nosotros"), aceptas íntegramente estos Términos de Servicio. Si no estás de acuerdo con alguno de los términos aquí descritos, no debes utilizar la plataforma. El uso continuado de BLANG implica la aceptación plena de estas condiciones.`,
    },
    {
      id: '2', title: '2. Descripción del Servicio',
      content: `BLANG es una plataforma de aprendizaje de idiomas en línea con dos programas:\n\n• Inglés — curso estructurado por unidades semanales (niveles A1 a C1), con la sección "English for you" (Fonética, Inglés para el Mundo Real, Escritura, Lectura, Gramática, Listening y Vocabulario), práctica con inteligencia artificial y herramientas de seguimiento de progreso\n• Español para Extranjeros — clases en vivo 1 a 1 con profesor, con metodología de inmersión (primero comprensión leyendo y escuchando, luego producción hablando y escribiendo)\n\nEl estudiante arma su propio plan ("Arma tu plan") eligiendo cómo quiere aprender, horas por día, días de la semana y horario fijo. Para inglés, el plan puede ser de autoaprendizaje (acceso a los cursos por niveles) o con profesor (clases en vivo 1 a 1 por Google Meet); para español, el plan siempre es con profesor.\n\nTodos los servicios se prestan de forma digital a través del sitio web de BLANG.`,
    },
    {
      id: '3', title: '3. Registro y Cuenta de Usuario',
      content: `Para acceder a los servicios de BLANG debes crear una cuenta personal proporcionando información veraz, completa y actualizada. Cada cuenta es personal e intransferible — no está permitido compartir credenciales de acceso con terceros. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. BLANG se reserva el derecho de suspender o cancelar cuentas que violen estos términos.`,
    },
    {
      id: '4', title: '4. Aprendizaje Autónomo — Responsabilidad del Estudiante',
      content: `BLANG es una plataforma de aprendizaje 100% autónomo. Esto significa que el estudiante es el principal responsable de su propio proceso de aprendizaje. BLANG proporciona las herramientas, el contenido estructurado y el apoyo técnico necesario, pero el avance y los resultados dependen exclusivamente de la constancia, dedicación y práctica de cada usuario.\n\nNo se garantiza que el estudiante alcance un nivel específico de inglés en un tiempo determinado. El tiempo necesario para adquirir fluidez varía según las bases previas, el tiempo dedicado al estudio y la regularidad de la práctica de cada persona.\n\nEl hecho de suscribirse a BLANG no reemplaza la responsabilidad personal del aprendizaje. Si el estudiante no dedica tiempo suficiente a practicar, los resultados serán limitados independientemente de la calidad del contenido ofrecido.`,
    },
    {
      id: '5', title: '5. Precios, Pagos y Suscripciones',
      content: `Los precios vigentes se muestran al armar tu plan dentro de la plataforma ("Arma tu plan"). Actualmente:\n\nCurso de inglés — autoaprendizaje:\n• Plan Mensual: $16 USD o $60,000 COP al mes (acceso completo a todos los cursos y módulos)\n• Plan Trimestral: $68 USD o $250,000 COP por 3 meses (acceso completo)\n• Primer mes con 50% de descuento — exclusivo del Plan Mensual, disponible una sola vez por cuenta\n\nClases en vivo 1 a 1 con profesor — inglés: precio en pesos colombianos (COP), calculado según las horas por día (1 o 2) y los días por semana (1 a 5) elegidos. Incluye plataforma de práctica con IA (ChatGPT sin costo adicional, o Speakology con cargo adicional de $82,000 COP cada 3 meses).\n\nClases en vivo 1 a 1 con profesor — Español para Extranjeros: precio en dólares (USD), desde $23 USD por hora con descuento según las horas y días elegidos (mínimo 2 días por semana). Incluye acceso obligatorio a Speakology IA con cargo adicional de aproximadamente $22 USD cada 3 meses. No requiere crear una cuenta para solicitar el plan.\n\nEl descuento del primer mes es exclusivo del curso de inglés y no aplica al curso de Español para Extranjeros bajo ninguna circunstancia.\n\nMétodos de pago aceptados:\n• PayPal (USD) — disponible para ambos cursos; único método aceptado para el curso de español\n• Bold / PSE (COP) — con recargo de transacción, solo para inglés\n• Transferencia Bancolombia (COP) — solo para inglés\n• Bre-B / Llave (COP) — solo para inglés\n\nEl proceso de pago se coordina por WhatsApp tras enviar tu solicitud desde "Arma tu plan". BLANG se reserva el derecho de modificar los precios con previo aviso. Los cambios de precio no afectarán períodos ya pagados.`,
    },
    {
      id: '6', title: '6. Política de Reembolsos',
      content: `BLANG no realiza reembolsos por suscripciones una vez procesado el pago.\n\nEn caso de problemas técnicos graves atribuibles a BLANG que impidan el uso del servicio, se evaluará cada caso de forma individual.\n\nPara sesiones en vivo (inglés o español): no se realizará reembolso si el estudiante no asiste a la sesión agendada o si cancela con menos de 24 horas de anticipación. Las sesiones no asistidas se consideran realizadas.`,
    },
    {
      id: '7', title: '7. Cancelación y Reprogramación de Sesiones en Vivo',
      content: `Las sesiones en vivo son un servicio adicional con costo separado a la suscripción de cursos, y aplican tanto al curso de inglés como al de Español para Extranjeros. Para armar un plan, el estudiante usa "Arma tu plan" dentro de la plataforma, eligiendo horas por día, días de la semana y horario fijo. El curso de inglés requiere tener una cuenta creada; el curso de español no requiere cuenta — el plan se solicita directamente desde la página del curso.\n\nCancelaciones y reprogramaciones:\n\n• Cada clase puede cancelarse o reprogramarse con al menos 24 (veinticuatro) horas de anticipación, enviando la solicitud a blangenglishlearning@blangenglish.com.\n• Si la cancelación se realiza con menos de 24 horas de anticipación, la clase se considerará realizada y no habrá lugar a reembolso ni reprogramación sin costo adicional.\n• Si el profesor no se presenta a una clase por razones atribuibles a BLANG, se ofrecerá reprogramación o reembolso total de la clase afectada.`,
    },
    {
      id: '8', title: '8. Propiedad Intelectual y Uso del Contenido',
      content: `Todo el contenido de BLANG —incluyendo pero no limitado a: lecciones, textos, imágenes, audios, videos, ejercicios, metodología, diseño gráfico y materiales de práctica— es propiedad exclusiva de BLANG English Academy y está protegido por las leyes de propiedad intelectual aplicables.\n\nQueda estrictamente prohibido:\n\n• Copiar, reproducir, distribuir o compartir el contenido sin autorización escrita previa\n• Publicar materiales de la plataforma en redes sociales, grupos de WhatsApp u otras plataformas\n• Usar el contenido con fines comerciales\n• Modificar o crear obras derivadas del material de BLANG\n\nEl incumplimiento de estas disposiciones podrá resultar en la suspensión inmediata de la cuenta y posibles acciones legales.`,
    },
    {
      id: '9', title: '9. Conducta del Usuario',
      content: `Al usar BLANG te comprometes a:\n\n• Usar la plataforma exclusivamente para fines de aprendizaje personal\n• No intentar acceder a áreas restringidas del sistema\n• No realizar actividades que puedan dañar, interrumpir o sobrecargar los servidores\n• Respetar a los profesores durante las sesiones en vivo\n• No grabar sesiones en vivo sin el consentimiento explícito del profesor\n• Proporcionar información veraz en los formularios y comunicaciones`,
    },
    {
      id: '10', title: '10. Disponibilidad del Servicio',
      content: `BLANG se esfuerza por mantener la plataforma disponible de manera continua. Sin embargo, pueden ocurrir interrupciones por mantenimiento, actualizaciones técnicas o causas de fuerza mayor. BLANG no se hace responsable por daños derivados de interrupciones temporales del servicio.\n\nNos reservamos el derecho de modificar, actualizar o discontinuar funcionalidades de la plataforma con previo aviso razonable.`,
    },
    {
      id: '11', title: '11. Limitación de Responsabilidad',
      content: `BLANG no garantiza resultados específicos de aprendizaje. La plataforma se ofrece "tal como está" para facilitar el aprendizaje autónomo del inglés. BLANG no será responsable por:\n\n• Falta de progreso debido a insuficiente práctica del estudiante\n• Pérdida de datos causada por fallos técnicos fuera de nuestro control\n• Incompatibilidad con dispositivos o navegadores no soportados\n• Daños indirectos o consecuentes derivados del uso de la plataforma`,
    },
    {
      id: '12', title: '12. Modificaciones a los Términos',
      content: `BLANG se reserva el derecho de actualizar estos Términos de Servicio en cualquier momento. Las modificaciones serán publicadas en esta página con la fecha de actualización. Si continúas usando la plataforma después de publicados los cambios, se considerará que aceptas los nuevos términos. Te recomendamos revisar esta página periódicamente.`,
    },
    {
      id: '13', title: '13. Legislación Aplicable',
      content: `Estos Términos de Servicio se rigen por las leyes de la República de Colombia. Cualquier disputa derivada del uso de BLANG será sometida a la jurisdicción de los tribunales competentes de Colombia.`,
    },
    {
      id: '14', title: '14. Contacto',
      content: `Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos por cualquiera de estos canales:\n\n• Correo electrónico: blangenglishlearning@blangenglish.com\n• Formulario de contacto en la sección de Preguntas Frecuentes\n• WhatsApp o Instagram (canales oficiales de BLANG)`,
    },
  ];

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-violet-50/40 to-background pointer-events-none" />

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              📜 Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Términos de Servicio</h1>
            <p className="text-muted-foreground">Última actualización: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-10 text-sm text-foreground/80 leading-relaxed"
          >
            Por favor lee estos Términos de Servicio detenidamente antes de usar la plataforma BLANG English Academy. Al crear una cuenta o utilizar nuestros servicios, confirmas que has leído, comprendido y aceptado estos términos en su totalidad.
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-background/80 border border-border/50 rounded-2xl p-7"
              >
                <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {section.id}
                  </span>
                  {section.title.replace(`${section.id}. `, '')}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer links */}
          <div className="mt-12 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿Tienes preguntas sobre estos términos?
            </p>
            <button
              onClick={() => navigate(ROUTE_PATHS.FAQ)}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
            >
              Ir a Preguntas Frecuentes →
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              También puedes revisar nuestra{' '}
              <button onClick={() => navigate(ROUTE_PATHS.PRIVACY)} className="text-primary hover:underline">
                Política de Privacidad
              </button>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
