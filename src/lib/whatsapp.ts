const WA_NUMBER = '573236405246';

export function openWhatsApp(message: string): void {
  window.open(
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`,
    '_blank',
  );
}
