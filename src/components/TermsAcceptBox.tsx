// Cuadro de términos y condiciones + checkbox de aceptación.
// Usado en todos los formularios de pago de la plataforma.
export function TermsAcceptBox({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Contrato desplazable */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="px-4 py-2 bg-muted border-b border-border">
          <p className="text-xs font-bold text-foreground">📄 Contrato de Prestación de Servicios — BLANG ENGLISH</p>
          <p className="text-[11px] text-muted-foreground">Desplázate para leer antes de aceptar</p>
        </div>
        <div className="h-52 overflow-y-auto px-4 py-3 text-xs text-foreground/80 space-y-3 leading-relaxed">
          <p><strong>Entre las partes:</strong> BLANG ENGLISH, academia virtual de enseñanza del idioma inglés, en adelante EL PRESTADOR DEL SERVICIO, y EL ESTUDIANTE, quien acepta las siguientes condiciones para la prestación de clases personalizadas de inglés.</p>
          <p><strong>CLÁUSULA PRIMERA – OBJETO</strong><br />El presente contrato tiene como finalidad regular la prestación de clases personalizadas de inglés de manera virtual, bajo las condiciones académicas, administrativas y económicas establecidas por BLANG ENGLISH.</p>
          <p><strong>CLÁUSULA SEGUNDA – PAGO ANTICIPADO</strong><br />El estudiante deberá realizar el pago total de las clases antes de iniciar el servicio. Ninguna clase será agendada o dictada sin confirmación previa del pago.</p>
          <p><strong>CLÁUSULA TERCERA – CANCELACIÓN DE CLASES</strong><br />Toda cancelación o reprogramación deberá notificarse con mínimo una (1) hora de anticipación a la hora programada.</p>
          <p><strong>CLÁUSULA CUARTA – CANCELACIÓN TARDÍA</strong><br />Si el estudiante cancela con menos de una (1) hora de anticipación, la clase será cobrada en su totalidad y se considerará como tomada, excepto en casos de calamidad o fuerza mayor debidamente comprobados y notificados vía correo electrónico.</p>
          <p><strong>CLÁUSULA QUINTA – REEMBOLSOS</strong><br />Una vez realizado el pago, no se realizarán reembolsos bajo ninguna circunstancia.</p>
          <p><strong>CLÁUSULA SEXTA – CLASES CANCELADAS CON TIEMPO</strong><br />Si una clase es cancelada dentro del tiempo establecido, podrá trasladarse al mes siguiente como saldo a favor, lo cual podrá disminuir el valor a pagar del siguiente periodo.</p>
          <p><strong>CLÁUSULA SÉPTIMA – LÍMITE DE CANCELACIONES ACUMULABLES</strong><br />El traslado de clases canceladas será de carácter mensual y tendrá como límite máximo: dos (1) clases por mes en planes de sesiones de dos (2) horas; cuatro (2) clases por mes en planes de sesiones de una (1) hora. Si el estudiante excede este límite, las clases adicionales canceladas no serán acumulables, reprogramables ni reembolsables.</p>
          <p><strong>CLÁUSULA OCTAVA – PUNTUALIDAD</strong><br />Si el estudiante llega tarde a la clase, el tiempo perdido no será repuesto. La clase finalizará a la hora inicialmente programada.</p>
          <p><strong>CLÁUSULA NOVENA – AUSENCIA SIN AVISO</strong><br />Si el estudiante no se presenta dentro de los primeros quince (15) minutos de iniciada la clase y no informa previamente, la clase se considerará como tomada.</p>
          <p><strong>CLÁUSULA DÉCIMA – CAMBIO DE DOCENTE</strong><br />Cualquier solicitud de cambio de docente deberá presentarse por escrito exponiendo las razones. BLANG ENGLISH evaluará la validez de dichas razones realizando un análisis interno, incluyendo la revisión de grabaciones de clases.</p>
          <p><strong>CLÁUSULA DÉCIMA PRIMERA – CONFIDENCIALIDAD Y USO DEL MATERIAL</strong><br />Todo material académico, contenido de clase, documentos, ejercicios, grabaciones, estrategias pedagógicas y recursos entregados por BLANG ENGLISH son de uso exclusivo para el desarrollo de las clases. Queda estrictamente prohibido compartir, distribuir, vender, reproducir o comercializar dicho material con terceros sin autorización expresa y por escrito de BLANG ENGLISH.</p>
          <p><strong>CLÁUSULA DÉCIMA SEGUNDA – VIGENCIA DEL PLAN</strong><br />Las clases adquiridas tendrán una vigencia máxima de treinta (30) días calendario a partir de la fecha de pago. Una vez vencido este periodo, las clases no tomadas se entenderán como expiradas y no serán reembolsables.</p>
          <p><strong>CLÁUSULA DÉCIMA TERCERA – MEDIOS DE COMUNICACIÓN</strong><br />Toda comunicación relacionada con cancelaciones, cambios de horario, solicitudes o novedades deberá realizarse a través de los canales oficiales de BLANG ENGLISH (WhatsApp o correo electrónico).</p>
          <p><strong>CLÁUSULA DÉCIMA CUARTA – REQUISITOS TÉCNICOS</strong><br />El estudiante se compromete a contar con conexión estable a internet, micrófono, cámara y audio funcionales para el correcto desarrollo de las clases.</p>
          <p><strong>CLÁUSULA DÉCIMA QUINTA – COMPROMISO Y PROGRESO ACADÉMICO</strong><br />EL ESTUDIANTE reconoce y acepta que la adquisición del idioma inglés depende principalmente de factores como la práctica constante, el estudio autónomo, la disciplina, la asistencia regular y la aplicación continua de los conocimientos adquiridos. BLANG ENGLISH garantiza la correcta prestación del servicio educativo, pero no garantiza resultados específicos o inmediatos.</p>
          <p><strong>CLÁUSULA DÉCIMA SEXTA – TERMINACIÓN DEL SERVICIO</strong><br />BLANG ENGLISH podrá dar por terminado este contrato en caso de incumplimiento de cualquiera de las cláusulas aquí establecidas, faltas de respeto, conductas inapropiadas o mal uso del material académico, sin obligación de reembolso.</p>
          <p className="text-foreground/60 italic">Al aceptar y realizar el pago, EL ESTUDIANTE declara haber leído, comprendido y aceptado los términos y condiciones aquí establecidos.</p>
        </div>
      </div>

      {/* Checkbox */}
      <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3 transition-all ${accepted ? 'border-violet-400 bg-violet-50' : 'border-border hover:border-violet-300'}`}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={e => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-violet-600 cursor-pointer shrink-0"
        />
        <span className="text-xs font-semibold text-foreground leading-snug">
          Leí y acepto los términos y condiciones del Contrato de Prestación de Servicios de BLANG ENGLISH
        </span>
      </label>
    </div>
  );
}
