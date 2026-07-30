// @ts-nocheck
import { useState, useMemo } from 'react';
import { Copy, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Parte 30: generador de contenido por unidad (Español para extranjeros) ───
// La IA NO corre acá: esta pantalla arma el prompt completo a partir de las
// entradas del profesor para pegarlo en ChatGPT/Claude, y el resultado se
// carga después en el editor de unidades. Se eligió así para que generar
// contenido no tenga costo por uso ni dependa de una clave de API.
//
// Listening queda EXCLUIDO a propósito: el audio lo sube el profesor a mano
// (ver nota al pie de esta pantalla, pendiente de definir por el negocio).

// Tipos de pregunta permitidos en Reading Comprehension. Son exactamente los
// que soporta el editor de unidades (QUIZ_TYPE_CONFIG en UnitStagesEditor.tsx),
// menos los dos de escucha (listen_select / listen_write), que no aplican a una
// lectura. Si algún día se agrega un tipo nuevo al editor, hay que reflejarlo
// acá para que la IA no invente formatos que la plataforma no sabe renderizar.
const TIPOS_PREGUNTA = [
  { key: 'multiple_choice', label: 'Opción múltiple',          desc: 'una sola respuesta correcta' },
  { key: 'multiple_select', label: 'Varios correctos',         desc: 'más de una respuesta correcta' },
  { key: 'true_false',      label: 'Verdadero / Falso',        desc: 'solo dos opciones' },
  { key: 'match',           label: 'Relacionar (Match)',       desc: 'conectar columna A con columna B' },
  { key: 'organize',        label: 'Organizar palabras',       desc: 'reordenar palabras para formar una oración' },
  { key: 'rewrite',         label: 'Reescribir correctamente', desc: 'corregir una oración mal escrita' },
  { key: 'fill_gap',        label: 'Fill the Gap',             desc: 'completar el espacio en blanco' },
  { key: 'image_choice',    label: 'Imagen + opción múltiple', desc: 'describir qué imagen hace falta y dar las opciones' },
  { key: 'image_write',     label: 'Imagen + escribir',        desc: 'describir qué imagen hace falta y la respuesta esperada' },
  { key: 'classify',        label: 'Clasificar por categoría', desc: 'agrupar palabras en categorías' },
  { key: 'image_match',     label: 'Palabra con imagen',       desc: 'relacionar cada palabra con la imagen que le corresponde' },
  { key: 'story_order',     label: 'Ordenar la historia',      desc: 'ordenar los eventos de la lectura' },
];

function construirPrompt(opts: {
  unidad: string;
  gramatica: string;
  vocabulario: string;
  palabras: number;
  numPreguntas: number;
}) {
  const { unidad, gramatica, vocabulario, palabras, numPreguntas } = opts;

  const listaVocab = vocabulario
    .split(/[\n,;]+/)
    .map(v => v.trim())
    .filter(Boolean);

  return `Eres profesor de español para extranjeros. Vas a crear el contenido completo de una unidad para la plataforma BLANG.

# DATOS DE LA UNIDAD
- Unidad: ${unidad || '(sin título)'}
- Tema de gramática: ${gramatica || '(sin definir)'}
- Vocabulario de la unidad (${listaVocab.length} palabras):
${listaVocab.length ? listaVocab.map(v => `  - ${v}`).join('\n') : '  (sin definir)'}

# REGLA MÁS IMPORTANTE
Usa ÚNICAMENTE el tema de gramática y el vocabulario listados arriba. No
introduzcas vocabulario ni estructuras gramaticales que no estén en esa lista.
Si necesitas palabras de apoyo (artículos, conectores básicos), que sean del
nivel más elemental posible.

# QUÉ DEBES GENERAR
Genera estas 6 secciones, en este orden y con estos títulos exactos:

## 1. Reading
Un texto en español de aproximadamente ${palabras} palabras que use el
vocabulario y la gramática de la unidad de forma natural. Debe tener sentido
como historia o situación real, no ser una lista de frases sueltas.
Indica al final el conteo real de palabras.

## 2. Reading Comprehension
${numPreguntas} preguntas sobre la lectura anterior. MEZCLA varios de estos
tipos (no uses solo uno):
${TIPOS_PREGUNTA.map(t => `- ${t.label}: ${t.desc}`).join('\n')}

Para cada pregunta indica claramente:
- El tipo de pregunta (usa exactamente el nombre de la lista de arriba)
- El enunciado
- Las opciones, cuando el tipo las necesite
- La respuesta correcta
- Una explicación breve de por qué es correcta

NO generes preguntas de escucha: esta sección es solo sobre el texto escrito.

## 3. Grammar
Explica "${gramatica || 'el tema de la unidad'}" así:
- Las reglas, en español y en inglés (frases simples, nivel principiante)
- Ejemplos de cada regla
- Una tabla comparativa español-inglés que muestre la diferencia entre los dos idiomas
- Una sección de errores comunes, marcando cada caso con ❌ (incorrecto) y ✅ (correcto)

## 4. Vocabulary
Una tabla bilingüe con TODAS las palabras del vocabulario de la unidad:
| Español | Inglés | Ejemplo en español |

## 5. Speaking Practice
Preguntas para que el estudiante practique hablando, cada una con una
respuesta modelo. Todas deben usar la gramática y el vocabulario de la unidad.

## 6. Writing Practice
Ideas de escritura ordenadas de menor a mayor dificultad (de completar frases
a escribir solo), terminando con un ejercicio de producción libre de 80-100
palabras.

# NO HAGAS
- No generes la sección de Listening ni ningún audio: el profesor sube el audio aparte.
- No inventes vocabulario ni gramática fuera de lo indicado arriba.
- No uses inglés en la lectura: el texto de Reading va 100% en español.`;
}

export default function AdminSpanishGenerator() {
  const [unidad, setUnidad] = useState('');
  const [gramatica, setGramatica] = useState('');
  const [vocabulario, setVocabulario] = useState('');
  const [palabras, setPalabras] = useState(150);
  const [numPreguntas, setNumPreguntas] = useState(12);
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => construirPrompt({ unidad, gramatica, vocabulario, palabras, numPreguntas }),
    [unidad, gramatica, vocabulario, palabras, numPreguntas],
  );

  const listo = gramatica.trim() && vocabulario.trim();

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Si el navegador bloquea el portapapeles, el prompt igual está visible
      // abajo para seleccionarlo a mano.
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-600" />
            Generador de contenido — Español
          </h1>
          <p className="text-muted-foreground text-sm">
            Completa los datos de la unidad y copia el prompt en ChatGPT o Claude. El resultado se carga después en el editor de unidades.
          </p>
        </div>

        {/* ── Entradas ── */}
        <div className="bg-background rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Unidad</Label>
            <Input
              value={unidad}
              onChange={e => setUnidad(e.target.value)}
              placeholder="Ej: Unidad 1 – El alfabeto"
              className="rounded-xl"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Tema de gramática *</Label>
            <Input
              value={gramatica}
              onChange={e => setGramatica(e.target.value)}
              placeholder="Ej: El verbo SER en presente"
              className="rounded-xl"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">
              Lista de vocabulario *
              <span className="font-normal text-muted-foreground ml-1">— una por línea, o separadas por comas</span>
            </Label>
            <textarea
              value={vocabulario}
              onChange={e => setVocabulario(e.target.value)}
              rows={6}
              placeholder={'casa\nfamilia\ntrabajar\n...'}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Palabras de la lectura</Label>
              <Input
                type="number"
                min={50}
                max={1000}
                step={10}
                value={palabras}
                onChange={e => setPalabras(Number(e.target.value) || 0)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Preguntas de comprensión</Label>
              <Input
                type="number"
                min={10}
                max={15}
                value={numPreguntas}
                onChange={e => setNumPreguntas(Number(e.target.value) || 0)}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Entre 10 y 15.</p>
            </div>
          </div>
        </div>

        {/* ── Prompt generado ── */}
        <div className="bg-background rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/50 bg-muted/30">
            <p className="font-bold text-sm">Prompt listo para copiar</p>
            <Button
              size="sm"
              className="rounded-xl gap-1.5 h-8"
              disabled={!listo}
              onClick={copiar}
            >
              {copied
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> ¡Copiado!</>
                : <><Copy className="w-3.5 h-3.5" /> Copiar prompt</>}
            </Button>
          </div>

          {!listo && (
            <div className="flex items-start gap-2 px-5 py-3 bg-amber-50 border-b border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                Completa el <strong>tema de gramática</strong> y la <strong>lista de vocabulario</strong> para poder copiar el prompt.
              </p>
            </div>
          )}

          <pre className="p-5 text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-[420px] overflow-y-auto text-foreground/80">
            {prompt}
          </pre>
        </div>

        {/* ── Nota sobre Listening ── */}
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-5">
          <p className="font-bold text-sm text-amber-900 mb-1">🎧 Listening no se genera acá</p>
          <p className="text-xs text-amber-800">
            El audio lo sube el profesor manualmente desde el editor de la unidad. Queda
            pendiente de definir si la IA generará las preguntas de comprensión a partir de
            una transcripción, o si el profesor sube la sección completa.
          </p>
        </div>

      </div>
    </AdminLayout>
  );
}
