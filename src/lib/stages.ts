// ─── Stage Material types ─────────────────────────────────────────────────────
// Etapas de INGLÉS (5). No tocar: cualquier cambio acá afecta a todas las
// unidades de inglés ya publicadas.
export type EnglishStage = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'ai_practice';

// Parte 32 — etapas de ESPAÑOL PARA EXTRANJEROS (7). Estructura propia y
// distinta a la de inglés; el prefijo es_ garantiza que nunca se mezclen.
// Habla y Escritura NO tienen quiz.
export type SpanishStage =
  | 'es_reading' | 'es_listening' | 'es_grammar' | 'es_vocabulary'
  | 'es_quiz' | 'es_speaking' | 'es_writing';

export type Stage = EnglishStage | SpanishStage;
export type StageMaterialType = 'audio' | 'video' | 'pdf' | 'word' | 'ppt' | 'image' | 'url' | 'text' | 'html' | 'flashcard';

// Una tarjeta de un mazo de flashcards. Se guardan como JSON dentro de
// unit_stage_materials.description cuando material_type === 'flashcard'.
export interface Flashcard { front: string; back: string; hint?: string }

/** Lee el mazo desde description. Nunca lanza: si el JSON está corrupto o no
 *  es un arreglo, devuelve [] y quien llama decide el fallback. */
export function parseFlashcards(description?: string | null): Flashcard[] {
  if (!description) return [];
  try {
    const parsed = JSON.parse(description);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(c => c && typeof c === 'object')
      .map(c => ({ front: String(c.front ?? ''), back: String(c.back ?? ''), hint: c.hint ? String(c.hint) : undefined }));
  } catch {
    return [];
  }
}

export interface UnitStageMaterial {
  id: string;
  unit_id: string;
  stage: Stage;
  material_type: StageMaterialType;
  /** 'mensual' = ChatGPT prompts (Plan Mensual + prueba) | 'trimestral' = Speakology (Plan Trimestral) */
  plan_type: 'mensual' | 'trimestral';
  title: string;
  description: string;
  file_url: string | null;
  file_name: string | null;
  external_url: string | null;
  embed_html?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const STAGES: { id: Stage; label: string; partLabel: string; emoji: string; color: string; bg: string; desc: string }[] = [
  { id: 'grammar',     label: 'Part 1 – Grammar',             partLabel: 'Part 1',  emoji: '📚', color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200',  desc: 'Reglas gramaticales, estructuras y ejercicios' },
  { id: 'vocabulary',  label: 'Part 2 – Vocabulary',          partLabel: 'Part 2',  emoji: '📖', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      desc: 'Palabras, expresiones y frases clave' },
  { id: 'reading',     label: 'Part 3 – Reading',             partLabel: 'Part 3',  emoji: '📰', color: 'text-green-600',   bg: 'bg-green-50 border-green-200',    desc: 'Textos, artículos y comprensión lectora' },
  { id: 'listening',   label: 'Part 4 – Listening',           partLabel: 'Part 4',  emoji: '🎧', color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',  desc: 'Audios, podcasts y comprensión auditiva' },
  { id: 'ai_practice', label: 'Part 5 – Practice', partLabel: 'Part 5', emoji: '🤖', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200', desc: 'Práctica interactiva con inteligencia artificial' },
];

// ── Parte 32: las 7 partes de una unidad de Español para extranjeros ─────────
// Orden fijo para toda unidad de todo nivel. Las dos últimas (Habla y
// Escritura) no llevan quiz: son de producción, se revisan con el profesor.
export const SPANISH_STAGES: {
  id: Stage; label: string; partLabel: string; emoji: string;
  color: string; bg: string; desc: string; hasQuiz: boolean;
}[] = [
  { id: 'es_reading',    label: 'Parte 1 – Lectura',     partLabel: 'Parte 1', emoji: '📖', color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   desc: 'Texto de la unidad y quiz de comprensión', hasQuiz: true },
  { id: 'es_listening',  label: 'Parte 2 – Listening',   partLabel: 'Parte 2', emoji: '🎧', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', desc: 'Audio del profesor y quiz de comprensión', hasQuiz: true },
  { id: 'es_grammar',    label: 'Parte 3 – Gramática',   partLabel: 'Parte 3', emoji: '📐', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', desc: 'Reglas, ejemplos y errores comunes', hasQuiz: false },
  { id: 'es_vocabulary', label: 'Parte 4 – Vocabulario', partLabel: 'Parte 4', emoji: '📝', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     desc: 'Tabla bilingüe español-inglés', hasQuiz: false },
  { id: 'es_quiz',       label: 'Parte 5 – Quiz',        partLabel: 'Parte 5', emoji: '🧪', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', desc: 'Quiz de gramática y vocabulario', hasQuiz: true },
  { id: 'es_speaking',   label: 'Parte 6 – Habla',       partLabel: 'Parte 6', emoji: '🗣️', color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200',     desc: 'Preguntas para practicar hablando (sin quiz)', hasQuiz: false },
  { id: 'es_writing',    label: 'Parte 7 – Escritura',   partLabel: 'Parte 7', emoji: '✍️', color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200',     desc: 'Ejercicios de escritura (sin quiz)', hasQuiz: false },
];

/**
 * Devuelve las etapas que corresponden al programa del curso.
 * Cualquier valor distinto de 'spanish' cae en inglés, que es el
 * comportamiento que ya existía antes de la Parte 32.
 */
export function getStagesForProgram(program?: string) {
  return program === 'spanish' ? SPANISH_STAGES : STAGES;
}

export const MATERIAL_TYPE_CONFIG: Record<StageMaterialType, { label: string; emoji: string; accept: string; isFile: boolean }> = {
  audio:  { label: 'Audio',           emoji: '🎵', accept: '.mp3,.wav,.ogg,.m4a,.aac', isFile: true },
  video:  { label: 'Video',           emoji: '🎬', accept: '.mp4,.webm,.mov',           isFile: true },
  pdf:    { label: 'PDF',             emoji: '📄', accept: '.pdf',                       isFile: true },
  word:   { label: 'Word',            emoji: '📝', accept: '.doc,.docx',                 isFile: true },
  ppt:    { label: 'PowerPoint',      emoji: '📊', accept: '.ppt,.pptx',                 isFile: true },
  image:  { label: 'Imagen',          emoji: '🖼️', accept: '.jpg,.jpeg,.png,.gif,.webp', isFile: true },
  url:    { label: 'URL / Enlace',    emoji: '🔗', accept: '',                            isFile: false },
  text:   { label: 'Texto / Nota',    emoji: '✏️', accept: '',                            isFile: false },
  html:   { label: 'HTML',            emoji: '💻', accept: '',                            isFile: false },
  flashcard: { label: 'Flashcards',   emoji: '🃏', accept: '',                            isFile: false },
};
