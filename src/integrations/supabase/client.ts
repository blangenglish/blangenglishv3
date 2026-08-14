import { createClient } from '@supabase/supabase-js'

// Credentials are loaded from VITE_ environment variables (populated in .env at project root).
// Placeholder values prevent "supabaseUrl is required" crash when env vars are missing;
// Supabase API calls will fail with 401 rather than crashing the entire app.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// ─── Tiempo de espera en TODAS las peticiones ────────────────────────────────
// Sin esto, una petición que se queda a medias (red móvil que se corta, cambio
// de wifi, túnel) NO se resuelve nunca. El `finally` que apaga el spinner no
// llega a ejecutarse y la página se queda cargando para siempre: al estudiante
// solo le queda cerrar y volver a entrar.
//
// Con el AbortController la petición falla a los N segundos, la promesa se
// rechaza, el `catch`/`finally` de cada pantalla se ejecuta y el spinner se
// apaga. Es preferible un error visible a una espera infinita.
//
// Las subidas de archivos (materiales del panel de administración) necesitan
// mucho más margen que una consulta normal, así que van aparte.
const TIMEOUT_CONSULTA_MS = 20_000   // consultas y auth
const TIMEOUT_SUBIDA_MS = 120_000    // storage: subir/descargar archivos

function esSubidaDeArchivo(url: string): boolean {
  return url.includes('/storage/v1/')
}

const fetchConTimeout: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url)
  const ms = esSubidaDeArchivo(url) ? TIMEOUT_SUBIDA_MS : TIMEOUT_CONSULTA_MS

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new Error(`Tiempo de espera agotado (${ms} ms)`)), ms)

  // Si supabase-js ya traía su propia señal de cancelación, la respetamos:
  // cancelar cualquiera de las dos debe cancelar la petición.
  const externa = init?.signal
  if (externa) {
    if (externa.aborted) ctrl.abort(externa.reason)
    else externa.addEventListener('abort', () => ctrl.abort(externa.reason), { once: true })
  }

  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

// Se usa sessionStorage para que la sesión se cierre automáticamente
// cuando el usuario cierra la ventana o pestaña del navegador.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchConTimeout,
  },
})

// Import the supabase client like this:
// For React:
// import { supabase } from "@/integrations/supabase/client";
// For React Native:
// import { supabase } from "@/src/integrations/supabase/client";
