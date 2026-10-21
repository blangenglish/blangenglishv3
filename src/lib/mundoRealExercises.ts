/**
 * Construcción de los ejercicios de Inglés para el Mundo Real.
 *
 * Por qué existe este archivo: hasta ahora el visor calculaba la respuesta
 * correcta por POSICIÓN (`options.indexOf(...)`, o el campo `correct`), y las
 * opciones se pintaban en el orden del array. Como las 999 apariciones de
 * `correct` en MundoRealData.ts valen 0 y la traducción se escribió siempre la
 * primera, el alumno acertaba el módulo entero pulsando el primer botón.
 *
 * Aquí la correcta se identifica por SU TEXTO, antes de barajar, y el barajado
 * es determinista (ver src/lib/shuffle.ts). Eso permite además guardar la
 * respuesta del alumno como texto en vez de como índice, que es lo que la hace
 * sobrevivir a un reordenamiento, a que el admin añada una opción o al dedupe
 * del merge.
 */
import { shuffleSeeded, pickSeeded, mrSeed } from './shuffle';

/** Un ejercicio de opción múltiple ya resuelto: opciones barajadas + correcta. */
export interface MCItem {
  /** Clave estable del ítem, para guardar la respuesta. No es el índice. */
  key: string;
  /** Lo que se pregunta (la palabra, la expresión, el verbo…). */
  prompt: string;
  options: string[];
  /** El texto correcto, no su posición. */
  correct: string;
}

/**
 * Parte una frase en fichas para el ejercicio de ordenar.
 *
 * La clave está en no separar la puntuación: `"salad."` es una sola ficha. Así
 * `tokenize(frase).join(' ') === frase` por construcción, y desaparecen los dos
 * motivos por los que el ejercicio era imposible en los 132 temas: el punto
 * suelto como ficha y el espacio que `join(' ')` metía antes de él.
 */
export function tokenizeSentence(sentence: string): string[] {
  return String(sentence ?? '').trim().split(/\s+/).filter(Boolean);
}

/** ¿La frase sirve para ordenar? Con menos de 4 fichas el ejercicio es trivial. */
export function isOrderable(sentence: string, min = 4): boolean {
  return tokenizeSentence(sentence).length >= min;
}

/**
 * Elige `n` distractores de un conjunto, excluyendo el correcto y cualquier
 * repetido. Determinista: el mismo ítem siempre recibe los mismos.
 */
export function distractors(
  pool: readonly string[],
  exclude: string,
  n: number,
  seed: string,
): string[] {
  const seen = new Set<string>([norm(exclude)]);
  const unique: string[] = [];
  for (const candidate of pool) {
    const k = norm(candidate);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    unique.push(candidate);
  }
  return pickSeeded(unique, n, seed);
}

function norm(s: string): string {
  return String(s ?? '').trim().toLowerCase();
}

/**
 * Arma las opciones de un ítem: la correcta más distractores, todo barajado.
 *
 * `preferred` son las opciones que ya venían escritas en el dato (el array
 * `options` del archivo). Se usan primero porque están pensadas para esa
 * palabra; `pool` es el respaldo cuando no alcanzan.
 */
export function buildOptions(
  correct: string,
  preferred: readonly string[],
  pool: readonly string[],
  seed: string,
  total = 4,
): string[] {
  const need = Math.max(0, total - 1);
  const fromPreferred = distractors(preferred, correct, need, seed + '|p');
  const missing = need - fromPreferred.length;
  const fromPool =
    missing > 0
      ? distractors(
          pool,
          correct,
          missing,
          seed + '|f',
        ).filter(d => !fromPreferred.some(p => norm(p) === norm(d)))
      : [];

  return shuffleSeeded([correct, ...fromPreferred, ...fromPool.slice(0, missing)], seed);
}

/* ── Constructores por bloque ─────────────────────────────────────────────── */

interface VocabLike { word: string; translation: string; options?: string[] }
interface PhraseLike { phrase: string; missing: string; options?: string[] }
interface ExprLike { expression: string; meaning: string }
interface PhrasalLike { verb: string; meaning: string }

/**
 * Vocabulario: se pregunta la traducción.
 * La correcta es `translation`, no `options[0]`.
 */
export function vocabItems(topicId: string, vocab: readonly VocabLike[]): MCItem[] {
  const pool = vocab.map(v => v.translation);
  return vocab.map(v => {
    const seed = mrSeed(topicId, 'vocab', v.word);
    return {
      key: `v:${v.word}`,
      prompt: v.word,
      correct: v.translation,
      options: buildOptions(v.translation, v.options ?? [], pool, seed),
    };
  });
}

/**
 * Frases con hueco: la correcta es `missing`.
 * El campo `correct` del dato se ignora a propósito: vale 0 en las 999 frases.
 */
export function phraseItems(topicId: string, phrases: readonly PhraseLike[]): MCItem[] {
  const pool = phrases.map(p => p.missing);
  return phrases.map(p => {
    const seed = mrSeed(topicId, 'frases', p.phrase);
    return {
      key: `p:${p.phrase}`,
      prompt: p.phrase,
      correct: p.missing,
      options: buildOptions(p.missing, p.options ?? [], pool, seed),
    };
  });
}

/**
 * Expresiones: se pregunta el significado.
 * `extraPool` permite traer significados de otros temas de la misma categoría,
 * porque con 5 expresiones por tema los distractores se repetirían siempre.
 */
export function expressionItems(
  topicId: string,
  expressions: readonly ExprLike[],
  extraPool: readonly string[] = [],
): MCItem[] {
  const pool = [...expressions.map(e => e.meaning), ...extraPool];
  return expressions.map(e => {
    const seed = mrSeed(topicId, 'expresiones', e.expression);
    return {
      key: `e:${e.expression}`,
      prompt: e.expression,
      correct: e.meaning,
      options: buildOptions(e.meaning, [], pool, seed),
    };
  });
}

/** Phrasal verbs: igual que las expresiones, con `verb` y `meaning`. */
export function phrasalItems(
  topicId: string,
  phrasals: readonly PhrasalLike[],
  extraPool: readonly string[] = [],
): MCItem[] {
  const pool = [...phrasals.map(p => p.meaning), ...extraPool];
  return phrasals.map(p => {
    const seed = mrSeed(topicId, 'phrasal', p.verb);
    return {
      key: `pv:${p.verb}`,
      prompt: p.verb,
      correct: p.meaning,
      options: buildOptions(p.meaning, [], pool, seed),
    };
  });
}

/* ── Ordenar palabras ─────────────────────────────────────────────────────── */

export interface OrderTile {
  /** Identidad propia: dos fichas con el mismo texto no se confunden. */
  id: number;
  text: string;
}

export interface OrderExercise {
  key: string;
  /** La frase objetivo, que es también la respuesta. */
  target: string;
  tiles: OrderTile[];
}

/**
 * Un ejercicio de ordenar por cada ejemplo de la estructura.
 *
 * Antes había uno solo por tema, y era imposible: mostraba `examples[2]` como
 * objetivo pero repartía las fichas de `structure.words`, que formaban otra
 * frase distinta. Ahora las fichas salen de la propia frase objetivo.
 */
export function orderExercises(
  topicId: string,
  examples: readonly string[],
  minTiles = 4,
): OrderExercise[] {
  return examples
    .filter(ex => isOrderable(ex, minTiles))
    .map((target, i) => {
      const words = tokenizeSentence(target);
      const tiles = words.map((text, id) => ({ id, text }));
      return {
        key: `s:${i}`,
        target,
        tiles: shuffleSeeded(tiles, mrSeed(topicId, 'estructura', String(i))),
      };
    });
}

/** ¿La respuesta del alumno reconstruye la frase? */
export function isOrderCorrect(placed: readonly OrderTile[], target: string): boolean {
  return placed.map(t => t.text).join(' ') === target.trim();
}

/* ── Diálogo ──────────────────────────────────────────────────────────────── */

interface DialogueLineLike { speaker: string; text: string; options?: string[]; correct?: number }

export interface DialogueChoice {
  key: string;
  options: string[];
  correct: string;
}

/**
 * Opciones barajadas de un turno del diálogo.
 * La correcta se captura como texto ANTES de barajar, usando el índice original
 * (que en todos los temas es 0, pero se respeta por si el admin lo cambia).
 */
export function dialogueChoice(
  topicId: string,
  line: DialogueLineLike,
  turnIndex: number,
): DialogueChoice | null {
  if (!line.options?.length) return null;
  const correct = line.options[line.correct ?? 0];
  return {
    key: `d:${turnIndex}`,
    correct,
    options: shuffleSeeded(line.options, mrSeed(topicId, 'dialogo', String(turnIndex))),
  };
}
