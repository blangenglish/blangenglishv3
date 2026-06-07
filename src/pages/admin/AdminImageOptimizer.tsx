// @ts-nocheck
import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ImageDown, Loader2, CheckCircle2, AlertCircle, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'unit-media';
const PREFIX = 'stages/image';
const MAX_DIM = 1600;
const QUALITY = 0.8;
const MIN_SIZE_BYTES = 1024 * 1024; // solo procesar archivos > 1MB

type FileStatus = 'pending' | 'processing' | 'done' | 'skipped' | 'error';

interface FileRow {
  name: string;
  path: string;
  before: number;
  after?: number;
  status: FileStatus;
  message?: string;
}

function formatBytes(n: number) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / 1024).toFixed(0)} KB`;
}

async function resizeImage(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  let { width, height } = bitmap;
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width >= height) {
      height = Math.round((height / width) * MAX_DIM);
      width = MAX_DIM;
    } else {
      width = Math.round((width / height) * MAX_DIM);
      height = MAX_DIM;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b); else reject(new Error('No se pudo generar la imagen'));
    }, 'image/png', QUALITY);
  });
}

export default function AdminImageOptimizer() {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const stopRef = useRef(false);

  const loadFiles = async () => {
    setLoaded(false);
    const { data, error } = await supabase.storage.from(BUCKET).list(PREFIX, { limit: 1000 });
    if (error) { alert(`Error al listar archivos: ${error.message}`); return; }
    const list: FileRow[] = (data || [])
      .filter(f => (f.metadata?.size ?? 0) > MIN_SIZE_BYTES && f.name.toLowerCase().endsWith('.png'))
      .map(f => ({
        name: f.name,
        path: `${PREFIX}/${f.name}`,
        before: f.metadata?.size ?? 0,
        status: 'pending' as FileStatus,
      }))
      .sort((a, b) => b.before - a.before);
    setRows(list);
    setLoaded(true);
  };

  const run = async () => {
    setRunning(true);
    stopRef.current = false;
    for (let i = 0; i < rows.length; i++) {
      if (stopRef.current) break;
      const row = rows[i];
      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r));
      try {
        const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(row.path);
        if (dlErr || !blob) throw new Error(dlErr?.message || 'No se pudo descargar');

        const optimized = await resizeImage(blob);

        if (optimized.size >= row.before) {
          setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'skipped', message: 'Ya optimizada' } : r));
          continue;
        }

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(row.path, optimized, { upsert: true, cacheControl: '3600', contentType: 'image/png' });
        if (upErr) throw new Error(upErr.message);

        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'done', after: optimized.size } : r));
      } catch (e) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: e instanceof Error ? e.message : 'Error' } : r));
      }
    }
    setRunning(false);
  };

  const stop = () => { stopRef.current = true; };

  const totalBefore = rows.reduce((sum, r) => sum + r.before, 0);
  const totalAfter = rows.reduce((sum, r) => sum + (r.after ?? r.before), 0);
  const savedBytes = rows.filter(r => r.status === 'done').reduce((sum, r) => sum + (r.before - (r.after ?? r.before)), 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <ImageDown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Optimizador de imágenes (temporal)</h1>
            <p className="text-sm text-muted-foreground">
              Redimensiona y comprime las imágenes pesadas del bucket <code>unit-media/{PREFIX}</code> sin cambiar sus URLs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button variant="outline" className="rounded-xl" onClick={loadFiles} disabled={running}>
            1. Listar imágenes pesadas (&gt; 1 MB)
          </Button>
          <Button className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white" onClick={run} disabled={!loaded || running || rows.length === 0}>
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
            2. Optimizar {rows.length > 0 ? `(${rows.length})` : ''}
          </Button>
          {running && (
            <Button variant="outline" className="rounded-xl gap-2" onClick={stop}>
              <Square className="w-3.5 h-3.5" /> Detener
            </Button>
          )}
        </div>

        {loaded && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No se encontraron imágenes mayores a 1 MB. 🎉</div>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="bg-muted rounded-xl px-4 py-2">
                <span className="text-muted-foreground">Total antes: </span>
                <strong>{formatBytes(totalBefore)}</strong>
              </div>
              <div className="bg-muted rounded-xl px-4 py-2">
                <span className="text-muted-foreground">Total ahora: </span>
                <strong>{formatBytes(totalAfter)}</strong>
              </div>
              <div className="bg-green-50 text-green-700 rounded-xl px-4 py-2">
                <span>Ahorrado: </span>
                <strong>{formatBytes(savedBytes)}</strong>
              </div>
            </div>

            <div className="border rounded-2xl divide-y overflow-hidden">
              {rows.map((r) => (
                <div key={r.path} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="shrink-0">
                    {r.status === 'pending' && <span className="w-4 h-4 inline-block rounded-full bg-muted" />}
                    {r.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                    {r.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {r.status === 'skipped' && <CheckCircle2 className="w-4 h-4 text-muted-foreground" />}
                    {r.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 truncate">{r.name}</div>
                  <div className="text-muted-foreground shrink-0">
                    {formatBytes(r.before)}
                    {r.after != null && <> → <span className="text-green-700 font-medium">{formatBytes(r.after)}</span></>}
                    {r.message && <span className="text-red-600 ml-2">{r.message}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
