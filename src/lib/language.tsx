// @ts-nocheck
import { createContext, useContext, useState, type ReactNode } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'blang_lang';

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch (_) { /* localStorage no disponible */ }
  // PENDIENTE POR DEFINIR: si el idioma inicial debe detectarse automáticamente
  // según el idioma del navegador (navigator.language) en la primera visita del
  // usuario, o si siempre debe arrancar en español como está ahora. No se
  // implementa detección automática hasta que se confirme esta decisión.
  return 'es';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = (l: Language) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch (_) { /* ignore */ }
  };

  const toggleLang = () => setLang(lang === 'es' ? 'en' : 'es');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
