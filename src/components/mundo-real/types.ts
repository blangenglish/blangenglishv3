import type { MRTopic } from '@/pages/MundoRealData';

export type MRBlockId = 'vocab' | 'frases' | 'expresiones' | 'phrasal' | 'estructura' | 'dialogo';

/** Estudiar = ver la lista con las respuestas. Practicar = solo los ejercicios. */
export type MRMode = 'estudiar' | 'practicar';

/**
 * Lo que recibe cada pestaña. Las respuestas se guardan por TEXTO, con claves
 * por contenido (`v:palabra`, `p:frase`, `e:expresión`, `pv:verbo`, `d:turno`),
 * nunca por índice: en cuanto las opciones se barajan, una posición deja de
 * significar lo mismo.
 */
export interface MRTabProps {
  topic: MRTopic;
  /** Todos los temas, para sacar distractores de la misma categoría. */
  allTopics: MRTopic[];
  mode: MRMode;
  answers: Record<string, string>;
  onAnswer: (key: string, text: string) => void;
  /**
   * Borra las respuestas del bloque. Con `onlyKeys` borra solo esas, que es lo
   * que permite repetir una sección sin perder el resto del bloque.
   */
  onResetBlock: (prefix: string, onlyKeys?: string[]) => void;
  speak: (text: string) => void;
}
