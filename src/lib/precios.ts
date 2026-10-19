// ── Precios de los planes de inglés: ÚNICA fuente de verdad ──────────────────
// Estos montos vivían dentro de ClasesVirtualesModal.tsx. Se movieron acá
// porque el botón "Cotizar" de las tarjetas de planes (EnglishProgram.tsx)
// necesita los mismos números: si estuvieran copiados en dos archivos, tarde o
// temprano la cotización pública y el precio del modal dirían cosas distintas.
//
// Al cambiar un precio se cambia SOLO acá.

// ── Autoaprendizaje (sin profesor) ───────────────────────────────────────────
// Mismos precios de siempre del curso (Plan Mensual / Plan Trimestral).
// PENDIENTE POR DEFINIR (Parte 9): cuál de estos dos planes (o de las 4 tarjetas
// del menú principal) es el "Más popular". Hasta que se confirme, ninguna
// tarjeta de plan lleva el badge/borde plateado o dorado de acento — no inventar
// cuál es el destacado.
export const AUTOESTUDIO_PRECIOS_BASE = {
  mensual: { cop: 60000, usd: 16 },
  trimestral: { cop: 250000, usd: 68 },
} as const;

// ── Tabla de precios por combinación horas×días (modalidad con profesor) ──────
export const PRECIOS = {
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

export const TRM = 3566.08; // tasa de cambio fija 1 USD = $3,566.08 COP
export const SPEAKOLOGY_FEE = 82000; // cargo único trimestral por activar Speakology IA

export function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

export function formatUSD(cop: number) {
  return '≈ $' + (cop / TRM).toFixed(2) + ' USD';
}

// ── Cotización pública de una tarjeta de plan ────────────────────────────────
// Lo que muestra el botón "Cotizar": solo informa el valor, no inscribe a nadie.
//
// El plan con profesor NO tiene un precio único: depende de cuántas horas al día
// y cuántos días a la semana arme el estudiante (tabla PRECIOS). Por eso se
// informa el mínimo real de la tabla —"desde"— y se dice que el valor exacto
// sale al armar el plan. No se inventa un precio promedio.
//
// Ojo: acá NO se muestra ningún descuento. El 25% del primer mes de las clases
// en vivo es un beneficio de una sola vez por cuenta que se activa dentro del
// modal (Parte 8) y dejó de anunciarse de forma pública.
export type Cotizacion = {
  cop: number;
  /**
   * Dólares que se muestran al público. En autoaprendizaje es el valor fijo de
   * AUTOESTUDIO_PRECIOS_BASE (el mismo "≈ $16 USD / mes" que ya muestra el
   * modal), no la conversión por TRM: si se calculara, la cotización pública y
   * el modal mostrarían dos cifras distintas para el mismo plan.
   */
  usd: number;
  /** 'mes' | '3meses' — el periodo que cubre el monto */
  periodo: 'mes' | 'trimestre';
  /** true cuando el monto es un mínimo y el precio final depende del plan armado */
  desde: boolean;
};

export function cotizacionDePlan(planId: string): Cotizacion | null {
  if (planId === 'mensual-auto') {
    return {
      cop: AUTOESTUDIO_PRECIOS_BASE.mensual.cop,
      usd: AUTOESTUDIO_PRECIOS_BASE.mensual.usd,
      periodo: 'mes',
      desde: false,
    };
  }
  if (planId === 'trimestral-auto') {
    return {
      cop: AUTOESTUDIO_PRECIOS_BASE.trimestral.cop,
      usd: AUTOESTUDIO_PRECIOS_BASE.trimestral.usd,
      periodo: 'trimestre',
      desde: false,
    };
  }
  if (planId === 'mensual-profesor' || planId === 'mensual-profesor-ninos') {
    // Mínimo real de la tabla: 1 hora al día, 1 día a la semana.
    const minimo = Math.min(
      ...Object.values(PRECIOS).flatMap((porDias) =>
        Object.values(porDias).map((p) => p.final),
      ),
    );
    return {
      cop: minimo,
      usd: Math.round(minimo / TRM),
      periodo: 'mes',
      desde: true,
    };
  }
  return null;
}
