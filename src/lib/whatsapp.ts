import { cfg } from '@/lib/siteConfig';

// Número por el que entran los leads. Editable desde admin
// (site_settings → whatsapp_number). Este literal es el fallback: si la
// configuración no ha cargado o la clave está vacía, se usa este y los
// mensajes siguen llegando.
const WA_NUMBER_FALLBACK = '573236405246';

/** Solo dígitos: `wa.me` rechaza espacios, guiones y el signo +. */
function normalizeNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits : WA_NUMBER_FALLBACK;
}

export function getWhatsAppNumber(): string {
  return normalizeNumber(cfg('whatsapp_number', WA_NUMBER_FALLBACK));
}

export function openWhatsApp(message: string): void {
  window.open(
    `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`,
    '_blank',
  );
}
