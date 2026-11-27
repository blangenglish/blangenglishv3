// @ts-nocheck
/**
 * Editor de la página de inicio.
 *
 * Flujo: se edita sobre un borrador, se mira con «Vista previa» y solo al
 * pulsar «Publicar» pasa a verse en la web. Mientras tanto el público sigue
 * viendo lo publicado.
 *
 * Todas las escrituras van por `adminWrite` (edge function con service_role),
 * nunca con la clave pública: la tabla `page_sections` no tiene política de
 * escritura a propósito.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  Eye, EyeOff, ArrowUp, ArrowDown, Save, Rocket, Undo2, ExternalLink, Loader2, Plus, Trash2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { adminSelect, adminUpdate, adminUpsert } from '@/lib/adminWrite';
import { HOME_REGISTRY, HOME_DEFAULTS } from '@/components/sections/home';
import { PALETTES, DEFAULT_PALETTE_ID, applyTheme, getPalette } from '@/lib/theme';
import { cfg } from '@/lib/siteConfig';

/* ── Qué campos tiene cada sección ───────────────────────────────────── */
const FIELDS = {
  hero: [
    { key: 'greeting_left',  label: 'Saludo (izquierda)', type: 'text' },
    { key: 'greeting_right', label: 'Saludo (derecha)',   type: 'text' },
    { key: 'badge',          label: 'Etiqueta superior',  type: 'i18n' },
    { key: 'subtitle',       label: 'Subtítulo',          type: 'i18n' },
  ],
  brand: [
    { key: 'badge',         label: 'Etiqueta superior', type: 'i18n' },
    { key: 'slogan_pre',    label: 'Eslogan — inicio',  type: 'text' },
    { key: 'slogan_accent', label: 'Eslogan — resaltado', type: 'text' },
    { key: 'slogan_mid',    label: 'Eslogan — medio',   type: 'text' },
    { key: 'slogan_brand',  label: 'Eslogan — marca',   type: 'text' },
    { key: 'subtitle',      label: 'Subtítulo',         type: 'i18n' },
  ],
  programs: [
    { key: 'cta',   label: 'Texto del botón', type: 'i18n' },
    { key: 'items', label: 'Tarjetas',        type: 'cards' },
  ],
  reviews: [
    { key: 'limit', label: 'Cuántas reseñas mostrar', type: 'number' },
  ],
};

const FONDOS = [
  { id: 'none',  label: 'Sin fondo' },
  { id: 'tint',  label: 'Tintado suave' },
  { id: 'brand', label: 'Degradado de marca' },
  { id: 'ink',   label: 'Oscuro' },
];
const ALTURAS = [
  { id: 'sm', label: 'Compacta' },
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Amplia' },
];

export default function AdminSiteEditor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [paleta, setPaleta] = useState(DEFAULT_PALETTE_ID);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSelect('page_sections', {
        filters: { page_key: 'home' },
        order: { column: 'sort_order', ascending: true },
      });

      // Si una sección del código todavía no tiene fila, se muestra igual para
      // poder editarla; al guardar se crea.
      const porClave = new Map((data ?? []).map((r) => [r.section_key, r]));
      const completas = HOME_DEFAULTS.map((d, i) => {
        const r = porClave.get(d.section_key);
        if (!r) {
          return {
            page_key: 'home', section_key: d.section_key,
            sort_order: d.sort_order, is_visible: d.is_visible,
            content: d.content, style: d.style, nueva: true,
          };
        }
        return {
          ...r,
          sort_order: r.draft_sort_order ?? r.sort_order,
          is_visible: r.draft_is_visible ?? r.is_visible,
          content: r.draft_content ?? r.content ?? {},
          style: r.draft_style ?? r.style ?? {},
          tieneBorrador: r.draft_content != null || r.draft_style != null
            || r.draft_sort_order != null || r.draft_is_visible != null,
        };
      }).sort((a, b) => a.sort_order - b.sort_order);

      setRows(completas);
      setPaleta(cfg('theme_palette', DEFAULT_PALETTE_ID));
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'No se pudo cargar: ' + (e?.message ?? e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const editar = (idx, cambios) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...cambios } : r)));

  const editarContenido = (idx, key, valor) =>
    setRows((prev) => prev.map((r, i) =>
      i === idx ? { ...r, content: { ...r.content, [key]: valor } } : r));

  const mover = (idx, delta) => {
    const destino = idx + delta;
    if (destino < 0 || destino >= rows.length) return;
    const copia = [...rows];
    [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
    setRows(copia.map((r, i) => ({ ...r, sort_order: i + 1 })));
  };

  /** Guarda en el borrador. Lo público no cambia. */
  const guardarBorrador = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminUpsert('page_sections', rows.map((r) => ({
        page_key: 'home',
        section_key: r.section_key,
        // Si la fila es nueva hay que darle también los campos publicados, o
        // quedaría una sección sin contenido para el público.
        ...(r.nueva ? { sort_order: r.sort_order, is_visible: r.is_visible, content: r.content, style: r.style } : {}),
        draft_sort_order: r.sort_order,
        draft_is_visible: r.is_visible,
        draft_content: r.content,
        draft_style: r.style,
        updated_at: new Date().toISOString(),
      })), 'page_key,section_key');

      await guardarPaleta();
      setMsg({ tipo: 'ok', texto: 'Borrador guardado. Míralo con «Vista previa».' });
      await cargar();
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'No se pudo guardar: ' + (e?.message ?? e) });
    } finally { setSaving(false); }
  };

  /** Pasa el borrador a publicado y lo limpia. */
  const publicar = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminUpsert('page_sections', rows.map((r) => ({
        page_key: 'home',
        section_key: r.section_key,
        sort_order: r.sort_order,
        is_visible: r.is_visible,
        content: r.content,
        style: r.style,
        draft_sort_order: null,
        draft_is_visible: null,
        draft_content: null,
        draft_style: null,
        updated_at: new Date().toISOString(),
      })), 'page_key,section_key');

      await guardarPaleta();
      setMsg({ tipo: 'ok', texto: 'Publicado. Ya se ve en la web.' });
      await cargar();
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'No se pudo publicar: ' + (e?.message ?? e) });
    } finally { setSaving(false); }
  };

  const descartarBorrador = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminUpdate('page_sections', {
        draft_sort_order: null, draft_is_visible: null,
        draft_content: null, draft_style: null,
      }, undefined, { page_key: 'home' });
      setMsg({ tipo: 'ok', texto: 'Borrador descartado.' });
      await cargar();
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'No se pudo descartar: ' + (e?.message ?? e) });
    } finally { setSaving(false); }
  };

  const guardarPaleta = async () => {
    await adminUpsert('site_settings', {
      key: 'theme_palette', value: paleta,
      label: 'Paleta de colores del sitio', group_name: 'theme',
      updated_at: new Date().toISOString(),
    }, 'key');
  };

  const elegirPaleta = (id) => {
    setPaleta(id);
    applyTheme(getPalette(id).tokens); // se ve al momento en el propio panel
  };

  const hayBorrador = rows.some((r) => r.tieneBorrador);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto pb-24">
        <header className="mb-6">
          <h1 className="text-2xl font-black">Página de inicio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cambia textos, orden, colores y qué secciones se ven. Los cambios se
            guardan como borrador y no salen a la web hasta que pulses Publicar.
          </p>
        </header>

        {msg && (
          <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${
            msg.tipo === 'ok' ? 'bg-green-50 text-green-800 border border-green-200'
                              : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {msg.texto}
          </div>
        )}

        {/* ── Paleta ──────────────────────────────────────────────── */}
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold mb-1">Colores del sitio</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Se aplica a toda la web. Al elegir una la ves aquí mismo al instante.
          </p>
          <div className="flex flex-wrap gap-3">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => elegirPaleta(p.id)}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  paleta === p.id ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex gap-1 mb-2">
                  {p.swatch.map((c) => (
                    <span key={c} className="w-6 h-6 rounded-md border border-black/10" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Secciones ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {rows.map((r, idx) => (
            <section key={r.section_key} className="rounded-2xl border border-border bg-card overflow-hidden">
              <header className="flex items-center gap-2 px-5 py-3 bg-muted/40 border-b border-border">
                <span className="text-xs font-mono text-muted-foreground w-6">{idx + 1}</span>
                <h3 className="font-bold flex-1">
                  {HOME_REGISTRY[r.section_key]?.label ?? r.section_key}
                  {r.tieneBorrador && (
                    <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      con cambios sin publicar
                    </span>
                  )}
                </h3>
                <Button size="sm" variant="ghost" onClick={() => mover(idx, -1)} disabled={idx === 0} title="Subir">
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => mover(idx, 1)} disabled={idx === rows.length - 1} title="Bajar">
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={r.is_visible ? 'ghost' : 'secondary'}
                  onClick={() => editar(idx, { is_visible: !r.is_visible })}
                  title={r.is_visible ? 'Ocultar en la web' : 'Mostrar en la web'}
                >
                  {r.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </header>

              <div className={`p-5 space-y-4 ${r.is_visible ? '' : 'opacity-50'}`}>
                {/* estilo */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Fondo</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={r.style?.bg ?? 'none'}
                      onChange={(e) => editar(idx, { style: { ...r.style, bg: e.target.value } })}
                    >
                      {FONDOS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Altura</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={r.style?.pad ?? 'md'}
                      onChange={(e) => editar(idx, { style: { ...r.style, pad: e.target.value } })}
                    >
                      {ALTURAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </label>
                </div>

                {/* campos */}
                {(FIELDS[r.section_key] ?? []).map((f) => (
                  <Campo
                    key={f.key}
                    def={f}
                    valor={r.content?.[f.key]}
                    onChange={(v) => editarContenido(idx, f.key, v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Barra de acciones ───────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 z-50">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-2 justify-end">
            {hayBorrador && (
              <Button variant="ghost" onClick={descartarBorrador} disabled={saving}>
                <Undo2 className="w-4 h-4 mr-1" /> Descartar borrador
              </Button>
            )}
            <a href="#/?preview=1" target="_blank" rel="noreferrer">
              <Button variant="secondary" disabled={saving}>
                <ExternalLink className="w-4 h-4 mr-1" /> Vista previa
              </Button>
            </a>
            <Button variant="secondary" onClick={guardarBorrador} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar borrador
            </Button>
            <Button onClick={publicar} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
              Publicar
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ── Campos ──────────────────────────────────────────────────────────── */

function Campo({ def, valor, onChange }) {
  if (def.type === 'i18n')   return <CampoI18n def={def} valor={valor} onChange={onChange} />;
  if (def.type === 'cards')  return <CampoTarjetas def={def} valor={valor} onChange={onChange} />;
  if (def.type === 'number') {
    return (
      <label className="block">
        <span className="text-xs font-semibold text-muted-foreground">{def.label}</span>
        <input
          type="number" min={1} max={24}
          className="mt-1 w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={Number(valor) || 6}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    );
  }
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{def.label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={valor ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Campo con pestañas ES / EN y aviso si falta la traducción. */
function CampoI18n({ def, valor, onChange }) {
  const [tab, setTab] = useState('es');
  const v = typeof valor === 'object' && valor ? valor : { es: valor ?? '', en: '' };
  const faltaEn = (v.es ?? '').trim() !== '' && (v.en ?? '').trim() === '';

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{def.label}</span>
        <div className="flex gap-1">
          {['es', 'en'].map((l) => (
            <button
              key={l}
              onClick={() => setTab(l)}
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                tab === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {faltaEn && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            falta traducción
          </span>
        )}
      </div>
      <textarea
        rows={2}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y"
        value={v[tab] ?? ''}
        onChange={(e) => onChange({ ...v, [tab]: e.target.value })}
      />
    </div>
  );
}

/** Lista de tarjetas de programa: añadir, borrar y editar cada una. */
function CampoTarjetas({ def, valor, onChange }) {
  const items = Array.isArray(valor) ? valor : [];

  const editarItem = (i, key, v) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));

  const añadir = () =>
    onChange([...items, {
      id: `tarjeta-${Date.now()}`, emoji: '✨', route: '/',
      title: { es: 'Nueva tarjeta', en: 'New card' },
      subtitle: { es: '', en: '' }, desc: { es: '', en: '' },
    }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">{def.label}</span>
        <Button size="sm" variant="secondary" onClick={añadir}>
          <Plus className="w-3 h-3 mr-1" /> Añadir tarjeta
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id ?? i} className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <input
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-lg"
                value={it.emoji ?? ''}
                onChange={(e) => editarItem(i, 'emoji', e.target.value)}
                title="Emoji"
              />
              <input
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono"
                value={it.route ?? ''}
                onChange={(e) => editarItem(i, 'route', e.target.value)}
                placeholder="/ruta-destino"
              />
              <Button
                size="sm" variant="ghost"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                title="Quitar tarjeta"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
            <CampoI18n def={{ label: 'Título' }}    valor={it.title}    onChange={(v) => editarItem(i, 'title', v)} />
            <CampoI18n def={{ label: 'Subtítulo' }} valor={it.subtitle} onChange={(v) => editarItem(i, 'subtitle', v)} />
            <CampoI18n def={{ label: 'Descripción' }} valor={it.desc}   onChange={(v) => editarItem(i, 'desc', v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
