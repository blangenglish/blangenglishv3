// @ts-nocheck
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { useLanguage } from '@/lib/language';
import { useAdmin } from '@/lib/useAdmin';
import { usePageSections } from '@/lib/pageSections';
import { HOME_REGISTRY, HOME_DEFAULTS } from '@/components/sections/home';

interface HomeProps {
  onOpenAuth?: (modal: AuthModal) => void;
  isLoggedIn?: boolean;
}

/**
 * Inicio.
 *
 * El contenido, el orden, la visibilidad y los colores de cada sección se
 * editan desde el panel (/adminblang/sitio) y viven en la tabla
 * `page_sections`. Esta página solo decide QUÉ componente pinta cada sección.
 *
 * Si la base está vacía o la consulta falla, se usa HOME_DEFAULTS, que son los
 * mismos textos y colores que estaban escritos a mano antes. La home no puede
 * quedarse en blanco por un problema de datos.
 *
 * Con `?preview=1` y sesión de admin se pintan los borradores sin publicar.
 */
export default function Home({ onOpenAuth, isLoggedIn }: HomeProps) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [params] = useSearchParams();
  const { isAdmin } = useAdmin();

  const preview = params.get('preview') === '1' && isAdmin;
  const { sections } = usePageSections('home', HOME_DEFAULTS, { preview });

  useEffect(() => {
    if (isLoggedIn) {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <Layout onOpenAuth={onOpenAuth} navMode="minimal">
      {preview && (
        <div className="sticky top-0 z-[60] bg-amber-500 text-black text-center text-sm font-bold py-2 px-4">
          VISTA PREVIA — estás viendo cambios sin publicar
        </div>
      )}

      {/* Fondo de página: tintado con los tokens de marca */}
      <div className="fixed inset-0 -z-10 surface-tint pointer-events-none" />

      {sections.map((s) => {
        const entry = HOME_REGISTRY[s.section_key as keyof typeof HOME_REGISTRY];
        if (!entry) return null; // sección en BD que el código aún no conoce
        const { Component } = entry;
        return (
          <Component
            key={s.section_key}
            content={s.content}
            style={s.style}
            lang={lang}
          />
        );
      })}
    </Layout>
  );
}
