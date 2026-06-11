// @ts-nocheck
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeneficiosClasesModalProps {
  open: boolean;
  onClose: () => void;
}

const ROWS: { label: string; academia: string | boolean; personalizada: string | boolean }[] = [
  { label: 'Atención individual del profesor', academia: false, personalizada: true },
  { label: 'Horario a tu medida', academia: false, personalizada: true },
  { label: 'Ritmo adaptado a tu nivel', academia: false, personalizada: true },
  { label: 'Contenido enfocado en tus objetivos', academia: false, personalizada: true },
  { label: 'Número de estudiantes por clase', academia: 'Grupos de 5 a 15', personalizada: '1 a 1' },
  { label: 'Acceso a la plataforma BLANG incluido', academia: false, personalizada: true },
  { label: 'Práctica con IA (Speakology / ChatGPT)', academia: false, personalizada: true },
  { label: 'Seguimiento personalizado de progreso', academia: false, personalizada: true },
  { label: 'Costo mensual aproximado', academia: '$300,000 - $500,000 COP', personalizada: 'Desde $380,000 COP' },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <Check className="w-4 h-4 text-green-600" />
      </div>
    ) : (
      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <Minus className="w-4 h-4 text-red-500" />
      </div>
    );
  }
  return <span className="text-xs sm:text-sm font-semibold">{value}</span>;
}

export function BeneficiosClasesModal({ open, onClose }: BeneficiosClasesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl px-6 py-5 flex items-start justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                    Clase en una academia vs. Clase personalizada
                  </h2>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                    Compara y elige la mejor opción para ti
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white flex-shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabla comparativa */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 mb-2">
                <div />
                <div className="text-center">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs sm:text-sm font-extrabold px-3 py-2 rounded-xl w-full">
                    🏫 Academia
                  </span>
                </div>
                <div className="text-center">
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs sm:text-sm font-extrabold px-3 py-2 rounded-xl w-full">
                    🎯 Personalizada
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {ROWS.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 items-center py-3">
                    <span className="text-xs sm:text-sm font-medium text-foreground/80">{row.label}</span>
                    <div className="text-center">
                      <Cell value={row.academia} />
                    </div>
                    <div className="text-center">
                      <Cell value={row.personalizada} />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={onClose}
                className="w-full rounded-xl py-5 font-bold text-sm mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Entendido
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
