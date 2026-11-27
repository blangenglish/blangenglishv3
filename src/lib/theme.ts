/**
 * Tema editable desde el panel de admin.
 *
 * Los colores se aplican escribiendo custom properties CSS sobre :root, no
 * generando clases de Tailwind. Es la única forma que funciona aquí: Tailwind
 * v4 descubre las clases escaneando el código fuente, así que una clase que
 * solo exista en la base de datos nunca llega al CSS compilado. Una variable
 * CSS, en cambio, se cambia en caliente y la hereda todo, incluidos modales y
 * portales, porque se escribe en :root.
 *
 * Catálogo cerrado a propósito: el admin elige entre paletas preparadas, no
 * escribe un hex libre. Así el contraste y la coherencia visual están
 * garantizados y nadie puede dejar la web ilegible sin querer.
 */
import { cfg } from '@/lib/siteConfig';

/** Tokens que el tema puede tocar. Cualquier otra clave se ignora. */
const ALLOWED_TOKENS = [
  '--brand-from',
  '--brand-via',
  '--brand-to',
  '--tint-from',
  '--tint-via',
  '--ink',
  '--card-border',
  '--badge-bg',
  '--primary',
  '--primary-hover',
] as const;

export type ThemeToken = (typeof ALLOWED_TOKENS)[number];
export type ThemeTokens = Partial<Record<ThemeToken, string>>;

export interface Palette {
  id: string;
  name: string;
  /** Muestras para el selector del admin. */
  swatch: string[];
  tokens: ThemeTokens;
}

/**
 * Paletas disponibles. La primera es la actual del sitio, con los valores
 * exactos que estaban escritos a mano en Home.tsx, así que elegirla deja la
 * web igual que antes.
 */
export const PALETTES: Palette[] = [
  {
    id: 'violeta',
    name: 'Violeta (actual)',
    swatch: ['#4C1D95', '#6B21A8', '#6D28D9'],
    tokens: {
      '--brand-from': '#4C1D95',
      '--brand-via': '#6B21A8',
      '--brand-to': '#6D28D9',
      '--tint-from': '#FAF5FF',
      '--tint-via': 'rgb(245 243 255 / 0.6)',
      '--badge-bg': '#4C1D95',
      '--primary': '#6D28D9',
      '--primary-hover': '#4C1D95',
    },
  },
  {
    id: 'oceano',
    name: 'Océano',
    swatch: ['#0C4A6E', '#0369A1', '#0284C7'],
    tokens: {
      '--brand-from': '#0C4A6E',
      '--brand-via': '#0369A1',
      '--brand-to': '#0284C7',
      '--tint-from': '#F0F9FF',
      '--tint-via': 'rgb(224 242 254 / 0.6)',
      '--badge-bg': '#0C4A6E',
      '--primary': '#0284C7',
      '--primary-hover': '#0369A1',
    },
  },
  {
    id: 'bosque',
    name: 'Bosque',
    swatch: ['#14532D', '#15803D', '#16A34A'],
    tokens: {
      '--brand-from': '#14532D',
      '--brand-via': '#15803D',
      '--brand-to': '#16A34A',
      '--tint-from': '#F0FDF4',
      '--tint-via': 'rgb(220 252 231 / 0.6)',
      '--badge-bg': '#14532D',
      '--primary': '#16A34A',
      '--primary-hover': '#15803D',
    },
  },
  {
    id: 'atardecer',
    name: 'Atardecer',
    swatch: ['#7C2D12', '#C2410C', '#EA580C'],
    tokens: {
      '--brand-from': '#7C2D12',
      '--brand-via': '#C2410C',
      '--brand-to': '#EA580C',
      '--tint-from': '#FFF7ED',
      '--tint-via': 'rgb(255 237 213 / 0.6)',
      '--badge-bg': '#7C2D12',
      '--primary': '#EA580C',
      '--primary-hover': '#C2410C',
    },
  },
  {
    id: 'grafito',
    name: 'Grafito',
    swatch: ['#18181B', '#3F3F46', '#52525B'],
    tokens: {
      '--brand-from': '#18181B',
      '--brand-via': '#3F3F46',
      '--brand-to': '#52525B',
      '--tint-from': '#FAFAFA',
      '--tint-via': 'rgb(244 244 245 / 0.6)',
      '--badge-bg': '#18181B',
      '--primary': '#3F3F46',
      '--primary-hover': '#18181B',
    },
  },
];

export const DEFAULT_PALETTE_ID = 'violeta';

export function getPalette(id: string | null | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/**
 * Sólo se aceptan colores con forma conocida. El valor viene de la base de
 * datos y acaba dentro de CSS; sin este filtro, algo como `url(...)` sería una
 * petición de red arbitraria desde la página.
 */
const SAFE_VALUE = /^(#[0-9a-f]{3,8}|rgb\([\d\s/.%]+\)|oklch\([\d\s/.%-]+\))$/i;

export function applyTheme(tokens: ThemeTokens): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const token of ALLOWED_TOKENS) {
    const value = tokens[token];
    if (typeof value === 'string' && SAFE_VALUE.test(value.trim())) {
      root.style.setProperty(token, value.trim());
    }
  }
}

/** Aplica la paleta guardada en site_settings. Sin nada guardado, no toca nada. */
export function applySavedTheme(): void {
  const id = cfg('theme_palette', DEFAULT_PALETTE_ID);
  if (id === DEFAULT_PALETTE_ID) return; // el CSS ya trae esos valores
  applyTheme(getPalette(id).tokens);
}
