// @ts-nocheck
export interface MRVocab { word: string; translation: string; example: string; options: string[]; }
export interface MRPhrase { phrase: string; meaning: string; when: string; missing: string; options: string[]; correct: number; }
export interface MRStructure { title: string; explanation: string; examples: string[]; words: string[]; }
export interface MRDialogueLine { speaker: 'A' | 'B'; text: string; options?: string[]; correct?: number; }
export interface MRTopic {
  id: string; title: string; category: string; emoji: string;
  color: string; cardBg: string; badge: string;
  vocabulary: MRVocab[];
  phrases: MRPhrase[];
  structure: MRStructure;
  dialogue: MRDialogueLine[];
}

const placeholder = (overrides: Partial<MRTopic>): MRTopic => ({
  id: '', title: '', category: '', emoji: '📖',
  color: 'from-slate-500 to-gray-500', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700',
  vocabulary: [
    { word: 'excuse me', translation: 'disculpe', example: 'Excuse me, can you help me?', options: ['disculpe', 'gracias', 'por favor', 'ayuda'] },
    { word: 'please', translation: 'por favor', example: 'Can I have the menu, please?', options: ['por favor', 'disculpe', 'gracias', 'hola'] },
    { word: 'thank you', translation: 'gracias', example: 'Thank you very much!', options: ['gracias', 'por favor', 'disculpe', 'adiós'] },
    { word: 'help', translation: 'ayuda', example: 'I need help, please.', options: ['ayuda', 'problema', 'dinero', 'tiempo'] },
    { word: 'where', translation: 'dónde', example: 'Where is the exit?', options: ['dónde', 'cuándo', 'cómo', 'qué'] },
  ],
  phrases: [
    { phrase: 'Can you ___ me?', meaning: '¿Puede ayudarme?', when: 'Pedir ayuda', missing: 'help', options: ['help', 'see', 'find', 'know'], correct: 0 },
    { phrase: 'I don\'t ___.', meaning: 'No entiendo.', when: 'Confusión', missing: 'understand', options: ['understand', 'speak', 'hear', 'see'], correct: 0 },
    { phrase: 'Could you ___ that?', meaning: '¿Podría repetir eso?', when: 'Pedir repetición', missing: 'repeat', options: ['repeat', 'explain', 'translate', 'write'], correct: 0 },
    { phrase: 'How much does it ___?', meaning: '¿Cuánto cuesta?', when: 'Precio', missing: 'cost', options: ['cost', 'take', 'need', 'have'], correct: 0 },
  ],
  structure: {
    title: 'Using "Can I...?" for requests',
    explanation: 'Use "Can I...?" to politely ask for something or permission.',
    examples: ['Can I have the menu?', 'Can I pay by card?', 'Can I get some water?'],
    words: ['Can', 'I', 'get', 'some', 'water', '?'],
  },
  dialogue: [
    { speaker: 'A', text: 'Hello, how can I help you?' },
    { speaker: 'B', text: '___', options: ['I need some help, please.', 'Go away!', 'I don\'t know.', 'Maybe later.'], correct: 0 },
    { speaker: 'A', text: 'Of course! What do you need?' },
    { speaker: 'B', text: '___', options: ['Thank you very much!', 'Nothing.', 'I\'m fine.', 'Bye.'], correct: 0 },
  ],
  ...overrides,
});

export const MUNDO_REAL_TOPICS: MRTopic[] = [
  // ══════════════════════════════════════════════════════════
  // 1. COMIDA Y RESTAURANTES 🍽️
  // ══════════════════════════════════════════════════════════
  {
    id: 'en-restaurante',
    title: 'En el Restaurante',
    category: 'Comida y Restaurantes',
    emoji: '🍽️',
    color: 'from-orange-500 to-amber-500',
    cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
    badge: 'bg-orange-100 text-orange-700',
    vocabulary: [
      { word: 'menu', translation: 'carta / menú', example: 'Could I see the menu, please?', options: ['carta / menú', 'cuenta', 'plato', 'bebida'] },
      { word: 'waiter', translation: 'mesero / camarero', example: 'Excuse me, waiter! Can I order?', options: ['mesero / camarero', 'chef', 'cliente', 'gerente'] },
      { word: 'bill', translation: 'cuenta', example: 'Can we have the bill, please?', options: ['cuenta', 'menú', 'propina', 'cambio'] },
      { word: 'tip', translation: 'propina', example: 'Should I leave a tip?', options: ['propina', 'descuento', 'impuesto', 'precio'] },
      { word: 'reservation', translation: 'reservación', example: 'I have a reservation for two.', options: ['reservación', 'invitación', 'pedido', 'mesa'] },
      { word: 'appetizer', translation: 'entrada / aperitivo', example: 'For appetizer I\'ll have the soup.', options: ['entrada / aperitivo', 'postre', 'plato fuerte', 'bebida'] },
      { word: 'dessert', translation: 'postre', example: 'What desserts do you have?', options: ['postre', 'entrada', 'ensalada', 'sopa'] },
    ],
    phrases: [
      { phrase: 'A table for ___, please.', meaning: 'Una mesa para dos, por favor.', when: 'Al llegar al restaurante', missing: 'two', options: ['two', 'one', 'some', 'many'], correct: 0 },
      { phrase: 'I\'d like to ___ the steak.', meaning: 'Quisiera pedir el filete.', when: 'Ordenar comida', missing: 'order', options: ['order', 'cook', 'serve', 'taste'], correct: 0 },
      { phrase: 'What do you ___?', meaning: '¿Qué recomienda?', when: 'Pedir recomendación', missing: 'recommend', options: ['recommend', 'prefer', 'cook', 'serve'], correct: 0 },
      { phrase: 'Could I have the ___, please?', meaning: '¿Me podría traer la cuenta?', when: 'Pedir la cuenta', missing: 'bill', options: ['bill', 'menu', 'dessert', 'fork'], correct: 0 },
    ],
    structure: {
      title: 'I\'d like + noun / I\'d like to + verb',
      explanation: '"I\'d like" is a polite way to order or request something. More formal than "I want".',
      examples: ['I\'d like a coffee, please.', 'I\'d like to order now.', 'I\'d like the fish with salad.'],
      words: ['I\'d', 'like', 'the', 'pasta', 'with', 'salad', '.'],
    },
    dialogue: [
      { speaker: 'A', text: 'Good evening! Do you have a reservation?' },
      { speaker: 'B', text: '___', options: ['Yes, for two under Smith.', 'No, I don\'t eat here.', 'What time is it?', 'I\'m not hungry.'], correct: 0 },
      { speaker: 'A', text: 'Perfect! Right this way. Are you ready to order?' },
      { speaker: 'B', text: '___', options: ['I\'d like the salmon, please.', 'I want everything!', 'No food for me.', 'I already ate.'], correct: 0 },
      { speaker: 'A', text: 'Excellent choice! And to drink?' },
      { speaker: 'B', text: '___', options: ['A glass of water, please.', 'Nothing, ever.', 'All of them!', 'I\'ll drink later.'], correct: 0 },
      { speaker: 'A', text: 'I\'ll be right back. Enjoy your meal!' },
      { speaker: 'B', text: '___', options: ['Thank you so much!', 'Finally!', 'Whatever.', 'Hurry up.'], correct: 0 },
    ],
  },
  placeholder({ id: 'pedir-comida', title: 'Pedir Comida para Llevar', category: 'Comida y Restaurantes', emoji: '🥡', color: 'from-orange-500 to-amber-500', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', badge: 'bg-orange-100 text-orange-700',
    vocabulary: [
      { word: 'takeout', translation: 'para llevar', example: 'I\'d like to order takeout.', options: ['para llevar', 'para comer aquí', 'a domicilio', 'caliente'] },
      { word: 'delivery', translation: 'entrega a domicilio', example: 'Do you offer delivery?', options: ['entrega a domicilio', 'para llevar', 'envío', 'pedido'] },
      { word: 'order', translation: 'pedido', example: 'Is my order ready?', options: ['pedido', 'factura', 'lista', 'recibo'] },
      { word: 'extra', translation: 'adicional', example: 'Can I get extra sauce?', options: ['adicional', 'menos', 'normal', 'incluido'] },
      { word: 'combo', translation: 'combo / menú', example: 'I\'ll have the number 3 combo.', options: ['combo / menú', 'plato', 'porción', 'tamaño'] },
    ],
    phrases: [
      { phrase: 'I\'d like to ___ a pizza.', meaning: 'Quisiera ordenar una pizza.', when: 'Hacer un pedido', missing: 'order', options: ['order', 'make', 'cook', 'find'], correct: 0 },
      { phrase: 'Can I ___ that to go?', meaning: '¿Puedo llevar eso?', when: 'Pedir para llevar', missing: 'get', options: ['get', 'have', 'take', 'buy'], correct: 0 },
      { phrase: 'How long is the ___?', meaning: '¿Cuánto tiempo de espera?', when: 'Preguntar el tiempo', missing: 'wait', options: ['wait', 'time', 'order', 'delay'], correct: 0 },
      { phrase: 'No ___, please.', meaning: 'Sin cebolla, por favor.', when: 'Personalizar pedido', missing: 'onions', options: ['onions', 'cheese', 'sauce', 'salt'], correct: 0 },
    ],
    structure: { title: 'Using "Can I get...?" at counters', explanation: '"Can I get...?" is common at fast food or takeout counters.', examples: ['Can I get a burger and fries?', 'Can I get that to go?', 'Can I get extra napkins?'], words: ['Can', 'I', 'get', 'that', 'to', 'go', '?'] },
    dialogue: [
      { speaker: 'A', text: 'Welcome! What can I get for you?' },
      { speaker: 'B', text: '___', options: ['I\'d like a burger and a Coke.', 'Nothing, thanks.', 'What do you have?', 'I\'m not sure.'], correct: 0 },
      { speaker: 'A', text: 'For here or to go?' },
      { speaker: 'B', text: '___', options: ['To go, please.', 'I live here.', 'What\'s the difference?', 'For my friend.'], correct: 0 },
      { speaker: 'A', text: 'That\'ll be $8.50.' },
      { speaker: 'B', text: '___', options: ['Here you go. Thanks!', 'That\'s too expensive!', 'I don\'t have money.', 'Cancel it.'], correct: 0 },
    ],
  }),
  placeholder({ id: 'alergias-dieta', title: 'Alergias y Dietas', category: 'Comida y Restaurantes', emoji: '🥗', color: 'from-orange-500 to-amber-500', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', badge: 'bg-orange-100 text-orange-700',
    vocabulary: [
      { word: 'allergy', translation: 'alergia', example: 'I have a peanut allergy.', options: ['alergia', 'dieta', 'intolerancia', 'preferencia'] },
      { word: 'vegetarian', translation: 'vegetariano', example: 'Do you have vegetarian options?', options: ['vegetariano', 'vegano', 'kosher', 'sin gluten'] },
      { word: 'gluten-free', translation: 'sin gluten', example: 'Is this dish gluten-free?', options: ['sin gluten', 'sin lactosa', 'sin sal', 'sin azúcar'] },
      { word: 'dairy', translation: 'lácteo', example: 'I can\'t eat dairy products.', options: ['lácteo', 'carne', 'mariscos', 'cereal'] },
      { word: 'ingredient', translation: 'ingrediente', example: 'What are the ingredients?', options: ['ingrediente', 'receta', 'porción', 'sabor'] },
    ],
  }),
  placeholder({ id: 'pagar-cuenta', title: 'Pagar la Cuenta', category: 'Comida y Restaurantes', emoji: '💳', color: 'from-orange-500 to-amber-500', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', badge: 'bg-orange-100 text-orange-700' }),
  placeholder({ id: 'cafeteria', title: 'En la Cafetería', category: 'Comida y Restaurantes', emoji: '☕', color: 'from-orange-500 to-amber-500', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', badge: 'bg-orange-100 text-orange-700' }),
  placeholder({ id: 'comida-rapida', title: 'Comida Rápida', category: 'Comida y Restaurantes', emoji: '🍔', color: 'from-orange-500 to-amber-500', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', badge: 'bg-orange-100 text-orange-700' }),
  placeholder({ id: 'cocina-en-casa', title: 'Cocinar en Casa', category: 'Comida y Restaurantes', emoji: '🧑‍🍳', color: 'from-orange-500 to-amber-500', cardBg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', badge: 'bg-orange-100 text-orange-700' }),

  // ══════════════════════════════════════════════════════════
  // 2. SALUD Y BIENESTAR 🏥
  // ══════════════════════════════════════════════════════════
  {
    id: 'en-medico',
    title: 'En el Médico',
    category: 'Salud y Bienestar',
    emoji: '🏥',
    color: 'from-rose-500 to-red-500',
    cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
    badge: 'bg-rose-100 text-rose-700',
    vocabulary: [
      { word: 'appointment', translation: 'cita médica', example: 'I need to make an appointment.', options: ['cita médica', 'diagnóstico', 'receta', 'resultado'] },
      { word: 'prescription', translation: 'receta médica', example: 'Here is your prescription.', options: ['receta médica', 'cita', 'diagnóstico', 'vacuna'] },
      { word: 'symptom', translation: 'síntoma', example: 'What are your symptoms?', options: ['síntoma', 'medicina', 'tratamiento', 'diagnóstico'] },
      { word: 'insurance', translation: 'seguro médico', example: 'Do you have health insurance?', options: ['seguro médico', 'pago', 'factura', 'copago'] },
      { word: 'fever', translation: 'fiebre', example: 'I have a fever of 101°F.', options: ['fiebre', 'tos', 'dolor', 'mareo'] },
      { word: 'headache', translation: 'dolor de cabeza', example: 'I\'ve had a headache all day.', options: ['dolor de cabeza', 'dolor de estómago', 'dolor de espalda', 'dolor de garganta'] },
      { word: 'nausea', translation: 'náuseas', example: 'I feel nausea and dizziness.', options: ['náuseas', 'cansancio', 'ansiedad', 'fiebre'] },
    ],
    phrases: [
      { phrase: 'I\'d like to make an ___.', meaning: 'Quisiera hacer una cita.', when: 'Llamar al médico', missing: 'appointment', options: ['appointment', 'order', 'request', 'reservation'], correct: 0 },
      { phrase: 'I\'ve been feeling ___ for two days.', meaning: 'Me he sentido mal por dos días.', when: 'Describir síntomas', missing: 'sick', options: ['sick', 'tired', 'happy', 'busy'], correct: 0 },
      { phrase: 'It ___ when I breathe deeply.', meaning: 'Me duele cuando respiro profundo.', when: 'Describir dolor', missing: 'hurts', options: ['hurts', 'aches', 'stings', 'burns'], correct: 0 },
      { phrase: 'Is this ___ safe to take?', meaning: '¿Es seguro tomar este medicamento?', when: 'Preguntar sobre medicamentos', missing: 'medication', options: ['medication', 'pill', 'treatment', 'dose'], correct: 0 },
    ],
    structure: {
      title: 'Describing pain: "It hurts" vs "I have a pain"',
      explanation: 'Use "I have a + [part] + ache" for common pains, or "My [part] hurts" for direct descriptions.',
      examples: ['I have a stomachache.', 'My knee hurts.', 'I have a sharp pain in my chest.'],
      words: ['My', 'back', 'has', 'been', 'hurting', 'since', 'yesterday', '.'],
    },
    dialogue: [
      { speaker: 'A', text: 'Hello! What brings you in today?' },
      { speaker: 'B', text: '___', options: ['I\'ve had a bad headache and fever.', 'I just wanted to visit.', 'I\'m here to eat.', 'I don\'t know why.'], correct: 0 },
      { speaker: 'A', text: 'How long have you had these symptoms?' },
      { speaker: 'B', text: '___', options: ['For about three days now.', 'All my life.', 'Never before.', 'Since tomorrow.'], correct: 0 },
      { speaker: 'A', text: 'I\'ll prescribe some antibiotics. Take them twice a day.' },
      { speaker: 'B', text: '___', options: ['Should I take them with food?', 'No thanks, I\'m fine.', 'Can I eat them?', 'What are antibiotics?'], correct: 0 },
      { speaker: 'A', text: 'Yes, with meals is best. Come back in a week if it doesn\'t improve.' },
      { speaker: 'B', text: '___', options: ['Thank you, Doctor. I will.', 'I won\'t come back.', 'That\'s too long.', 'Can I see a different doctor?'], correct: 0 },
    ],
  },
  placeholder({ id: 'farmacia', title: 'En la Farmacia', category: 'Salud y Bienestar', emoji: '💊', color: 'from-rose-500 to-red-500', cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', badge: 'bg-rose-100 text-rose-700',
    vocabulary: [
      { word: 'pharmacy', translation: 'farmacia', example: 'Is there a pharmacy nearby?', options: ['farmacia', 'clínica', 'hospital', 'laboratorio'] },
      { word: 'over-the-counter', translation: 'sin receta', example: 'This medicine is over-the-counter.', options: ['sin receta', 'con receta', 'genérico', 'importado'] },
      { word: 'dosage', translation: 'dosis', example: 'What is the recommended dosage?', options: ['dosis', 'receta', 'precio', 'marca'] },
      { word: 'side effects', translation: 'efectos secundarios', example: 'Are there any side effects?', options: ['efectos secundarios', 'contraindicaciones', 'beneficios', 'ingredientes'] },
      { word: 'generic', translation: 'genérico', example: 'Do you have a generic version?', options: ['genérico', 'original', 'importado', 'premium'] },
    ],
  }),
  placeholder({ id: 'emergencia-medica', title: 'Emergencia Médica', category: 'Salud y Bienestar', emoji: '🚑', color: 'from-rose-500 to-red-500', cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', badge: 'bg-rose-100 text-rose-700' }),
  placeholder({ id: 'salud-mental', title: 'Salud Mental', category: 'Salud y Bienestar', emoji: '🧠', color: 'from-rose-500 to-red-500', cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', badge: 'bg-rose-100 text-rose-700' }),
  placeholder({ id: 'dentista', title: 'En el Dentista', category: 'Salud y Bienestar', emoji: '🦷', color: 'from-rose-500 to-red-500', cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', badge: 'bg-rose-100 text-rose-700' }),
  placeholder({ id: 'ejercicio', title: 'Ejercicio y Gimnasio', category: 'Salud y Bienestar', emoji: '💪', color: 'from-rose-500 to-red-500', cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', badge: 'bg-rose-100 text-rose-700' }),
  placeholder({ id: 'optometria', title: 'Visita al Optómetra', category: 'Salud y Bienestar', emoji: '👁️', color: 'from-rose-500 to-red-500', cardBg: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', badge: 'bg-rose-100 text-rose-700' }),

  // ══════════════════════════════════════════════════════════
  // 3. TRANSPORTE 🚗
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'taxi-uber', title: 'Tomar un Taxi / Uber', category: 'Transporte', emoji: '🚕', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700',
    vocabulary: [
      { word: 'fare', translation: 'tarifa', example: 'What is the fare to the airport?', options: ['tarifa', 'distancia', 'ruta', 'tiempo'] },
      { word: 'destination', translation: 'destino', example: 'What\'s your destination?', options: ['destino', 'origen', 'parada', 'ruta'] },
      { word: 'ride', translation: 'viaje / carrera', example: 'I need a ride to downtown.', options: ['viaje / carrera', 'taxi', 'conductor', 'app'] },
      { word: 'driver', translation: 'conductor', example: 'The driver will arrive in 3 minutes.', options: ['conductor', 'pasajero', 'despachador', 'mecánico'] },
      { word: 'drop off', translation: 'dejar / bajar', example: 'Can you drop me off here?', options: ['dejar / bajar', 'recoger', 'esperar', 'girar'] },
    ],
  }),
  placeholder({ id: 'autobus', title: 'En el Autobús', category: 'Transporte', emoji: '🚌', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700' }),
  placeholder({ id: 'metro-tren', title: 'Metro y Tren', category: 'Transporte', emoji: '🚇', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700' }),
  placeholder({ id: 'aeropuerto', title: 'En el Aeropuerto', category: 'Transporte', emoji: '✈️', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700',
    vocabulary: [
      { word: 'boarding pass', translation: 'tarjeta de embarque', example: 'Can I see your boarding pass?', options: ['tarjeta de embarque', 'pasaporte', 'visa', 'boleto'] },
      { word: 'check-in', translation: 'registro / facturación', example: 'Where is the check-in counter?', options: ['registro / facturación', 'salida', 'llegada', 'equipaje'] },
      { word: 'luggage', translation: 'equipaje', example: 'My luggage is missing.', options: ['equipaje', 'boleto', 'pasaporte', 'mochila'] },
      { word: 'gate', translation: 'puerta de embarque', example: 'What gate is my flight?', options: ['puerta de embarque', 'terminal', 'salida', 'llegada'] },
      { word: 'delay', translation: 'retraso', example: 'The flight has a two-hour delay.', options: ['retraso', 'cancelación', 'cambio', 'problema'] },
    ],
  }),
  placeholder({ id: 'alquilar-carro', title: 'Alquilar un Auto', category: 'Transporte', emoji: '🚗', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700' }),
  placeholder({ id: 'gasolinera', title: 'En la Gasolinera', category: 'Transporte', emoji: '⛽', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700' }),
  placeholder({ id: 'direcciones', title: 'Pedir Direcciones', category: 'Transporte', emoji: '🗺️', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700' }),
  placeholder({ id: 'trafico', title: 'Hablar del Tráfico', category: 'Transporte', emoji: '🚦', color: 'from-blue-500 to-cyan-500', cardBg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', badge: 'bg-blue-100 text-blue-700' }),

  // ══════════════════════════════════════════════════════════
  // 4. VIAJES Y ALOJAMIENTO ✈️
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'hotel-checkin', title: 'Check-in en el Hotel', category: 'Viajes y Alojamiento', emoji: '🏨', color: 'from-sky-500 to-indigo-500', cardBg: 'from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30', badge: 'bg-sky-100 text-sky-700',
    vocabulary: [
      { word: 'check-in', translation: 'registro de entrada', example: 'I\'d like to check in, please.', options: ['registro de entrada', 'salida', 'reserva', 'habitación'] },
      { word: 'room key', translation: 'llave de habitación', example: 'Here is your room key.', options: ['llave de habitación', 'tarjeta de crédito', 'pasaporte', 'recibo'] },
      { word: 'single room', translation: 'habitación individual', example: 'I booked a single room.', options: ['habitación individual', 'habitación doble', 'suite', 'hostel'] },
      { word: 'amenities', translation: 'servicios / comodidades', example: 'What amenities does the hotel have?', options: ['servicios / comodidades', 'precios', 'restaurantes', 'horarios'] },
      { word: 'concierge', translation: 'conserje', example: 'Ask the concierge for directions.', options: ['conserje', 'recepcionista', 'gerente', 'limpieza'] },
    ],
  }),
  placeholder({ id: 'hotel-problemas', title: 'Problemas en el Hotel', category: 'Viajes y Alojamiento', emoji: '😟', color: 'from-sky-500 to-indigo-500', cardBg: 'from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30', badge: 'bg-sky-100 text-sky-700' }),
  placeholder({ id: 'turismo', title: 'Hacer Turismo', category: 'Viajes y Alojamiento', emoji: '🗼', color: 'from-sky-500 to-indigo-500', cardBg: 'from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30', badge: 'bg-sky-100 text-sky-700' }),
  placeholder({ id: 'visa-documentos', title: 'Visa y Documentos', category: 'Viajes y Alojamiento', emoji: '🛂', color: 'from-sky-500 to-indigo-500', cardBg: 'from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30', badge: 'bg-sky-100 text-sky-700' }),
  placeholder({ id: 'cambio-moneda', title: 'Cambio de Moneda', category: 'Viajes y Alojamiento', emoji: '💱', color: 'from-sky-500 to-indigo-500', cardBg: 'from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30', badge: 'bg-sky-100 text-sky-700' }),
  placeholder({ id: 'seguro-viaje', title: 'Seguro de Viaje', category: 'Viajes y Alojamiento', emoji: '🔐', color: 'from-sky-500 to-indigo-500', cardBg: 'from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30', badge: 'bg-sky-100 text-sky-700' }),

  // ══════════════════════════════════════════════════════════
  // 5. COMPRAS 🛍️
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'tienda-ropa', title: 'Comprar Ropa', category: 'Compras', emoji: '👗', color: 'from-violet-500 to-purple-500', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', badge: 'bg-violet-100 text-violet-700',
    vocabulary: [
      { word: 'fitting room', translation: 'probador', example: 'Can I use the fitting room?', options: ['probador', 'caja', 'descuento', 'talla'] },
      { word: 'size', translation: 'talla / tamaño', example: 'What size do you wear?', options: ['talla / tamaño', 'color', 'precio', 'marca'] },
      { word: 'discount', translation: 'descuento', example: 'Is there a discount on this?', options: ['descuento', 'precio completo', 'oferta', 'remate'] },
      { word: 'receipt', translation: 'recibo', example: 'Can I have a receipt, please?', options: ['recibo', 'factura', 'garantía', 'etiqueta'] },
      { word: 'exchange', translation: 'cambio / intercambio', example: 'I\'d like to exchange this for a larger size.', options: ['cambio / intercambio', 'devolución', 'reparación', 'crédito'] },
    ],
  }),
  placeholder({ id: 'supermercado', title: 'En el Supermercado', category: 'Compras', emoji: '🛒', color: 'from-violet-500 to-purple-500', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', badge: 'bg-violet-100 text-violet-700' }),
  placeholder({ id: 'devolucion', title: 'Devoluciones', category: 'Compras', emoji: '↩️', color: 'from-violet-500 to-purple-500', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', badge: 'bg-violet-100 text-violet-700' }),
  placeholder({ id: 'online-shopping', title: 'Compras en Línea', category: 'Compras', emoji: '💻', color: 'from-violet-500 to-purple-500', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', badge: 'bg-violet-100 text-violet-700' }),
  placeholder({ id: 'electronicos', title: 'Tienda de Electrónicos', category: 'Compras', emoji: '📱', color: 'from-violet-500 to-purple-500', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', badge: 'bg-violet-100 text-violet-700' }),
  placeholder({ id: 'mercado', title: 'En el Mercado Local', category: 'Compras', emoji: '🏪', color: 'from-violet-500 to-purple-500', cardBg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', badge: 'bg-violet-100 text-violet-700' }),

  // ══════════════════════════════════════════════════════════
  // 6. TRÁMITES Y SERVICIOS 🏦
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'banco', title: 'En el Banco', category: 'Trámites y Servicios', emoji: '🏦', color: 'from-slate-500 to-gray-600', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700',
    vocabulary: [
      { word: 'account', translation: 'cuenta bancaria', example: 'I\'d like to open an account.', options: ['cuenta bancaria', 'tarjeta', 'préstamo', 'depósito'] },
      { word: 'withdrawal', translation: 'retiro', example: 'I\'d like to make a withdrawal.', options: ['retiro', 'depósito', 'transferencia', 'pago'] },
      { word: 'transfer', translation: 'transferencia', example: 'I need to transfer money.', options: ['transferencia', 'retiro', 'depósito', 'cobro'] },
      { word: 'balance', translation: 'saldo', example: 'Can I check my balance?', options: ['saldo', 'límite', 'deuda', 'interés'] },
      { word: 'PIN', translation: 'PIN / clave', example: 'Enter your PIN number.', options: ['PIN / clave', 'contraseña', 'código', 'número'] },
    ],
  }),
  placeholder({ id: 'correo', title: 'En Correos', category: 'Trámites y Servicios', emoji: '📮', color: 'from-slate-500 to-gray-600', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700' }),
  placeholder({ id: 'telefono-compania', title: 'Compañía de Teléfono', category: 'Trámites y Servicios', emoji: '📞', color: 'from-slate-500 to-gray-600', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700' }),
  placeholder({ id: 'reparaciones', title: 'Solicitar Reparaciones', category: 'Trámites y Servicios', emoji: '🔧', color: 'from-slate-500 to-gray-600', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700' }),
  placeholder({ id: 'policia', title: 'Hablar con la Policía', category: 'Trámites y Servicios', emoji: '👮', color: 'from-slate-500 to-gray-600', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700' }),
  placeholder({ id: 'servicios-publicos', title: 'Servicios Públicos', category: 'Trámites y Servicios', emoji: '🏛️', color: 'from-slate-500 to-gray-600', cardBg: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', badge: 'bg-slate-100 text-slate-700' }),

  // ══════════════════════════════════════════════════════════
  // 7. TRABAJO Y NEGOCIOS 💼
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'entrevista-trabajo', title: 'Entrevista de Trabajo', category: 'Trabajo y Negocios', emoji: '👔', color: 'from-indigo-500 to-blue-600', cardBg: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', badge: 'bg-indigo-100 text-indigo-700',
    vocabulary: [
      { word: 'resume', translation: 'hoja de vida / currículum', example: 'Please send me your resume.', options: ['hoja de vida / currículum', 'carta de presentación', 'referencias', 'certificado'] },
      { word: 'strengths', translation: 'fortalezas', example: 'What are your strengths?', options: ['fortalezas', 'debilidades', 'habilidades', 'logros'] },
      { word: 'salary', translation: 'salario', example: 'What is the expected salary?', options: ['salario', 'beneficios', 'horario', 'contrato'] },
      { word: 'experience', translation: 'experiencia', example: 'Do you have relevant experience?', options: ['experiencia', 'educación', 'certificación', 'referencia'] },
      { word: 'available', translation: 'disponible', example: 'When are you available to start?', options: ['disponible', 'calificado', 'interesado', 'listo'] },
    ],
  }),
  placeholder({ id: 'reunion-negocios', title: 'Reunión de Negocios', category: 'Trabajo y Negocios', emoji: '🤝', color: 'from-indigo-500 to-blue-600', cardBg: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', badge: 'bg-indigo-100 text-indigo-700' }),
  placeholder({ id: 'email-trabajo', title: 'Emails de Trabajo', category: 'Trabajo y Negocios', emoji: '📧', color: 'from-indigo-500 to-blue-600', cardBg: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', badge: 'bg-indigo-100 text-indigo-700' }),
  placeholder({ id: 'llamada-trabajo', title: 'Llamadas de Trabajo', category: 'Trabajo y Negocios', emoji: '📱', color: 'from-indigo-500 to-blue-600', cardBg: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', badge: 'bg-indigo-100 text-indigo-700' }),
  placeholder({ id: 'negociar', title: 'Negociar', category: 'Trabajo y Negocios', emoji: '💰', color: 'from-indigo-500 to-blue-600', cardBg: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', badge: 'bg-indigo-100 text-indigo-700' }),
  placeholder({ id: 'presentacion', title: 'Hacer una Presentación', category: 'Trabajo y Negocios', emoji: '📊', color: 'from-indigo-500 to-blue-600', cardBg: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', badge: 'bg-indigo-100 text-indigo-700' }),

  // ══════════════════════════════════════════════════════════
  // 8. EDUCACIÓN 🎓
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'matricularse', title: 'Matricularse en Clases', category: 'Educación', emoji: '📝', color: 'from-emerald-500 to-teal-500', cardBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', badge: 'bg-emerald-100 text-emerald-700',
    vocabulary: [
      { word: 'enrollment', translation: 'matrícula / inscripción', example: 'When does enrollment open?', options: ['matrícula / inscripción', 'grado', 'crédito', 'semestre'] },
      { word: 'tuition', translation: 'matrícula / pensión', example: 'How much is the tuition?', options: ['matrícula / pensión', 'beca', 'préstamo', 'descuento'] },
      { word: 'semester', translation: 'semestre', example: 'The semester starts in January.', options: ['semestre', 'trimestre', 'año', 'módulo'] },
      { word: 'credits', translation: 'créditos', example: 'How many credits does this course have?', options: ['créditos', 'materias', 'horas', 'puntos'] },
      { word: 'scholarship', translation: 'beca', example: 'Can I apply for a scholarship?', options: ['beca', 'préstamo', 'descuento', 'apoyo'] },
    ],
  }),
  placeholder({ id: 'pregunta-clase', title: 'Preguntar en Clase', category: 'Educación', emoji: '✋', color: 'from-emerald-500 to-teal-500', cardBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', badge: 'bg-emerald-100 text-emerald-700' }),
  placeholder({ id: 'examen', title: 'Hablar de Exámenes', category: 'Educación', emoji: '📋', color: 'from-emerald-500 to-teal-500', cardBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', badge: 'bg-emerald-100 text-emerald-700' }),
  placeholder({ id: 'biblioteca', title: 'En la Biblioteca', category: 'Educación', emoji: '📚', color: 'from-emerald-500 to-teal-500', cardBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', badge: 'bg-emerald-100 text-emerald-700' }),
  placeholder({ id: 'hablar-profesor', title: 'Hablar con el Profesor', category: 'Educación', emoji: '👩‍🏫', color: 'from-emerald-500 to-teal-500', cardBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', badge: 'bg-emerald-100 text-emerald-700' }),

  // ══════════════════════════════════════════════════════════
  // 9. SOCIAL Y ENTRETENIMIENTO 🎉
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'invitaciones', title: 'Hacer y Recibir Invitaciones', category: 'Social y Entretenimiento', emoji: '🎟️', color: 'from-pink-500 to-fuchsia-500', cardBg: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30', badge: 'bg-pink-100 text-pink-700',
    vocabulary: [
      { word: 'invitation', translation: 'invitación', example: 'Thank you for the invitation!', options: ['invitación', 'evento', 'fiesta', 'reunión'] },
      { word: 'RSVP', translation: 'confirmar asistencia', example: 'Please RSVP by Friday.', options: ['confirmar asistencia', 'rechazar', 'cancelar', 'posponer'] },
      { word: 'plus one', translation: 'acompañante', example: 'Can I bring a plus one?', options: ['acompañante', 'regalo', 'comida', 'bebida'] },
      { word: 'venue', translation: 'lugar / sede', example: 'What\'s the venue for the party?', options: ['lugar / sede', 'hora', 'fecha', 'tema'] },
      { word: 'casual', translation: 'informal / casual', example: 'The dress code is casual.', options: ['informal / casual', 'formal', 'elegante', 'deportivo'] },
    ],
  }),
  placeholder({ id: 'cine-teatro', title: 'Cine y Teatro', category: 'Social y Entretenimiento', emoji: '🎬', color: 'from-pink-500 to-fuchsia-500', cardBg: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30', badge: 'bg-pink-100 text-pink-700' }),
  placeholder({ id: 'deportes', title: 'Hablar de Deportes', category: 'Social y Entretenimiento', emoji: '⚽', color: 'from-pink-500 to-fuchsia-500', cardBg: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30', badge: 'bg-pink-100 text-pink-700' }),
  placeholder({ id: 'fiesta', title: 'En una Fiesta', category: 'Social y Entretenimiento', emoji: '🎉', color: 'from-pink-500 to-fuchsia-500', cardBg: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30', badge: 'bg-pink-100 text-pink-700' }),
  placeholder({ id: 'conocer-gente', title: 'Conocer Gente Nueva', category: 'Social y Entretenimiento', emoji: '👋', color: 'from-pink-500 to-fuchsia-500', cardBg: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30', badge: 'bg-pink-100 text-pink-700' }),
  placeholder({ id: 'redes-sociales', title: 'Redes Sociales', category: 'Social y Entretenimiento', emoji: '📸', color: 'from-pink-500 to-fuchsia-500', cardBg: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30', badge: 'bg-pink-100 text-pink-700' }),

  // ══════════════════════════════════════════════════════════
  // 10. SITUACIONES DIFÍCILES 💬
  // ══════════════════════════════════════════════════════════
  {
    id: 'disculparse',
    title: 'Disculparse y Pedir Perdón',
    category: 'Situaciones Difíciles',
    emoji: '🙏',
    color: 'from-amber-500 to-yellow-500',
    cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
    badge: 'bg-amber-100 text-amber-700',
    vocabulary: [
      { word: 'apologize', translation: 'disculparse', example: 'I want to apologize for my behavior.', options: ['disculparse', 'explicarse', 'justificarse', 'defenderse'] },
      { word: 'mistake', translation: 'error / equivocación', example: 'I made a big mistake.', options: ['error / equivocación', 'accidente', 'problema', 'malentendido'] },
      { word: 'sincere', translation: 'sincero', example: 'Please accept my sincere apology.', options: ['sincero', 'formal', 'rápido', 'pequeño'] },
      { word: 'forgive', translation: 'perdonar', example: 'Can you forgive me?', options: ['perdonar', 'olvidar', 'ignorar', 'entender'] },
      { word: 'misunderstanding', translation: 'malentendido', example: 'There was a misunderstanding.', options: ['malentendido', 'error', 'problema', 'conflicto'] },
      { word: 'responsibility', translation: 'responsabilidad', example: 'I take full responsibility.', options: ['responsabilidad', 'culpa', 'obligación', 'deber'] },
    ],
    phrases: [
      { phrase: 'I\'m so ___ about that.', meaning: 'Lo siento mucho por eso.', when: 'Disculparse sinceramente', missing: 'sorry', options: ['sorry', 'happy', 'sure', 'ready'], correct: 0 },
      { phrase: 'That was completely my ___.', meaning: 'Fue completamente mi error.', when: 'Asumir responsabilidad', missing: 'fault', options: ['fault', 'problem', 'worry', 'plan'], correct: 0 },
      { phrase: 'I should have ___ better.', meaning: 'Debería haber sabido actuar mejor.', when: 'Reflexionar sobre el error', missing: 'known', options: ['known', 'done', 'said', 'been'], correct: 0 },
      { phrase: 'It won\'t ___ again.', meaning: 'No volverá a ocurrir.', when: 'Prometer cambio', missing: 'happen', options: ['happen', 'occur', 'start', 'matter'], correct: 0 },
    ],
    structure: {
      title: 'Apologizing with "I\'m sorry for + -ing"',
      explanation: 'To explain WHY you\'re sorry, use "I\'m sorry for + -ing verb" or "I apologize for + noun".',
      examples: ['I\'m sorry for being late.', 'I apologize for the misunderstanding.', 'I\'m sorry for not calling you back.'],
      words: ['I\'m', 'sorry', 'for', 'not', 'calling', 'you', 'back', '.'],
    },
    dialogue: [
      { speaker: 'A', text: 'I can\'t believe you forgot our meeting!' },
      { speaker: 'B', text: '___', options: ['I\'m so sorry. It completely slipped my mind.', 'Not my problem.', 'You\'re wrong.', 'I don\'t care.'], correct: 0 },
      { speaker: 'A', text: 'This is the second time this month!' },
      { speaker: 'B', text: '___', options: ['You\'re right, I take full responsibility.', 'It\'s not that serious.', 'Whatever.', 'Stop complaining.'], correct: 0 },
      { speaker: 'A', text: 'What are you going to do about it?' },
      { speaker: 'B', text: '___', options: ['I\'ll set reminders and it won\'t happen again.', 'Nothing, it\'s fine.', 'I don\'t know.', 'Figure it out yourself.'], correct: 0 },
      { speaker: 'A', text: 'Okay. I appreciate the honesty.' },
      { speaker: 'B', text: '___', options: ['Thank you for understanding. I really mean it.', 'I knew you\'d forgive me.', 'Good.', 'Finally!'], correct: 0 },
    ],
  },
  placeholder({ id: 'queja-hotel', title: 'Queja en el Hotel', category: 'Situaciones Difíciles', emoji: '😤', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700',
    vocabulary: [
      { word: 'complaint', translation: 'queja / reclamo', example: 'I\'d like to make a complaint.', options: ['queja / reclamo', 'solicitud', 'pregunta', 'sugerencia'] },
      { word: 'noise', translation: 'ruido', example: 'There is too much noise next door.', options: ['ruido', 'olor', 'frío', 'calor'] },
      { word: 'refund', translation: 'reembolso', example: 'I\'d like a refund for this.', options: ['reembolso', 'descuento', 'crédito', 'compensación'] },
      { word: 'manager', translation: 'gerente', example: 'Can I speak to the manager?', options: ['gerente', 'recepcionista', 'seguridad', 'limpieza'] },
      { word: 'unacceptable', translation: 'inaceptable', example: 'This situation is unacceptable.', options: ['inaceptable', 'normal', 'esperado', 'común'] },
    ],
  }),
  placeholder({ id: 'queja-restaurante', title: 'Queja en el Restaurante', category: 'Situaciones Difíciles', emoji: '🍽️', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'problema-compra', title: 'Problema con una Compra', category: 'Situaciones Difíciles', emoji: '🛍️', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'perderse', title: 'Cuando Te Pierdes', category: 'Situaciones Difíciles', emoji: '😕', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'perder-objetos', title: 'Perder Objetos', category: 'Situaciones Difíciles', emoji: '🔑', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'malentendido', title: 'Resolver Malentendidos', category: 'Situaciones Difíciles', emoji: '🤔', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'conflicto-vecino', title: 'Conflicto con Vecinos', category: 'Situaciones Difíciles', emoji: '🏘️', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'dificultad-idioma', title: 'Dificultad con el Idioma', category: 'Situaciones Difíciles', emoji: '🗣️', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),
  placeholder({ id: 'critica-trabajo', title: 'Recibir Críticas en el Trabajo', category: 'Situaciones Difíciles', emoji: '💼', color: 'from-amber-500 to-yellow-500', cardBg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', badge: 'bg-amber-100 text-amber-700' }),

  // ══════════════════════════════════════════════════════════
  // 11. COMUNICACIÓN DEL DÍA A DÍA 📱
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'telefono-celular', title: 'Llamadas Telefónicas', category: 'Comunicación del Día a Día', emoji: '📞', color: 'from-teal-500 to-cyan-500', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', badge: 'bg-teal-100 text-teal-700',
    vocabulary: [
      { word: 'hold on', translation: 'espere un momento', example: 'Can you hold on a second?', options: ['espere un momento', 'llame más tarde', 'cuelgue', 'repita'] },
      { word: 'voicemail', translation: 'buzón de voz', example: 'Please leave a voicemail.', options: ['buzón de voz', 'mensaje de texto', 'correo', 'nota'] },
      { word: 'call back', translation: 'devolver la llamada', example: 'I\'ll call you back later.', options: ['devolver la llamada', 'colgar', 'marcar', 'transferir'] },
      { word: 'wrong number', translation: 'número equivocado', example: 'Sorry, I think you have the wrong number.', options: ['número equivocado', 'número ocupado', 'sin señal', 'fuera de área'] },
      { word: 'speaker', translation: 'altavoz', example: 'Can I put you on speaker?', options: ['altavoz', 'auricular', 'micrófono', 'vibración'] },
    ],
  }),
  placeholder({ id: 'mensajes-texto', title: 'Mensajes y Chat', category: 'Comunicación del Día a Día', emoji: '💬', color: 'from-teal-500 to-cyan-500', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', badge: 'bg-teal-100 text-teal-700' }),
  placeholder({ id: 'correo-electronico', title: 'Escribir Correos', category: 'Comunicación del Día a Día', emoji: '📧', color: 'from-teal-500 to-cyan-500', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', badge: 'bg-teal-100 text-teal-700' }),
  placeholder({ id: 'videollamada', title: 'Videollamada', category: 'Comunicación del Día a Día', emoji: '📹', color: 'from-teal-500 to-cyan-500', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', badge: 'bg-teal-100 text-teal-700' }),
  placeholder({ id: 'noticias', title: 'Hablar de Noticias', category: 'Comunicación del Día a Día', emoji: '📰', color: 'from-teal-500 to-cyan-500', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', badge: 'bg-teal-100 text-teal-700' }),
  placeholder({ id: 'conversacion-casual', title: 'Conversación Casual', category: 'Comunicación del Día a Día', emoji: '😊', color: 'from-teal-500 to-cyan-500', cardBg: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', badge: 'bg-teal-100 text-teal-700' }),

  // ══════════════════════════════════════════════════════════
  // 12. EMERGENCIAS 🚨
  // ══════════════════════════════════════════════════════════
  placeholder({ id: 'llamar-emergencias', title: 'Llamar al 911', category: 'Emergencias', emoji: '🚨', color: 'from-red-600 to-orange-600', cardBg: 'from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30', badge: 'bg-red-100 text-red-700',
    vocabulary: [
      { word: 'emergency', translation: 'emergencia', example: 'This is an emergency!', options: ['emergencia', 'urgencia', 'problema', 'accidente'] },
      { word: 'ambulance', translation: 'ambulancia', example: 'Call an ambulance!', options: ['ambulancia', 'policía', 'bomberos', 'paramédicos'] },
      { word: 'fire department', translation: 'bomberos', example: 'Call the fire department!', options: ['bomberos', 'policía', 'ambulancia', 'guardia'] },
      { word: 'address', translation: 'dirección', example: 'What\'s your address?', options: ['dirección', 'teléfono', 'nombre', 'edad'] },
      { word: 'conscious', translation: 'consciente', example: 'Is the patient conscious?', options: ['consciente', 'inconsciente', 'herido', 'estable'] },
    ],
  }),
  placeholder({ id: 'accidente', title: 'Accidente de Tránsito', category: 'Emergencias', emoji: '🚗', color: 'from-red-600 to-orange-600', cardBg: 'from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30', badge: 'bg-red-100 text-red-700' }),
  placeholder({ id: 'robo', title: 'Reportar un Robo', category: 'Emergencias', emoji: '🚓', color: 'from-red-600 to-orange-600', cardBg: 'from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30', badge: 'bg-red-100 text-red-700' }),
  placeholder({ id: 'perderse-noche', title: 'Perdido de Noche', category: 'Emergencias', emoji: '🌙', color: 'from-red-600 to-orange-600', cardBg: 'from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30', badge: 'bg-red-100 text-red-700' }),
  placeholder({ id: 'ayuda-medica', title: 'Pedir Ayuda Médica', category: 'Emergencias', emoji: '🆘', color: 'from-red-600 to-orange-600', cardBg: 'from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30', badge: 'bg-red-100 text-red-700' }),
];

export const MR_CATEGORIES = ['Todos', ...Array.from(new Set(MUNDO_REAL_TOPICS.map(t => t.category)))];
