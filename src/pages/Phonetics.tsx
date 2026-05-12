// @ts-nocheck
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Volume2, CheckCircle2, XCircle, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { ROUTE_PATHS } from '@/lib/index';
// Web Speech API — pronuncia palabras en inglés con la voz del navegador
function getEnglishVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en')) || null;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.82;
  const eng = getEnglishVoice();
  if (eng) utt.voice = eng;
  window.speechSynthesis.speak(utt);
}

function speakDemo(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.75;
  utt.pitch = 1;
  const eng = getEnglishVoice();
  if (eng) utt.voice = eng;
  window.speechSynthesis.speak(utt);
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SOUNDS = [
  // ── VOCALES ──────────────────────────────────────────────────────────────
  {
    id: 'i-long',
    symbol: 'iː',
    display: '[iː]',
    name: 'Long EE',
    nameEs: 'I larga',
    demos: [{ label: '[iː]', text: 'ee' }],
    category: 'vowel',
    color: 'from-violet-500 to-purple-600',
    light: 'bg-violet-50 border-violet-200',
    examples: [
      { word: 'see', highlight: 'ee', translation: 'ver' },
      { word: 'meet', highlight: 'ee', translation: 'conocer' },
      { word: 'believe', highlight: 'ie', translation: 'creer' },
      { word: 'key', highlight: 'ey', translation: 'llave' },
    ],
    spanishNote: 'Igual a la "i" en "sí" pero más larga y tensa. Estira los labios hacia los lados como si sonrieras.',
    patterns: [
      { spelling: 'ee', examples: 'see, meet, tree, feet, need' },
      { spelling: 'ea', examples: 'sea, read, clean, teach, speak' },
      { spelling: 'ie', examples: 'believe, piece, field, brief' },
      { spelling: 'e', examples: 'me, he, she, we, be' },
      { spelling: 'ey', examples: 'key, money, honey, donkey' },
    ],
    exercises: [
      {
        id: 'i-long-1',
        question: '¿Cuál de estas palabras tiene el sonido [iː]?',
        options: ['sit', 'see', 'set'],
        correct: 1,
        explanation: '"See" /siː/ tiene la vocal [iː] larga. "Sit" tiene [ɪ] corto y "set" tiene [ε].',
      },
      {
        id: 'i-long-2',
        question: '¿Cuál de estas palabras rima con "feet"?',
        options: ['fit', 'fat', 'meet', 'met'],
        correct: 2,
        explanation: '"Meet" /miːt/ rima con "feet" /fiːt/ — ambas tienen el sonido [iː] largo.',
      },
      {
        id: 'i-long-3',
        question: '¿Cuál de estas palabras NO tiene el sonido [iː]?',
        options: ['beach', 'king', 'people'],
        correct: 1,
        explanation: '"King" tiene el sonido [ɪ] corto, no [iː]. "Beach" y "people" sí tienen [iː].',
      },
      {
        id: 'i-long-4',
        type: 'listen',
        question: 'Escucha la palabra y selecciona lo que oyes:',
        audio: 'sheep',
        options: ['ship', 'sheep', 'shape', 'shop'],
        correct: 1,
        explanation: 'Se escucha "sheep" /ʃiːp/ con [iː] largo. "Ship" tendría [ɪ] corto.',
      },
      {
        id: 'i-long-5',
        type: 'listen',
        question: 'Escucha y elige la palabra correcta:',
        audio: 'beach',
        options: ['bitch', 'beach', 'batch', 'botch'],
        correct: 1,
        explanation: '"Beach" /biːʧ/ tiene [iː]. Nota la diferencia con palabras que tienen otras vocales.',
      },
    ],
  },
  {
    id: 'i-short',
    symbol: 'ɪ',
    display: '[ɪ]',
    name: 'Short I',
    demos: [{ label: '[ɪ]', text: 'ih' }],
    nameEs: 'I corta',
    category: 'vowel',
    color: 'from-blue-500 to-indigo-600',
    light: 'bg-blue-50 border-blue-200',
    examples: [
      { word: 'sit', highlight: 'i', translation: 'sentarse' },
      { word: 'fish', highlight: 'i', translation: 'pescado' },
      { word: 'give', highlight: 'i', translation: 'dar' },
      { word: 'busy', highlight: 'u', translation: 'ocupado' },
    ],
    spanishNote: 'Parecida a la "i" en "ir" pero muy breve y relajada. No estires los labios — la boca queda ligeramente abierta.',
    patterns: [
      { spelling: 'i', examples: 'sit, fish, big, think, with' },
      { spelling: 'y', examples: 'gym, symbol, system, myth' },
      { spelling: 'ui', examples: 'build, guilt, guitar' },
      { spelling: 'e', examples: 'women, pretty, english' },
    ],
    exercises: [
      {
        id: 'i-short-1',
        question: '¿Cuál de estas palabras tiene el sonido [ɪ]?',
        options: ['see', 'sit', 'say'],
        correct: 1,
        explanation: '"Sit" /sɪt/ tiene el sonido [ɪ] corto y relajado. "See" tiene [iː] largo y "say" tiene [eɪ].',
      },
      {
        id: 'i-short-2',
        question: '¿Cuál de estas palabras tiene el sonido [ɪ]?',
        options: ['feet', 'fill', 'feel'],
        correct: 1,
        explanation: '"Fill" /fɪl/ tiene [ɪ] corto. "Feet" y "feel" tienen [iː] largo.',
      },
      {
        id: 'i-short-3',
        question: '¿Cuántos sonidos [ɪ] hay en la frase "this is it"?',
        options: ['1', '2', '3'],
        correct: 2,
        explanation: 'Los tres: "this" /ðɪs/, "is" /ɪz/, "it" /ɪt/ — todos tienen [ɪ].',
      },
      {
        id: 'i-short-4',
        type: 'listen',
        question: 'Escucha la palabra y selecciona lo que oyes:',
        audio: 'ship',
        options: ['sheep', 'shop', 'ship', 'shape'],
        correct: 2,
        explanation: 'Se escucha "ship" /ʃɪp/ con [ɪ] corto. "Sheep" tendría [iː] largo.',
      },
      {
        id: 'i-short-5',
        type: 'listen',
        question: 'Escucha y elige la palabra correcta:',
        audio: 'live',
        options: ['leave', 'love', 'live', 'lave'],
        correct: 2,
        explanation: '"Live" (verbo) /lɪv/ tiene [ɪ]. "Leave" /liːv/ tiene [iː] largo.',
      },
    ],
  },
  {
    id: 'ei',
    symbol: 'eɪ',
    display: '[eɪ]',
    name: 'Long A',
    nameEs: 'A larga (diptongo)',
    demos: [{ label: '[eɪ]', text: 'ay' }],
    category: 'vowel',
    color: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50 border-amber-200',
    examples: [
      { word: 'say', highlight: 'ay', translation: 'decir' },
      { word: 'make', highlight: 'a-e', translation: 'hacer' },
      { word: 'rain', highlight: 'ai', translation: 'lluvia' },
      { word: 'eight', highlight: 'eigh', translation: 'ocho' },
    ],
    spanishNote: 'Es un diptongo: empieza como la "e" española y desliza hacia la "i". No pronuncies solo "e" — el sonido se mueve.',
    patterns: [
      { spelling: 'a-e', examples: 'make, cake, name, late, same' },
      { spelling: 'ai', examples: 'rain, train, wait, main, claim' },
      { spelling: 'ay', examples: 'say, day, play, way, stay' },
      { spelling: 'ei', examples: 'eight, weight, vein, rein' },
    ],
    exercises: [
      {
        id: 'ei-1',
        question: '¿Cuál de estas palabras tiene el sonido [eɪ]?',
        options: ['make', 'back', 'beck'],
        correct: 0,
        explanation: '"Make" /meɪk/ tiene el diptongo [eɪ]. "Back" y "beck" tienen vocales cortas diferentes.',
      },
      {
        id: 'ei-2',
        question: '¿Cuál de estas palabras tiene el sonido [eɪ]?',
        options: ['red', 'rid', 'rain'],
        correct: 2,
        explanation: '"Rain" /reɪn/ tiene el diptongo [eɪ]. "Red" tiene [ε] y "rid" tiene [ɪ].',
      },
      {
        id: 'ei-3',
        question: '¿Cuál de estas palabras NO tiene el sonido [eɪ]?',
        options: ['eight', 'head', 'say'],
        correct: 1,
        explanation: '"Head" /hɛd/ tiene el sonido [ε] corto. "Eight" y "say" sí tienen [eɪ].',
      },
    ],
  },
  {
    id: 'epsilon',
    symbol: 'ε',
    display: '[ε]',
    name: 'Short E',
    nameEs: 'E corta',
    demos: [{ label: '[ε]', text: 'eh' }],
    category: 'vowel',
    color: 'from-green-500 to-emerald-600',
    light: 'bg-green-50 border-green-200',
    examples: [
      { word: 'set', highlight: 'e', translation: 'poner' },
      { word: 'head', highlight: 'ea', translation: 'cabeza' },
      { word: 'said', highlight: 'ai', translation: 'dijo' },
      { word: 'friend', highlight: 'ie', translation: 'amigo' },
    ],
    spanishNote: 'Similar a la "e" española, con la boca semi-abierta. Más relajada que la "e" del español.',
    patterns: [
      { spelling: 'e', examples: 'set, bed, tell, help, went' },
      { spelling: 'ea', examples: 'head, dead, bread, health, weather' },
      { spelling: 'ai', examples: 'said, again, against' },
      { spelling: 'ie', examples: 'friend, friendly, friendliness' },
    ],
    exercises: [
      {
        id: 'epsilon-1',
        question: '¿Cuál de estas palabras tiene el sonido [ε]?',
        options: ['bead', 'bed', 'bid'],
        correct: 1,
        explanation: '"Bed" /bɛd/ tiene [ε]. "Bead" tiene [iː] y "bid" tiene [ɪ].',
      },
      {
        id: 'epsilon-2',
        question: '¿"head" tiene el mismo sonido vocálico que…?',
        options: ['heat', 'dead', 'heed'],
        correct: 1,
        explanation: '"Dead" /dɛd/ comparte el sonido [ε] con "head" /hɛd". Ambas tienen "ea" = [ε].',
      },
      {
        id: 'epsilon-3',
        question: '¿Cuál de estas palabras NO tiene [ε]?',
        options: ['said', 'made', 'bread'],
        correct: 1,
        explanation: '"Made" /meɪd/ tiene el diptongo [eɪ], no [ε]. "Said" y "bread" sí tienen [ε].',
      },
    ],
  },
  {
    id: 'ae',
    symbol: 'æ',
    display: '[æ]',
    name: 'Short A',
    nameEs: 'A abierta',
    demos: [{ label: '[æ]', text: 'ah' }],
    category: 'vowel',
    color: 'from-pink-500 to-rose-600',
    light: 'bg-pink-50 border-pink-200',
    examples: [
      { word: 'cat', highlight: 'a', translation: 'gato' },
      { word: 'man', highlight: 'a', translation: 'hombre' },
      { word: 'hand', highlight: 'a', translation: 'mano' },
      { word: 'laugh', highlight: 'au', translation: 'reír' },
    ],
    spanishNote: '¡No existe en español! La quijada cae mucho y los labios se estiran hacia los lados. Más abierta que la "e" española. Practica exagerando la apertura de la boca.',
    patterns: [
      { spelling: 'a', examples: 'cat, man, apple, hand, laugh, black, that' },
    ],
    exercises: [
      {
        id: 'ae-1',
        question: '¿Cuál de estas palabras tiene el sonido [æ]?',
        options: ['cut', 'cat', 'cart'],
        correct: 1,
        explanation: '"Cat" /kæt/ tiene [æ]. "Cut" tiene [ʌ] y "cart" tiene [ɑː].',
      },
      {
        id: 'ae-2',
        question: '¿Cuál de estas palabras rima con "man"?',
        options: ['moon', 'mine', 'can'],
        correct: 2,
        explanation: '"Can" /kæn/ rima con "man" /mæn/ — ambas tienen [æ].',
      },
      {
        id: 'ae-3',
        question: '¿Cuántos sonidos [æ] hay en "the black cat sat"?',
        options: ['2', '3', '4'],
        correct: 1,
        explanation: '"black" /blæk/, "cat" /kæt/, "sat" /sæt/ — tres palabras con [æ].',
      },
    ],
  },
  {
    id: 'alpha',
    symbol: 'ɑː',
    display: '[ɑː]',
    name: 'Long AH',
    nameEs: 'A profunda',
    demos: [{ label: '[ɑː]', text: 'ah' }],
    category: 'vowel',
    color: 'from-teal-500 to-cyan-600',
    light: 'bg-teal-50 border-teal-200',
    examples: [
      { word: 'car', highlight: 'ar', translation: 'carro' },
      { word: 'father', highlight: 'a', translation: 'padre' },
      { word: 'palm', highlight: 'a', translation: 'palma' },
      { word: 'hot', highlight: 'o', translation: 'caliente (AmE)' },
    ],
    spanishNote: 'Parecida a la "a" española pero más profunda, desde el fondo de la garganta. La mandíbula cae y la lengua queda baja y plana.',
    patterns: [
      { spelling: 'ar', examples: 'car, park, start, dark, farm' },
      { spelling: 'a', examples: 'father, palm, calm, half, bath (BrE)' },
      { spelling: 'o', examples: 'hot, lot, top, stop, clock (AmE)' },
    ],
    exercises: [
      {
        id: 'alpha-1',
        question: '¿Cuál de estas palabras tiene el sonido [ɑː]?',
        options: ['cut', 'car', 'cure'],
        correct: 1,
        explanation: '"Car" /kɑːr/ tiene [ɑː]. "Cut" tiene [ʌ] y "cure" tiene [juː].',
      },
      {
        id: 'alpha-2',
        question: 'En inglés americano, ¿qué par de palabras comparte el sonido [ɑː]?',
        options: ['hot / hat', 'hot / car', 'hat / car'],
        correct: 1,
        explanation: '"Hot" /hɑːt/ y "car" /kɑːr/ comparten [ɑː] en el inglés americano.',
      },
      {
        id: 'alpha-3',
        question: '¿Cuál de estas palabras NO tiene [ɑː]?',
        options: ['park', 'calm', 'cat'],
        correct: 2,
        explanation: '"Cat" /kæt/ tiene [æ], no [ɑː]. "Park" y "calm" sí tienen [ɑː].',
      },
    ],
  },
  // ── VOCALES PLACEHOLDER ───────────────────────────────────────────────────
  {
    id: 'wedge',
    symbol: 'ʌ',
    display: '[ʌ]',
    name: 'Short U',
    nameEs: 'U corta (schwa tónica)',
    demos: [{ label: '[ʌ]', text: 'uh' }],
    category: 'vowel',
    color: 'from-orange-500 to-amber-600',
    light: 'bg-orange-50 border-orange-200',
    examples: [
      { word: 'cup', highlight: 'u', translation: 'taza' },
      { word: 'sun', highlight: 'u', translation: 'sol' },
      { word: 'love', highlight: 'o', translation: 'amor' },
      { word: 'blood', highlight: 'oo', translation: 'sangre' },
    ],
    spanishNote: 'Sonido central y corto. No existe en español. La boca está semi-abierta y relajada.',
    patterns: [
      { spelling: 'u', examples: 'cup, sun, run, fun, butter' },
      { spelling: 'o', examples: 'love, come, some, money, done' },
      { spelling: 'oo', examples: 'blood, flood' },
    ],
    exercises: [
      { id: 'wedge-1', question: '¿Cuál tiene [ʌ]?', options: ['foot', 'food', 'fun'], correct: 2, explanation: '"Fun" /fʌn/ tiene [ʌ]. Próximamente más ejercicios.' },
      { id: 'wedge-2', question: '¿Cuál tiene [ʌ]?', options: ['cool', 'call', 'cup'], correct: 2, explanation: '"Cup" /kʌp/ tiene [ʌ].' },
      { id: 'wedge-3', question: '¿"love" y "sun" comparten el mismo sonido vocálico?', options: ['Sí', 'No', 'Solo parcialmente'], correct: 0, explanation: 'Sí, ambas tienen [ʌ]: love /lʌv/, sun /sʌn/.' },
    ],
  },
  {
    id: 'schwa',
    symbol: 'ə',
    display: '[ə]',
    name: 'Schwa',
    nameEs: 'Schwa (vocal reducida)',
    demos: [{ label: '[ə]', text: 'uh' }],
    category: 'vowel',
    color: 'from-slate-500 to-gray-600',
    light: 'bg-slate-50 border-slate-200',
    examples: [
      { word: 'about', highlight: 'a', translation: 'acerca de' },
      { word: 'problem', highlight: 'e', translation: 'problema' },
      { word: 'family', highlight: 'i', translation: 'familia' },
      { word: 'sofa', highlight: 'a', translation: 'sofá' },
    ],
    spanishNote: 'El sonido más común del inglés — aparece en sílabas sin acento. Muy relajado, casi neutro. La boca está casi cerrada.',
    patterns: [
      { spelling: 'a', examples: 'about, banana, cinema' },
      { spelling: 'e', examples: 'problem, the, taken' },
      { spelling: 'i', examples: 'family, possible, pencil' },
      { spelling: 'o', examples: 'today, connect, memory' },
    ],
    exercises: [
      { id: 'schwa-1', question: '¿En "about", qué letra representa el schwa [ə]?', options: ['b', 'a', 'u'], correct: 1, explanation: 'La "a" inicial de "about" es el schwa: /əˈbaʊt/.' },
      { id: 'schwa-2', question: '¿Cuál sílaba tiene [ə] en "family"?', options: ['fa-', '-mi-', '-ly'], correct: 1, explanation: 'La sílaba "-mi-" se reduce a [ə]: /ˈfæm.ə.li/.' },
      { id: 'schwa-3', question: '¿El schwa aparece en sílabas…?', options: ['con acento', 'sin acento', 'siempre al final'], correct: 1, explanation: 'El schwa solo aparece en sílabas átonas (sin acento).' },
    ],
  },
  {
    id: 'ou',
    symbol: 'oʊ',
    display: '[oʊ]',
    name: 'Long O',
    nameEs: 'O larga (diptongo)',
    demos: [{ label: '[oʊ]', text: 'oh' }],
    category: 'vowel',
    color: 'from-indigo-500 to-blue-600',
    light: 'bg-indigo-50 border-indigo-200',
    examples: [
      { word: 'go', highlight: 'o', translation: 'ir' },
      { word: 'home', highlight: 'o-e', translation: 'hogar' },
      { word: 'boat', highlight: 'oa', translation: 'bote' },
      { word: 'show', highlight: 'ow', translation: 'mostrar' },
    ],
    spanishNote: 'Diptongo que empieza en "o" y desliza a "u". No pronuncies solo "o" — el sonido se mueve hacia adelante.',
    patterns: [
      { spelling: 'o-e', examples: 'home, note, code, hope' },
      { spelling: 'oa', examples: 'boat, road, coat, toast' },
      { spelling: 'ow', examples: 'show, know, grow, flow' },
      { spelling: 'o', examples: 'go, no, so, open' },
    ],
    exercises: [
      { id: 'ou-1', question: '¿Cuál tiene [oʊ]?', options: ['hot', 'home', 'hop'], correct: 1, explanation: '"Home" /hoʊm/ tiene el diptongo [oʊ].' },
      { id: 'ou-2', question: '¿Cuál rima con "go"?', options: ['got', 'god', 'show'], correct: 2, explanation: '"Show" /ʃoʊ/ rima con "go" /goʊ/ — ambas tienen [oʊ].' },
      { id: 'ou-3', question: '¿Cuál NO tiene [oʊ]?', options: ['boat', 'boot', 'note'], correct: 1, explanation: '"Boot" tiene [uː], no [oʊ]. "Boat" y "note" sí tienen [oʊ].' },
    ],
  },
  {
    id: 'u-long',
    symbol: 'uː',
    display: '[uː]',
    name: 'Long OO',
    nameEs: 'U larga',
    demos: [{ label: '[uː]', text: 'oo' }],
    category: 'vowel',
    color: 'from-purple-500 to-violet-600',
    light: 'bg-purple-50 border-purple-200',
    examples: [
      { word: 'food', highlight: 'oo', translation: 'comida' },
      { word: 'moon', highlight: 'oo', translation: 'luna' },
      { word: 'blue', highlight: 'ue', translation: 'azul' },
      { word: 'shoe', highlight: 'oe', translation: 'zapato' },
    ],
    spanishNote: 'Parecida a la "u" española pero más larga y con los labios más redondeados y tensos.',
    patterns: [
      { spelling: 'oo', examples: 'food, moon, cool, pool, school' },
      { spelling: 'ue', examples: 'blue, clue, true, glue' },
      { spelling: 'ew', examples: 'new, flew, grew, blew' },
      { spelling: 'u-e', examples: 'rule, June, tune, cube' },
    ],
    exercises: [
      { id: 'u-long-1', question: '¿Cuál tiene [uː]?', options: ['foot', 'food', 'fun'], correct: 1, explanation: '"Food" /fuːd/ tiene [uː] largo. "Foot" tiene [ʊ] corto.' },
      { id: 'u-long-2', question: '¿Cuál rima con "moon"?', options: ['man', 'men', 'soon'], correct: 2, explanation: '"Soon" /suːn/ rima con "moon" /muːn/.' },
      { id: 'u-long-3', question: '¿Cuál NO tiene [uː]?', options: ['blue', 'clue', 'club'], correct: 2, explanation: '"Club" /klʌb/ tiene [ʌ], no [uː].' },
    ],
  },
  // ── CONSONANTES ──────────────────────────────────────────────────────────
  {
    id: 't-d',
    symbol: 't / d',
    display: '[t] [d]',
    name: 'T and D',
    nameEs: 'T y D',
    demos: [{ label: '[t]', text: 'tah' }, { label: '[d]', text: 'dah' }],
    category: 'consonant',
    color: 'from-sky-500 to-blue-600',
    light: 'bg-sky-50 border-sky-200',
    examples: [
      { word: 'ten', highlight: 't', translation: 'diez' },
      { word: 'time', highlight: 't', translation: 'tiempo' },
      { word: 'day', highlight: 'd', translation: 'día' },
      { word: 'door', highlight: 'd', translation: 'puerta' },
    ],
    spanishNote: 'La [t] inglesa lleva un pequeño soplo de aire (aspiración) al inicio de sílaba. La [d] inglesa es más suave que en español. En posición media entre vocales, la [t] americana suena casi como una [d] rápida (better → "bedder").',
    patterns: [
      { spelling: 't', examples: 'ten, time, stop, cat, better' },
      { spelling: 'tt', examples: 'butter, letter, little, bottle' },
      { spelling: 'd', examples: 'day, door, hand, bad, word' },
      { spelling: 'dd', examples: 'add, odd, middle, wedding' },
    ],
    exercises: [
      { id: 't-d-1', question: 'En inglés americano, "better" y "butter" suenan casi igual porque la [t] entre vocales se pronuncia como…', options: ['[t] fuerte', '[d] suave', '[r]'], correct: 1, explanation: 'La [t] entre vocales en inglés americano se convierte en un "flap" que suena como [d]: better /ˈbɛdər/.' },
      { id: 't-d-2', question: '¿Cuál palabra tiene [t] con aspiración al inicio?', options: ['stop', 'top', 'step'], correct: 1, explanation: '"Top" /tʰɒp/ tiene [t] aspirada al inicio de sílaba. En "stop" no hay aspiración.' },
      { id: 't-d-3', question: '¿Cuál par son pares mínimos (solo cambia [t]/[d])?', options: ['tip / dip', 'ten / den', 'Ambas'], correct: 2, explanation: '"tip/dip" y "ten/den" son pares mínimos: solo difieren en [t] vs [d].' },
      { id: 't-d-4', type: 'listen', question: 'Escucha y selecciona la palabra que oyes:', audio: 'tip', options: ['dip', 'tip', 'tap', 'top'], correct: 1, explanation: 'Se escucha "tip" /tɪp/ con [t] sorda. "Dip" tendría [d] sonora.' },
      { id: 't-d-5', type: 'listen', question: 'Escucha y selecciona la palabra que oyes:', audio: 'day', options: ['say', 'bay', 'day', 'ray'], correct: 2, explanation: 'Se escucha "day" /deɪ/ que empieza con [d] sonora.' },
    ],
  },
  {
    id: 'ed-ending',
    symbol: '-ed',
    display: '[-ed]',
    name: 'Past tense -ed',
    nameEs: 'Pronunciación del -ed',
    demos: [{ label: '/t/ talked', text: 'talked' }, { label: '/d/ played', text: 'played' }, { label: '/ɪd/ wanted', text: 'wanted' }],
    category: 'consonant',
    color: 'from-violet-500 to-purple-600',
    light: 'bg-violet-50 border-violet-200',
    examples: [
      { word: 'walked', highlight: 'ed', translation: 'caminó → /t/' },
      { word: 'played', highlight: 'ed', translation: 'jugó → /d/' },
      { word: 'wanted', highlight: 'ed', translation: 'quiso → /ɪd/' },
      { word: 'needed', highlight: 'ed', translation: 'necesitó → /ɪd/' },
    ],
    spanishNote: 'El -ed del pasado NO siempre se pronuncia "ed". Tiene tres pronunciaciones distintas según el sonido final del verbo base.',
    patterns: [
      { spelling: '/t/ — después de sonidos sordos (p,k,f,s,ʃ,ʧ)', examples: 'walked, stopped, laughed, missed, watched' },
      { spelling: '/d/ — después de sonidos sonoros (b,g,v,z,m,n,l,r + vocales)', examples: 'played, loved, called, rained, opened' },
      { spelling: '/ɪd/ — después de [t] o [d]', examples: 'wanted, needed, waited, added, started' },
    ],
    exercises: [
      { id: 'ed-1', question: '¿Cómo se pronuncia el -ed en "walked"?', options: ['/ɪd/', '/d/', '/t/'], correct: 2, explanation: '"Walk" termina en [k] sordo → -ed se pronuncia /t/: walked /wɔːkt/.' },
      { id: 'ed-2', question: '¿Cómo se pronuncia el -ed en "played"?', options: ['/t/', '/d/', '/ɪd/'], correct: 1, explanation: '"Play" termina en vocal → -ed se pronuncia /d/: played /pleɪd/.' },
      { id: 'ed-3', question: '¿Cómo se pronuncia el -ed en "wanted"?', options: ['/t/', '/ɪd/', '/d/'], correct: 1, explanation: '"Want" termina en [t] → -ed se pronuncia /ɪd/: wanted /ˈwɒntɪd/.' },
    ],
  },
  {
    id: 'stops',
    symbol: 'p b k g',
    display: '[p] [b] [k] [g]',
    name: 'Stop Consonants',
    nameEs: 'Oclusivas sordas y sonoras',
    demos: [{ label: '[p]', text: 'pah' }, { label: '[b]', text: 'bah' }, { label: '[k]', text: 'kah' }, { label: '[g]', text: 'gah' }],
    category: 'consonant',
    color: 'from-orange-500 to-amber-600',
    light: 'bg-orange-50 border-orange-200',
    examples: [
      { word: 'pen', highlight: 'p', translation: 'bolígrafo' },
      { word: 'bag', highlight: 'b', translation: 'bolsa' },
      { word: 'key', highlight: 'k', translation: 'llave' },
      { word: 'go', highlight: 'g', translation: 'ir' },
    ],
    spanishNote: '[p], [k] se aspiran al inicio de sílaba (pequeño soplo de aire). [b] y [g] son más fuertes que en español — nunca se debilitan a sonidos fricativos como en "lobo" o "lago".',
    patterns: [
      { spelling: 'p / pp', examples: 'pen, stop, happy, wrap, cup' },
      { spelling: 'b / bb', examples: 'bag, rob, rabbit, climb' },
      { spelling: 'k / c / ck / qu', examples: 'key, cat, back, queen' },
      { spelling: 'g / gg', examples: 'go, big, egg, ghost' },
    ],
    exercises: [
      { id: 'stops-1', question: '¿En qué posición llevan aspiración [p] y [k]?', options: ['Final de sílaba', 'Inicio de sílaba acentuada', 'Entre vocales'], correct: 1, explanation: 'La aspiración ocurre al inicio de sílaba tónica: "pin" /pʰɪn/, "car" /kʰɑːr/.' },
      { id: 'stops-2', question: '¿Cómo se escribe el sonido [k] en "queen"?', options: ['k', 'c', 'qu'], correct: 2, explanation: 'En "queen", el sonido [k] se escribe "qu": /kwiːn/.' },
      { id: 'stops-3', question: 'La [b] inglesa en "bag" es…', options: ['Igual a la b española en "lobo"', 'Más fuerte, siempre oclusiva', 'Muda como en francés'], correct: 1, explanation: 'La [b] inglesa siempre es fuerte y oclusiva, nunca fricativa como la española en "lobo".' },
    ],
  },
  {
    id: 's-z',
    symbol: 's / z',
    display: '[s] [z]',
    name: 'S and Z',
    nameEs: 'S y Z',
    demos: [{ label: '[s]', text: 'sah' }, { label: '[z]', text: 'zah' }],
    category: 'consonant',
    color: 'from-green-500 to-emerald-600',
    light: 'bg-green-50 border-green-200',
    examples: [
      { word: 'sun', highlight: 's', translation: 'sol' },
      { word: 'see', highlight: 's', translation: 'ver' },
      { word: 'zoo', highlight: 'z', translation: 'zoológico' },
      { word: 'zero', highlight: 'z', translation: 'cero' },
    ],
    spanishNote: '[s] es similar a la "s" española. [z] es la versión sonora — vibra. En español no existe [z] como fonema independiente. Muchas palabras con "s" entre vocales tienen [z] en inglés.',
    patterns: [
      { spelling: 's', examples: 'sun, see, stop, this, class' },
      { spelling: 'ss', examples: 'miss, class, boss, grass' },
      { spelling: 'z', examples: 'zoo, zero, zone, buzz, jazz' },
      { spelling: 's (sonoro)', examples: 'easy, music, busy, because, his' },
    ],
    exercises: [
      { id: 's-z-1', question: '¿La "s" en "easy" se pronuncia [s] o [z]?', options: ['[s]', '[z]', '[ʃ]'], correct: 1, explanation: '"Easy" /ˈiːzi/ tiene [z] — la "s" entre vocales se hace sonora.' },
      { id: 's-z-2', question: '¿Cuál de estas palabras tiene [z]?', options: ['miss', 'his', 'this'], correct: 1, explanation: '"His" /hɪz/ termina en [z]. "Miss" y "this" terminan en [s].' },
      { id: 's-z-3', question: '¿[s] y [z] se diferencian por…?', options: ['Posición de lengua', 'Vibración vocal', 'Forma de labios'], correct: 1, explanation: '[s] es sordo (sin vibración), [z] es sonoro (con vibración de cuerdas).' },
    ],
  },
  {
    id: 's-ending',
    symbol: '-s',
    display: '[-s final]',
    name: 'Plural & 3rd person -s',
    nameEs: 'Pronunciación del -s final',
    demos: [{ label: '/s/ cats', text: 'cats' }, { label: '/z/ dogs', text: 'dogs' }, { label: '/ɪz/ watches', text: 'watches' }],
    category: 'consonant',
    color: 'from-lime-500 to-green-600',
    light: 'bg-lime-50 border-lime-200',
    examples: [
      { word: 'cats', highlight: 's', translation: 'gatos → /s/' },
      { word: 'dogs', highlight: 's', translation: 'perros → /z/' },
      { word: 'buses', highlight: 'es', translation: 'buses → /ɪz/' },
      { word: 'runs', highlight: 's', translation: 'corre → /z/' },
    ],
    spanishNote: 'Como el -ed, el -s final tiene tres pronunciaciones. Depende del sonido final de la palabra base.',
    patterns: [
      { spelling: '/s/ — después de sonidos sordos (p,t,k,f,θ)', examples: 'cats, books, stops, laughs, months' },
      { spelling: '/z/ — después de sonidos sonoros y vocales', examples: 'dogs, runs, plays, comes, girls' },
      { spelling: '/ɪz/ — después de [s,z,ʃ,ʒ,ʧ,ʤ]', examples: 'buses, roses, watches, pages, dishes' },
    ],
    exercises: [
      { id: 's-end-1', question: '¿Cómo se pronuncia la -s en "books"?', options: ['/z/', '/s/', '/ɪz/'], correct: 1, explanation: '"Book" termina en [k] sordo → -s = /s/: books /bʊks/.' },
      { id: 's-end-2', question: '¿Cómo se pronuncia la -s en "dogs"?', options: ['/s/', '/ɪz/', '/z/'], correct: 2, explanation: '"Dog" termina en [g] sonoro → -s = /z/: dogs /dɒgz/.' },
      { id: 's-end-3', question: '¿Por qué "watches" se pronuncia con /ɪz/?', options: ['Por costumbre', 'Porque termina en [ʧ]', 'Porque es irregular'], correct: 1, explanation: '"Watch" termina en [ʧ] → se añade /ɪz/ para separar dos sibilantes: watches /ˈwɒʧɪz/.' },
    ],
  },
  {
    id: 'f-v-h',
    symbol: 'f v h',
    display: '[f] [v] [h]',
    name: 'F, V and H',
    nameEs: 'F, V y H',
    demos: [{ label: '[f]', text: 'fah' }, { label: '[v]', text: 'vah' }, { label: '[h]', text: 'hah' }],
    category: 'consonant',
    color: 'from-fuchsia-500 to-pink-600',
    light: 'bg-fuchsia-50 border-fuchsia-200',
    examples: [
      { word: 'fish', highlight: 'f', translation: 'pescado' },
      { word: 'five', highlight: 'v', translation: 'cinco' },
      { word: 'have', highlight: 'v', translation: 'tener' },
      { word: 'house', highlight: 'h', translation: 'casa' },
    ],
    spanishNote: '[f] es igual a la española. [v] NO existe en español — los labios superiores tocan los dientes inferiores (labiodental), no como la "b/v" española. [h] es una aspiración suave — la "j" española pero mucho más suave.',
    patterns: [
      { spelling: 'f / ff / ph', examples: 'fish, off, phone, laugh, graph' },
      { spelling: 'v', examples: 'five, very, have, love, river' },
      { spelling: 'h', examples: 'house, hot, behind, who (muda en some words)' },
    ],
    exercises: [
      { id: 'f-v-h-1', question: '¿Cómo se produce la [v] inglesa?', options: ['Labios juntos (como b/v española)', 'Dientes superiores en labio inferior', 'Igual a la f pero más fuerte'], correct: 1, explanation: 'La [v] es labiodental: los dientes superiores tocan ligeramente el labio inferior, con vibración.' },
      { id: 'f-v-h-2', question: '¿La [h] inglesa es…?', options: ['Muda siempre', 'Como la j española', 'Una aspiración suave'], correct: 2, explanation: 'La [h] inglesa es una suave aspiración de aire — mucho más suave que la "j" española.' },
      { id: 'f-v-h-3', question: '"Phone" tiene el sonido [f]. ¿Cómo se escribe?', options: ['f', 'ph', 'Cualquiera de las dos'], correct: 1, explanation: '"Phone" usa "ph" para representar [f]: /foʊn/.' },
      { id: 'f-v-h-4', type: 'listen', question: 'Escucha y selecciona la palabra que oyes:', audio: 'fan', options: ['van', 'ban', 'fan', 'pan'], correct: 2, explanation: 'Se escucha "fan" /fæn/ con [f]. "Van" empezaría con [v] sonora.' },
      { id: 'f-v-h-5', type: 'listen', question: 'Escucha y selecciona la palabra que oyes:', audio: 'vine', options: ['fine', 'wine', 'vine', 'mine'], correct: 2, explanation: 'Se escucha "vine" /vaɪn/ con [v] sonora (dientes en labio + vibración).' },
    ],
  },
  {
    id: 'theta',
    symbol: 'θ',
    display: '[θ]',
    name: 'Voiceless TH',
    nameEs: 'TH sorda',
    demos: [{ label: '[θ]', text: 'think' }],
    category: 'consonant',
    color: 'from-rose-500 to-pink-600',
    light: 'bg-rose-50 border-rose-200',
    examples: [
      { word: 'think', highlight: 'th', translation: 'pensar' },
      { word: 'three', highlight: 'th', translation: 'tres' },
      { word: 'tooth', highlight: 'th', translation: 'diente' },
      { word: 'path', highlight: 'th', translation: 'camino' },
    ],
    spanishNote: 'No existe en español latinoamericano. Se produce poniendo la punta de la lengua entre los dientes superiores e inferiores y soplando aire. Sin vibración.',
    patterns: [
      { spelling: 'th', examples: 'think, three, tooth, path, bath, math' },
    ],
    exercises: [
      { id: 'theta-1', question: '¿Cómo se produce el sonido [θ]?', options: ['Labios juntos', 'Lengua entre dientes', 'Labios redondeados'], correct: 1, explanation: 'La lengua va entre los dientes superior e inferior, sin vibración.' },
      { id: 'theta-2', question: '¿Cuál tiene [θ]?', options: ['this', 'think', 'the'], correct: 1, explanation: '"Think" /θɪŋk/ tiene [θ] sordo. "This" y "the" tienen [ð] sonoro.' },
      { id: 'theta-3', question: '¿[θ] vibra las cuerdas vocales?', options: ['Sí', 'No', 'A veces'], correct: 1, explanation: '[θ] es sordo — no hay vibración de cuerdas vocales.' },
    ],
  },
  {
    id: 'eth',
    symbol: 'ð',
    display: '[ð]',
    name: 'Voiced TH',
    nameEs: 'TH sonora',
    demos: [{ label: '[ð]', text: 'the' }],
    category: 'consonant',
    color: 'from-red-500 to-rose-600',
    light: 'bg-red-50 border-red-200',
    examples: [
      { word: 'this', highlight: 'th', translation: 'este/esta' },
      { word: 'the', highlight: 'th', translation: 'el/la' },
      { word: 'father', highlight: 'th', translation: 'padre' },
      { word: 'breathe', highlight: 'th', translation: 'respirar' },
    ],
    spanishNote: 'Igual posición que [θ] (lengua entre dientes) pero con vibración de cuerdas vocales. Parecida a la "d" intervocálica del español en "cada".',
    patterns: [
      { spelling: 'th', examples: 'this, the, that, they, them, mother, father, breathe' },
    ],
    exercises: [
      { id: 'eth-1', question: '¿Cuál es la diferencia entre [θ] y [ð]?', options: ['Posición de lengua', 'Vibración vocal', 'Forma de labios'], correct: 1, explanation: '[ð] es sonoro (vibran las cuerdas), [θ] es sordo.' },
      { id: 'eth-2', question: '¿Cuál tiene [ð]?', options: ['think', 'this', 'thick'], correct: 1, explanation: '"This" /ðɪs/ tiene [ð] sonoro. "Think" y "thick" tienen [θ] sordo.' },
      { id: 'eth-3', question: '"The" en inglés se pronuncia con…', options: ['[θ]', '[ð]', '[d]'], correct: 1, explanation: '"The" /ðə/ usa [ð] sonoro, no [θ] ni [d].' },
    ],
  },
  {
    id: 'sh',
    symbol: 'ʃ',
    display: '[ʃ]',
    name: 'SH sound',
    nameEs: 'CH inglesa (SH)',
    demos: [{ label: '[ʃ]', text: 'sh' }],
    category: 'consonant',
    color: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50 border-emerald-200',
    examples: [
      { word: 'she', highlight: 'sh', translation: 'ella' },
      { word: 'show', highlight: 'sh', translation: 'mostrar' },
      { word: 'wish', highlight: 'sh', translation: 'desear' },
      { word: 'nation', highlight: 'ti', translation: 'nación' },
    ],
    spanishNote: 'Como la "ch" del español argentino o chileno en "yo". Labios hacia adelante, lengua atrás.',
    patterns: [
      { spelling: 'sh', examples: 'she, show, wish, fish, push' },
      { spelling: 'ti', examples: 'nation, station, action, mention' },
      { spelling: 'ci', examples: 'special, official, social' },
    ],
    exercises: [
      { id: 'sh-1', question: '¿Cuál tiene [ʃ]?', options: ['sea', 'she', 'see'], correct: 1, explanation: '"She" /ʃiː/ tiene el sonido [ʃ].' },
      { id: 'sh-2', question: '"nation" contiene [ʃ] en…', options: ['"na-"', '"-ti-"', '"-on"'], correct: 1, explanation: 'El grupo "-ti-" antes de vocal se pronuncia [ʃ]: /ˈneɪʃən/.' },
      { id: 'sh-3', question: '¿Cuál NO tiene [ʃ]?', options: ['wish', 'wash', 'was'], correct: 2, explanation: '"Was" /wɒz/ no tiene [ʃ]. "Wish" y "wash" sí lo tienen.' },
    ],
  },
  {
    id: 'r',
    symbol: 'r',
    display: '[r]',
    name: 'English R',
    nameEs: 'R inglesa',
    demos: [{ label: '[r]', text: 'rah' }],
    category: 'consonant',
    color: 'from-cyan-500 to-blue-600',
    light: 'bg-cyan-50 border-cyan-200',
    examples: [
      { word: 'red', highlight: 'r', translation: 'rojo' },
      { word: 'right', highlight: 'r', translation: 'correcto' },
      { word: 'write', highlight: 'wr', translation: 'escribir' },
      { word: 'three', highlight: 'r', translation: 'tres' },
    ],
    spanishNote: '¡Muy diferente a la "r" española! No vibra. La lengua se curva hacia atrás sin tocar el paladar. Los labios se redondean ligeramente.',
    patterns: [
      { spelling: 'r', examples: 'red, right, run, rain, room' },
      { spelling: 'wr', examples: 'write, wrong, wrist, wrap' },
      { spelling: 'rr', examples: 'carry, sorry, tomorrow, mirror' },
    ],
    exercises: [
      { id: 'r-1', question: '¿La "r" inglesa vibra como la española?', options: ['Sí', 'No', 'Solo en algunas palabras'], correct: 1, explanation: 'La [r] inglesa no vibra — la lengua se curva sin tocar el paladar.' },
      { id: 'r-2', question: '"write" se pronuncia…', options: ['/raɪt/', '/raɪt/ (la w es muda)', '/wraɪt/'], correct: 1, explanation: 'La "w" en "write" es muda: /raɪt/.' },
      { id: 'r-3', question: '¿Cuál es un error común de hispanohablantes con la [r] inglesa?', options: ['Hacerla muda', 'Hacerla vibrar como en español', 'Pronunciarla como [l]'], correct: 1, explanation: 'Muchos hispanohablantes vibran la [r] como en español, lo cual suena extraño en inglés.' },
    ],
  },
  {
    id: 'zh',
    symbol: 'ʒ',
    display: '[ʒ]',
    name: 'ZH sound',
    nameEs: 'S francesa (ZH)',
    demos: [{ label: '[ʒ]', text: 'measure' }],
    category: 'consonant',
    color: 'from-indigo-500 to-violet-600',
    light: 'bg-indigo-50 border-indigo-200',
    examples: [
      { word: 'measure', highlight: 'su', translation: 'medir/medida' },
      { word: 'television', highlight: 'si', translation: 'televisión' },
      { word: 'vision', highlight: 'si', translation: 'visión' },
      { word: 'beige', highlight: 'ge', translation: 'beige' },
    ],
    spanishNote: 'No existe en español. Es como [ʃ] pero con vibración vocal. Similar a la "j" francesa en "je" o la "ll" rioplatense en "calle".',
    patterns: [
      { spelling: 'su/si', examples: 'measure, treasure, vision, decision, television' },
      { spelling: 'ge/gi', examples: 'beige, garage, mirage' },
      { spelling: 'zu', examples: 'azure' },
    ],
    exercises: [
      { id: 'zh-1', question: '¿Cuál tiene [ʒ]?', options: ['she', 'measure', 'see'], correct: 1, explanation: '"Measure" /ˈmɛʒər/ tiene [ʒ]. "She" tiene [ʃ] (sin vibración).' },
      { id: 'zh-2', question: '[ʒ] y [ʃ] se diferencian en…', options: ['Posición de labios', 'Vibración vocal', 'Posición de lengua'], correct: 1, explanation: '[ʒ] es sonoro (cuerdas vibran), [ʃ] es sordo.' },
      { id: 'zh-3', question: '"television" — ¿dónde está [ʒ]?', options: ['"tele-"', '"-vi-"', '"-sion"'], correct: 2, explanation: 'El sufijo "-sion" se pronuncia /ʒən/ en palabras como television, vision.' },
    ],
  },
  {
    id: 'ch-j',
    symbol: 'ʧ / ʤ',
    display: '[ʧ] / [ʤ]',
    name: 'CH and J sounds',
    nameEs: 'CH y DY inglesas',
    demos: [{ label: '[ʧ]', text: 'church' }, { label: '[ʤ]', text: 'judge' }],
    category: 'consonant',
    color: 'from-orange-500 to-amber-600',
    light: 'bg-orange-50 border-orange-200',
    examples: [
      { word: 'church', highlight: 'ch', translation: 'iglesia' },
      { word: 'choose', highlight: 'ch', translation: 'elegir' },
      { word: 'judge', highlight: 'j/dge', translation: 'juez' },
      { word: 'June', highlight: 'J', translation: 'junio' },
    ],
    spanishNote: '[ʧ] existe en español como la "ch" en "mucho". [ʤ] es nueva — empieza como "d" y termina como la "ch" española, pero sonora.',
    patterns: [
      { spelling: 'ch', examples: 'church, choose, cheese, lunch, teach' },
      { spelling: 'tch', examples: 'watch, match, kitchen, catch' },
      { spelling: 'j', examples: 'judge, June, job, join, jump' },
      { spelling: 'dge', examples: 'bridge, edge, lodge, fridge' },
      { spelling: 'ge/gi', examples: 'age, page, giant, gym' },
    ],
    exercises: [
      { id: 'chj-1', question: '"church" contiene [ʧ]…', options: ['Solo al inicio', 'Solo al final', 'Al inicio y al final'], correct: 2, explanation: '/ʧɜːrʧ/ — [ʧ] aparece dos veces: "ch-urch".' },
      { id: 'chj-2', question: '¿Cuál tiene [ʤ]?', options: ['church', 'choose', 'judge'], correct: 2, explanation: '"Judge" /ʤʌʤ/ tiene [ʤ] al inicio y al final.' },
      { id: 'chj-3', question: '"gym" empieza con…', options: ['[g] como en "go"', '[ʤ] como en "judge"', '[j] como en "yes"'], correct: 1, explanation: '"Gym" /ʤɪm/ — la letra "g" ante e/i/y se pronuncia [ʤ].' },
    ],
  },
  {
    id: 'nasals',
    symbol: 'm / n / ŋ',
    display: '[m] / [n] / [ŋ]',
    name: 'Nasal sounds',
    nameEs: 'Sonidos nasales',
    demos: [{ label: '[m]', text: 'mah' }, { label: '[n]', text: 'nah' }, { label: '[ŋ]', text: 'sing' }],
    category: 'consonant',
    color: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50 border-teal-200',
    examples: [
      { word: 'man', highlight: 'm', translation: 'hombre' },
      { word: 'night', highlight: 'n', translation: 'noche' },
      { word: 'sing', highlight: 'ng', translation: 'cantar' },
      { word: 'ring', highlight: 'ng', translation: 'anillo' },
    ],
    spanishNote: '[m] y [n] son iguales al español. [ŋ] es nueva — es la "n" de "banco" o "tango" pero al final de sílaba, como en "sing". No hay [g] después.',
    patterns: [
      { spelling: 'm', examples: 'man, come, time, swim, dream' },
      { spelling: 'n', examples: 'night, sun, ten, open, begin' },
      { spelling: 'ng', examples: 'sing, ring, king, song, long' },
      { spelling: 'nk', examples: 'think, drink, pink, thank, bank' },
    ],
    exercises: [
      { id: 'nas-1', question: '"sing" termina en…', options: ['[n] + [g]', '[ŋ] solo', '[ng] dos sonidos'], correct: 1, explanation: '"Sing" /sɪŋ/ termina en [ŋ] — un solo sonido nasal velar, sin [g] separado.' },
      { id: 'nas-2', question: '"think" — ¿qué sonido nasal hay?', options: ['[m]', '[n]', '[ŋ]'], correct: 2, explanation: '"Think" /θɪŋk/ — "nk" se pronuncia [ŋk], con nasal velar.' },
      { id: 'nas-3', question: '¿Cuál tiene [ŋ]?', options: ['sun', 'sin', 'sing'], correct: 2, explanation: '"Sing" /sɪŋ/ tiene [ŋ]. "Sun" y "sin" tienen [n].' },
    ],
  },
  {
    id: 'l',
    symbol: 'l',
    display: '[l]',
    name: 'English L',
    nameEs: 'L inglesa (clara y oscura)',
    demos: [{ label: '[l]', text: 'lah' }],
    category: 'consonant',
    color: 'from-sky-500 to-cyan-600',
    light: 'bg-sky-50 border-sky-200',
    examples: [
      { word: 'let', highlight: 'l', translation: 'dejar' },
      { word: 'blue', highlight: 'l', translation: 'azul' },
      { word: 'milk', highlight: 'l', translation: 'leche' },
      { word: 'full', highlight: 'll', translation: 'lleno' },
    ],
    spanishNote: 'La "l" inicial (antes de vocal) es similar al español. La "l" final (después de vocal) es más oscura y resonante — la lengua sube pero la garganta resuena más.',
    patterns: [
      { spelling: 'l (inicial)', examples: 'let, like, look, play, blue, fly' },
      { spelling: 'l (final)', examples: 'milk, full, ball, feel, cool, tall' },
      { spelling: 'll', examples: 'full, bell, fill, sell, pull, well' },
    ],
    exercises: [
      { id: 'l-1', question: '¿La "l" en "feel" suena igual que en "let"?', options: ['Sí, idéntica', 'No, es más oscura al final', 'No existe al final'], correct: 1, explanation: '"Feel" /fiːl/ — la [l] final es más oscura (velarizada) que la [l] inicial en "let".' },
      { id: 'l-2', question: '"blue" — ¿la [l] es inicial o final?', options: ['Final', 'Inicial (antes de vocal)', 'Dentro de sílaba'], correct: 2, explanation: 'En "blue" /bluː/, la [l] va antes de la vocal [u], es [l] clara.' },
      { id: 'l-3', question: '¿Cuál tiene la [l] oscura (final)?', options: ['let', 'like', 'milk'], correct: 2, explanation: '"Milk" /mɪlk/ — la [l] después de vocal es oscura o velarizada.' },
    ],
  },
  {
    id: 'j-w',
    symbol: 'j / w',
    display: '[j] / [w]',
    name: 'Glides: Y and W',
    nameEs: 'Semivocales Y y W',
    demos: [{ label: '[j]', text: 'yah' }, { label: '[w]', text: 'wah' }],
    category: 'consonant',
    color: 'from-pink-500 to-rose-600',
    light: 'bg-pink-50 border-pink-200',
    examples: [
      { word: 'yes', highlight: 'y', translation: 'sí' },
      { word: 'year', highlight: 'y', translation: 'año' },
      { word: 'we', highlight: 'w', translation: 'nosotros' },
      { word: 'water', highlight: 'w', translation: 'agua' },
    ],
    spanishNote: '[j] es como la "y" en "yo" o la "i" en "bien". [w] es como la "u" en "bueno" o "huevo". Ambas son semivocales — la lengua/labios arrancan en posición vocálica y desllizan.',
    patterns: [
      { spelling: 'y', examples: 'yes, year, yellow, you, yet, yard' },
      { spelling: 'j (en onsets)', examples: 'use /juːz/, few /fjuː/, cute /kjuːt/, new /njuː/' },
      { spelling: 'w', examples: 'we, water, week, work, swim, twin' },
      { spelling: 'wh', examples: 'what, where, when, white, why, which' },
    ],
    exercises: [
      { id: 'jw-1', question: '"yes" empieza con…', options: ['[j] (semivocal)', '[i] (vocal)', '[dʒ] como judge'], correct: 0, explanation: '"Yes" /jɛs/ — comienza con [j], la semivocal palatal.' },
      { id: 'jw-2', question: '"use" (verbo) se pronuncia…', options: ['/uːz/', '/juːz/', '/wuːz/'], correct: 1, explanation: '"Use" /juːz/ — la letra "u" incluye el sonido [j] antes de la vocal larga.' },
      { id: 'jw-3', question: '¿Cuál tiene [w]?', options: ['year', 'you', 'water'], correct: 2, explanation: '"Water" /ˈwɔːtər/ tiene [w]. "Year" tiene [j] y "you" tiene [j] también.' },
    ],
  },
];

const VOWELS = SOUNDS.filter(s => s.category === 'vowel');
const CONSONANTS = SOUNDS.filter(s => s.category === 'consonant');

// ─── Component ────────────────────────────────────────────────────────────────

export default function Phonetics({ isLoggedIn, onOpenAuth, onLogout, userName }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('vowels');
  const [activeSound, setActiveSound] = useState('i-long');
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState({});
  const [completedSounds, setCompletedSounds] = useState(new Set());

  const currentList = activeSection === 'vowels' ? VOWELS : CONSONANTS;
  const sound = SOUNDS.find(s => s.id === activeSound) || SOUNDS[0];

  const handleAnswer = (exerciseId, optionIndex) => {
    if (exerciseSubmitted[exerciseId]) return;
    setExerciseAnswers(prev => ({ ...prev, [exerciseId]: optionIndex }));
  };

  const handleSubmit = (exercise) => {
    if (exerciseSubmitted[exercise.id]) return;
    setExerciseSubmitted(prev => ({ ...prev, [exercise.id]: true }));

    // Check if all exercises of this sound are now correct
    const allIds = sound.exercises.map(e => e.id);
    const newSubmitted = { ...exerciseSubmitted, [exercise.id]: true };
    const newAnswers = { ...exerciseAnswers };
    const allCorrect = allIds.every(id => {
      const ex = sound.exercises.find(e => e.id === id);
      return newSubmitted[id] && newAnswers[id] === ex.correct;
    });
    if (allCorrect) {
      setCompletedSounds(prev => new Set([...prev, sound.id]));
    }
  };

  const goToNextSound = () => {
    const idx = currentList.findIndex(s => s.id === activeSound);
    if (idx < currentList.length - 1) {
      setActiveSound(currentList[idx + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevSound = () => {
    const idx = currentList.findIndex(s => s.id === activeSound);
    if (idx > 0) {
      setActiveSound(currentList[idx - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentIdx = currentList.findIndex(s => s.id === activeSound);

  return (
    <Layout isLoggedIn={isLoggedIn} onOpenAuth={onOpenAuth} onLogout={onLogout} userName={userName}>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50/40 to-background">

        {/* ── Header ── */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(ROUTE_PATHS.DASHBOARD)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xl">🔊</span>
                <h1 className="font-bold text-base sm:text-lg text-foreground">Fonética del Inglés</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary bg-primary/5 shrink-0">
              {completedSounds.size} / {SOUNDS.length} sonidos
            </Badge>
          </div>

          {/* Section tabs */}
          <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-2">
            <button
              onClick={() => { setActiveSection('vowels'); setActiveSound(VOWELS[0].id); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeSection === 'vowels'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              🔵 Vocales ({VOWELS.length})
            </button>
            <button
              onClick={() => { setActiveSection('consonants'); setActiveSound(CONSONANTS[0].id); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeSection === 'consonants'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              🟢 Consonantes ({CONSONANTS.length})
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex flex-col w-52 shrink-0">
            <div className="sticky top-32 bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              <div className="px-3 py-2 border-b border-border/30 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {activeSection === 'vowels' ? 'Vocales' : 'Consonantes'}
                </p>
              </div>
              <div className="py-1 max-h-[60vh] overflow-y-auto">
                {currentList.map(s => {
                  const isActive = s.id === activeSound;
                  const isDone = completedSounds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSound(s.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-base">{s.display}</span>
                        <span className="text-xs text-muted-foreground hidden xl:inline truncate max-w-[70px]">{s.nameEs}</span>
                      </span>
                      {isDone
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        : isActive
                        ? <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                        : null
                      }
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={sound.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Mobile sound selector */}
                <div className="lg:hidden">
                  <select
                    value={activeSound}
                    onChange={e => setActiveSound(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                  >
                    {currentList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.display} — {s.nameEs} {completedSounds.has(s.id) ? '✅' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── Hero card ── */}
                <div className={`rounded-2xl bg-gradient-to-br ${sound.color} p-6 text-white shadow-lg`}>
                  <div className="mb-3">
                    <div className="text-6xl sm:text-7xl font-bold font-mono leading-none mb-3 drop-shadow-sm">
                      {sound.display}
                    </div>
                    <h2 className="text-xl font-bold">{sound.name}</h2>
                    <p className="text-white/80 text-sm mt-0.5">{sound.nameEs}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(sound.demos || [{ label: sound.display, text: sound.examples[0]?.word }]).map((d, i) => (
                      <button
                        key={i}
                        onClick={() => speakDemo(d.text)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all hover:scale-105 text-sm font-semibold"
                        title={`Escuchar ${d.label}`}
                      >
                        <Volume2 className="w-4 h-4" />
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Examples ── */}
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Ejemplos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sound.examples.map((ex, i) => (
                      <div key={i} className={`rounded-xl border ${sound.light} p-3 text-center`}>
                        <button
                          onClick={() => speak(ex.word)}
                          className="w-full"
                        >
                          <div className="font-bold text-base text-foreground flex items-center justify-center gap-1">
                            {ex.word}
                            <Volume2 className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{ex.translation}</div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Spanish comparison ── */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">🇪🇸</span>
                    <div>
                      <p className="font-semibold text-amber-900 text-sm mb-1">Comparación con el español</p>
                      <p className="text-amber-800 text-sm leading-relaxed">{sound.spanishNote}</p>
                    </div>
                  </div>
                </div>

                {/* ── Spelling patterns ── */}
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    📋 Patrones ortográficos
                  </h3>
                  <div className="space-y-2">
                    {sound.patterns.map((p, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                        <span className={`shrink-0 inline-block px-2.5 py-1 rounded-lg font-bold text-sm bg-gradient-to-r ${sound.color} text-white whitespace-nowrap`}>
                          {p.spelling}
                        </span>
                        <span className="text-sm text-foreground pt-0.5 leading-relaxed">{p.examples}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Exercises ── */}
                <div className="space-y-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    🎯 Ejercicios prácticos
                    {completedSounds.has(sound.id) && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                        ✅ ¡Completado!
                      </Badge>
                    )}
                  </h3>

                  {sound.exercises.map((ex, idx) => {
                    const answered = exerciseAnswers[ex.id] !== undefined;
                    const submitted = exerciseSubmitted[ex.id];
                    const selected = exerciseAnswers[ex.id];
                    const isCorrect = submitted && selected === ex.correct;
                    const isListen = ex.type === 'listen';

                    return (
                      <div key={ex.id} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                        <div className="flex items-start gap-2 mb-4">
                          <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            submitted
                              ? isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-sm leading-relaxed">{ex.question}</p>
                            {isListen && ex.audio && (
                              <button
                                onClick={() => speak(ex.audio)}
                                className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${sound.color} text-white text-sm font-semibold hover:opacity-90 transition-all hover:scale-105`}
                              >
                                <Volume2 className="w-4 h-4" />
                                Escuchar
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {ex.options.map((opt, i) => {
                            let cls = 'border-border/50 bg-background hover:bg-muted/50 text-foreground';
                            if (submitted) {
                              if (i === ex.correct) cls = 'border-green-400 bg-green-50 text-green-800 font-semibold';
                              else if (i === selected && i !== ex.correct) cls = 'border-red-400 bg-red-50 text-red-700';
                              else cls = 'border-border/30 bg-background/50 text-muted-foreground opacity-60';
                            } else if (i === selected) {
                              cls = 'border-primary bg-primary/10 text-primary font-semibold';
                            }
                            return (
                              <button
                                key={i}
                                onClick={() => handleAnswer(ex.id, i)}
                                disabled={submitted}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm text-left transition-all ${cls} ${!submitted ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 font-bold">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                {opt}
                                {submitted && i === ex.correct && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0" />}
                                {submitted && i === selected && i !== ex.correct && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {!submitted ? (
                          <Button
                            size="sm"
                            onClick={() => handleSubmit(ex)}
                            disabled={!answered}
                            className="rounded-xl"
                          >
                            Verificar respuesta
                          </Button>
                        ) : (
                          <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {isCorrect
                              ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            }
                            <p className={isCorrect ? 'text-green-800' : 'text-red-700'}>{ex.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between pt-2 pb-8">
                  <Button
                    variant="outline"
                    onClick={goToPrevSound}
                    disabled={currentIdx === 0}
                    className="rounded-xl gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIdx + 1} de {currentList.length}
                  </span>
                  <Button
                    onClick={goToNextSound}
                    disabled={currentIdx === currentList.length - 1}
                    className="rounded-xl gap-2"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Layout>
  );
}
