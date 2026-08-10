// ─── Route Paths ──────────────────────────────────────────────────────────────
export const ROUTE_PATHS = {
  HOME: '/',
  LESSONS: '/lessons',
  LIVE_CLASSES: '/live-classes',
  DASHBOARD: '/dashboard',
  PRICING: '/pricing',
  METHODOLOGY: '/methodology',
  FAQ: '/faq',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  RESET_PASSWORD: '/reset-password',
  ENGLISH_MODULE: '/english/:moduleSlug',
  // Inglés para hispanohablantes: una página con los 3 módulos y una página por
  // módulo. ENGLISH ('/english') es el enlace antiguo y ahora solo redirige al
  // hub, para no romper enlaces ya compartidos.
  ENGLISH: '/english',
  ENGLISH_HUB: '/ingles',
  ENGLISH_ADULTS: '/ingles/adultos',
  ENGLISH_TEENS: '/ingles/jovenes',
  ENGLISH_KIDS: '/ingles/ninos',
  LEVEL_TEST: '/nivel-ingles',
  SPANISH: '/espanol',
  PHONETICS: '/phonetics',
} as const;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type AuthModal = 'login' | 'register' | null;

// Parte 8: se guarda en sessionStorage justo antes de abrir el modal de auth
// desde el CTA "Regístrate e inicia sesión" de Arma tu plan (inglés/español).
// Dashboard lo lee al montar para abrir "Arma tu plan" automáticamente y
// evitar que el usuario se quede en un dashboard genérico tras registrarse.
export const OPEN_PLAN_AFTER_AUTH_KEY = 'blang_open_plan_after_auth';

// ─── Domain Types ─────────────────────────────────────────────────────────────
export interface Lesson {
  id: string;
  title: string;
  level: string;
  duration: string;
  topic: string;
  completed: boolean;
  locked: boolean;
  emoji?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  instructor?: string;
  date?: string;
  time?: string;
  duration?: string;
  level?: string;
  topic?: string;
  spots?: number;
  price?: number;
  description?: string;
  [key: string]: unknown;
}

export interface UserProgress {
  level?: string;
  completedLessons?: number;
  totalLessons?: number;
  streak?: number;
  points?: number;
  nextLevel?: string;
  weeklyGoal?: number;
  weeklyCompleted?: number;
  badges?: string[];
  weeklyActivity?: number[];
  progress?: number;
  [key: string]: unknown;
}

export interface Feature {
  icon?: string;
  title: string;
  description: string;
  emoji?: string;
  [key: string]: unknown;
}

export interface Testimonial {
  id?: string;
  name: string;
  role?: string;
  content?: string;
  text?: string;
  rating?: number;
  avatar?: string;
  country?: string;
  level?: string;
  [key: string]: unknown;
}

export interface PricingPlan {
  id?: string;
  name: string;
  price?: number | string;
  period?: string;
  features?: string[];
  popular?: boolean;
  cta?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DBCourseRow {
  id: string;
  title: string;
  level: string;
  description?: string;
  is_published?: boolean;
  required_level?: string;
  [key: string]: unknown;
}
