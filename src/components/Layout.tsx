// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, BookOpen, Video, TrendingUp, LayoutDashboard, LogIn, UserPlus, ChevronLeft } from 'lucide-react';
import { SiWhatsapp, SiInstagram, SiTiktok } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import type { AuthModal } from '@/lib/index';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';
import { Globe } from 'lucide-react';

// ── Parte 16: mensajes rotativos DENTRO de la barra blanca del header ──────
// (corrige la Parte 15, que lo puso como una franja morada separada arriba
// del header). Vive como un renglón propio dentro del mismo <header> blanco,
// sin fondo ni color nuevos — texto en --primary (morado) sobre blanco.
// Movimiento SIEMPRE horizontal (cinta continua tipo ticker) — nunca
// vertical: se corrige acá un error donde había quedado como un fundido
// vertical (opacity + y) entre mensajes.
// Constantes de animación a nivel de módulo (no objetos literales nuevos en
// cada render) para que la cinta no reinicie su recorrido cada vez que
// Layout se re-renderiza por motivos ajenos (abrir el menú mobile, etc.).
const MARQUEE_ANIMATE = { x: ['0%', '-50%'] };
const MARQUEE_TRANSITION = { duration: 26, ease: 'linear', repeat: Infinity };

function TopMessageBar({ messages }: { messages: string[] }) {
  // Cada mensaje es su propio span con margen explícito alrededor del
  // separador — espacios literales repetidos en el string NO sirven acá:
  // HTML colapsa espacios consecutivos a uno solo al renderizar texto, así
  // que el espaciado real tiene que venir de CSS (margin), no del string.
  // El arreglo se duplica completo (mismo total en ambas mitades) para que
  // el desplazamiento de -50% del propio ancho del contenedor sea continuo
  // e infinito, sin "salto" al reiniciar.
  const items = [...messages, ...messages];

  return (
    <div className="overflow-hidden">
      <div className="h-6 sm:h-7 flex items-center overflow-hidden">
        <motion.div
          className="flex shrink-0 whitespace-nowrap"
          animate={MARQUEE_ANIMATE}
          transition={MARQUEE_TRANSITION}
        >
          {items.map((msg, i) => (
            <span key={i} className="flex items-center shrink-0">
              <span className="text-[11px] sm:text-xs font-bold text-primary tracking-wide">
                {msg}
              </span>
              <span className="text-primary/40 text-[11px] sm:text-xs mx-6 sm:mx-10" aria-hidden="true">
                •
              </span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn?: boolean;
  onOpenAuth?: (modal: AuthModal) => void;
  onLogout?: () => void;
  userName?: string;
  /** 'full' = nav completo (default) · 'back' = botón "Volver al menú principal" · 'minimal' = solo logo + auth */
  navMode?: 'full' | 'back' | 'minimal';
}

export function Layout({ children, isLoggedIn = false, onOpenAuth, onLogout, userName, navMode = 'full' }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];
  // Parte 18: el primer mensaje de la cinta ("Aprovecha el 25%...") es del
  // descuento de primer mes, exclusivo del curso de inglés (Parte 8/13/17) —
  // nunca debe verse en la página de español. Se filtra por índice (no por
  // texto) para que funcione igual sin importar el idioma de interfaz.
  // useMemo evita crear un arreglo nuevo en cada render (TopMessageBar
  // reinicia su rotación cuando la referencia de `messages` cambia).
  const topBarMessages = useMemo(
    () => (location.pathname === ROUTE_PATHS.SPANISH ? t.topBar.messages.slice(1) : t.topBar.messages),
    [location.pathname, t.topBar.messages]
  );

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Handle nav click: page routes, anchor links, cross-page anchors
  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      // anchor on current page
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (href.includes('#')) {
      // navigate to another page then scroll to anchor
      const [path, hash] = href.split('#');
      navigate(path);
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    } else {
      navigate(href);
    }
  };

  const navLinks = isLoggedIn
    ? [
        { label: 'Mi Cuenta', href: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard },
      ]
    : [
        { label: t.footer.home, href: ROUTE_PATHS.HOME },
        { label: t.footer.faq, href: ROUTE_PATHS.FAQ },
      ];

  const LanguageToggle = () => (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1 text-xs sm:text-sm font-bold text-foreground/70 hover:text-primary border border-border/60 hover:border-primary/40 rounded-full px-2.5 sm:px-3 py-1.5 transition-colors shrink-0"
      aria-label="Switch language / Cambiar idioma"
    >
      <Globe className="w-3.5 h-3.5" />
      {t.common.langToggleLabel}
    </button>
  );

  const socialLinks = [
    { icon: SiWhatsapp, href: 'https://whatsapp.com/channel/0029VbCYgGe6WaKj1KPxei2F', label: 'WhatsApp' },
    { icon: SiInstagram, href: 'https://www.instagram.com/blangenglish/', label: 'Instagram' },
    { icon: SiTiktok, href: 'https://www.tiktok.com/@blangenglish', label: 'TikTok' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              {/* Logo — siempre lleva al inicio */}
              <Link
                to={isLoggedIn ? ROUTE_PATHS.DASHBOARD : ROUTE_PATHS.HOME}
                className="flex items-center shrink-0"
              >
                <img src={IMAGES.BLANG_LOGO} alt="BLANG English Academy" className="h-8 sm:h-10 w-auto" />
              </Link>

              {navMode === 'back' && (
                <button
                  onClick={() => navigate(ROUTE_PATHS.HOME)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground/70 hover:text-primary transition-colors truncate"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{t.nav.back}</span>
                  <span className="sm:hidden">{t.nav.backShort}</span>
                </button>
              )}
            </div>

            {navMode === 'full' ? (
              <>
                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-4 lg:gap-6">
                  {navLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => handleNavClick(link.href)}
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        location.pathname === link.href
                          ? 'text-primary font-semibold'
                          : 'text-foreground/70 hover:text-primary'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-3">
                  {isLoggedIn ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground/80">
                        👋 Hola, <span className="text-primary font-semibold">{userName || 'Estudiante'}</span>
                      </span>
                      <Button variant="outline" size="sm" onClick={onLogout}>
                        Salir
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onOpenAuth?.('login')} className="gap-1.5">
                        <LogIn className="w-4 h-4" />
                        {t.nav.login}
                      </Button>
                      <Button size="sm" onClick={() => onOpenAuth?.('register')} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5">
                        <UserPlus className="w-4 h-4" />
                        {t.nav.registerFull}
                      </Button>
                    </>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              /* navMode 'back' | 'minimal' — sin links de nav, auth siempre visible sin hamburguesa */
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <LanguageToggle />
                {isLoggedIn ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden sm:inline text-sm font-medium text-foreground/80">
                      👋 Hola, <span className="text-primary font-semibold">{userName || 'Estudiante'}</span>
                    </span>
                    <Button variant="outline" size="sm" onClick={onLogout}>
                      Salir
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onOpenAuth?.('login')} className="gap-1.5 px-2 sm:px-3">
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.nav.login}</span>
                    </Button>
                    <Button size="sm" onClick={() => onOpenAuth?.('register')} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-3 sm:px-5">
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.nav.register}</span>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <TopMessageBar messages={topBarMessages} />

        {/* Mobile Menu (solo navMode 'full') */}
        {navMode === 'full' && mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/98">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2 text-left"
                >
                  {link.label}
                </button>
              ))}
              {isLoggedIn ? (
                <Button variant="outline" className="w-full" onClick={onLogout}>
                  Cerrar sesión
                </Button>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={() => { onOpenAuth?.('login'); setMobileMenuOpen(false); }}>
                    {t.nav.login}
                  </Button>
                  <Button className="w-full bg-primary text-primary-foreground" onClick={() => { onOpenAuth?.('register'); setMobileMenuOpen(false); }}>
                    {t.nav.registerFull} 🎉
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-foreground text-background mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 md:col-span-2">
              <img src={IMAGES.BLANG_LOGO} alt="BLANG English Academy" className="h-10 w-auto mb-4 brightness-0 invert" />
              <p className="text-sm text-background/70 max-w-md">
                {t.footer.tagline}
              </p>
              <div className="flex gap-4 mt-6">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-background/50 hover:text-primary transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-background">{t.footer.platform}</h3>
              <ul className="space-y-2">
                {[
                  { label: t.footer.home, href: ROUTE_PATHS.HOME },
                  { label: t.footer.english, href: ROUTE_PATHS.ENGLISH },
                  { label: t.footer.spanish, href: ROUTE_PATHS.SPANISH },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-background/60 hover:text-background transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-background">{t.footer.contactFaq}</h3>
              <ul className="space-y-2">
                <li>
                  <Link to={ROUTE_PATHS.FAQ} className="text-sm text-background/60 hover:text-background transition-colors">
                    {t.footer.faq}
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.FAQ} className="text-sm text-background/60 hover:text-background transition-colors">
                    {t.footer.contact}
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.TERMS} className="text-sm text-background/60 hover:text-background transition-colors">
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link to={ROUTE_PATHS.PRIVACY} className="text-sm text-background/60 hover:text-background transition-colors">
                    {t.footer.privacy}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/10 mt-8 pt-8 text-center">
            <p className="text-sm text-background/40">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
