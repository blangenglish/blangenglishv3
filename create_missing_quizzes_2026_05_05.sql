
-- ============================================================
-- CREAR QUIZZES FALTANTES
-- ============================================================

-- ─── 1. Unidad 670322d1 (The Alphabet) ─── LISTENING quiz ───────────────────
INSERT INTO unit_stage_quizzes (unit_id, stage, questions)
VALUES (
  '670322d1-a2c9-40aa-b712-963dec2f9197',
  'listening',
  '[
    {
      "id": "alph-l1",
      "type": "multiple_choice",
      "question": "What is the activity called in the video?",
      "options": ["Spelling Bee", "Grammar Race", "Vocabulary Test", "Word Match"],
      "correctAnswer": "Spelling Bee"
    },
    {
      "id": "alph-l2",
      "type": "multiple_choice",
      "question": "How many vowels are in the English alphabet?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "5"
    },
    {
      "id": "alph-l3",
      "type": "multiple_choice",
      "question": "Which of these is a vowel?",
      "options": ["B", "C", "E", "G"],
      "correctAnswer": "E"
    },
    {
      "id": "alph-l4",
      "type": "multiple_choice",
      "question": "How many letters does the English alphabet have?",
      "options": ["24", "25", "26", "27"],
      "correctAnswer": "26"
    },
    {
      "id": "alph-l5",
      "type": "multiple_choice",
      "question": "In the Spelling Bee activity, what should you use to write what you hear?",
      "options": ["A computer", "A pencil and paper", "Your phone", "A whiteboard"],
      "correctAnswer": "A pencil and paper"
    }
  ]'::jsonb
)
ON CONFLICT (unit_id, stage) DO UPDATE SET questions = EXCLUDED.questions;

-- ─── 2. Unidad 670322d1 (The Alphabet) ─── READING quiz ─────────────────────
INSERT INTO unit_stage_quizzes (unit_id, stage, questions)
VALUES (
  '670322d1-a2c9-40aa-b712-963dec2f9197',
  'reading',
  '[
    {
      "id": "alph-r1",
      "type": "multiple_choice",
      "question": "How old is Tom in the story?",
      "options": ["Five years old", "Six years old", "Seven years old", "Eight years old"],
      "correctAnswer": "Seven years old"
    },
    {
      "id": "alph-r2",
      "type": "multiple_choice",
      "question": "What is the name of Tom''s teacher?",
      "options": ["Miss Sara", "Miss Anna", "Miss Mary", "Miss Jane"],
      "correctAnswer": "Miss Anna"
    },
    {
      "id": "alph-r3",
      "type": "multiple_choice",
      "question": "What are the vowels in English?",
      "options": ["A, B, C, D, E", "A, E, I, O, U", "B, D, F, G, H", "A, E, I, O, Y"],
      "correctAnswer": "A, E, I, O, U"
    },
    {
      "id": "alph-r4",
      "type": "multiple_choice",
      "question": "According to Miss Anna, what do vowels help us do?",
      "options": ["Count numbers", "Make words", "Write sentences", "Read books"],
      "correctAnswer": "Make words"
    },
    {
      "id": "alph-r5",
      "type": "multiple_choice",
      "question": "What does Tom love according to the story?",
      "options": ["Math and numbers", "Letters and words", "Sports and games", "Art and drawing"],
      "correctAnswer": "Letters and words"
    },
    {
      "id": "alph-r6",
      "type": "multiple_choice",
      "question": "What type of letters are A, E, I, O, U?",
      "options": ["Consonants", "Vowels", "Syllables", "Nouns"],
      "correctAnswer": "Vowels"
    }
  ]'::jsonb
)
ON CONFLICT (unit_id, stage) DO UPDATE SET questions = EXCLUDED.questions;

-- ─── 3. Unidad 8648f758 (Simple Present WH Questions) ─── LISTENING quiz ────
INSERT INTO unit_stage_quizzes (unit_id, stage, questions)
VALUES (
  '8648f758-13ce-40af-a175-4919790b3a2b',
  'listening',
  '[
    {
      "id": "spwh-l1",
      "type": "multiple_choice",
      "question": "Which word is a WH question word?",
      "options": ["Is", "Do", "Where", "Am"],
      "correctAnswer": "Where"
    },
    {
      "id": "spwh-l2",
      "type": "multiple_choice",
      "question": "How do you make a negative sentence in Simple Present?",
      "options": ["Subject + not + verb", "Subject + do/does + not + verb", "Subject + verb + not", "Not + subject + verb"],
      "correctAnswer": "Subject + do/does + not + verb"
    },
    {
      "id": "spwh-l3",
      "type": "multiple_choice",
      "question": "Which sentence is correct?",
      "options": ["She don''t like coffee.", "She doesn''t likes coffee.", "She doesn''t like coffee.", "She not like coffee."],
      "correctAnswer": "She doesn''t like coffee."
    },
    {
      "id": "spwh-l4",
      "type": "multiple_choice",
      "question": "Which WH word asks about a person?",
      "options": ["What", "Where", "When", "Who"],
      "correctAnswer": "Who"
    },
    {
      "id": "spwh-l5",
      "type": "multiple_choice",
      "question": "Choose the correct negative: ''They ___ play tennis.''",
      "options": ["doesn''t", "don''t", "not", "isn''t"],
      "correctAnswer": "don''t"
    },
    {
      "id": "spwh-l6",
      "type": "multiple_choice",
      "question": "What does WH stand for in WH questions?",
      "options": ["When, Here", "Who, How", "Question words that start with W or H", "Wrong, Hard"],
      "correctAnswer": "Question words that start with W or H"
    }
  ]'::jsonb
)
ON CONFLICT (unit_id, stage) DO UPDATE SET questions = EXCLUDED.questions;

-- ─── 4. Unidad 40ed60cc (Pronouns) ─── LISTENING quiz ───────────────────────
-- This unit has no listening material - we add a listening comprehension quiz
-- about pronouns (audio-style questions)
INSERT INTO unit_stage_quizzes (unit_id, stage, questions)
VALUES (
  '40ed60cc-6d9d-435d-864b-d2ccb71e3fec',
  'listening',
  '[
    {
      "id": "pron-l1",
      "type": "multiple_choice",
      "question": "Listen and choose: ''___ is my book. Give it to ___.''",
      "options": ["This / me", "It / I", "My / I", "Mine / she"],
      "correctAnswer": "This / me"
    },
    {
      "id": "pron-l2",
      "type": "multiple_choice",
      "question": "Which is a subject pronoun?",
      "options": ["me", "him", "she", "them"],
      "correctAnswer": "she"
    },
    {
      "id": "pron-l3",
      "type": "multiple_choice",
      "question": "Which is an object pronoun?",
      "options": ["I", "we", "they", "us"],
      "correctAnswer": "us"
    },
    {
      "id": "pron-l4",
      "type": "multiple_choice",
      "question": "Complete: ''___ gave the book to ___.'' (John / Maria)",
      "options": ["He / her", "Him / she", "His / hers", "He / she"],
      "correctAnswer": "He / her"
    },
    {
      "id": "pron-l5",
      "type": "multiple_choice",
      "question": "Which sentence uses a possessive pronoun correctly?",
      "options": ["That bag is her.", "That bag is hers.", "That bag is she.", "That bag is her''s."],
      "correctAnswer": "That bag is hers."
    }
  ]'::jsonb
)
ON CONFLICT (unit_id, stage) DO UPDATE SET questions = EXCLUDED.questions;

-- Verify results
SELECT unit_id, stage, jsonb_array_length(questions) AS num_questions
FROM unit_stage_quizzes
WHERE unit_id IN (
  '670322d1-a2c9-40aa-b712-963dec2f9197',
  '8648f758-13ce-40af-a175-4919790b3a2b',
  '40ed60cc-6d9d-435d-864b-d2ccb71e3fec'
)
ORDER BY unit_id, stage;
