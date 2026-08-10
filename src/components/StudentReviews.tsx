// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/lib/language';
import { translations } from '@/lib/translations';

// Reseñas publicadas por estudiantes. Vive como componente propio porque se
// muestra en dos sitios (inicio y módulo de adultos) y así la consulta a
// Supabase y el marcado no quedan duplicados.
//
// Los textos siguen en translations[lang].english.reviews: son los mismos que
// ya se usaban cuando la sección vivía dentro de la página de Inglés.

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 35 } },
};

interface StudentReviewsProps {
  // Cuántas reseñas pedir. En el inicio mostramos menos para no alargar la
  // página, ya que ahí lo importante es que elijan programa.
  limit?: number;
  className?: string;
}

export default function StudentReviews({ limit = 12, className = 'py-14 sm:py-20' }: StudentReviewsProps) {
  const { lang } = useLanguage();
  const t = translations[lang].english.reviews;

  const [reviews, setReviews] = useState<{ full_name: string; rating: number; comment: string }[]>([]);

  useEffect(() => {
    supabase
      .from('student_reviews')
      .select('full_name, rating, comment')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => { if (data?.length) setReviews(data); });
  }, [limit]);

  // Sin reseñas publicadas no se pinta nada: mejor eso que un hueco vacío.
  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className={className}>
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
        >
          {/* Encabezado */}
          <motion.div variants={staggerItem} className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-violet-200">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" /> {t.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              {t.titlePre}<span className="text-primary">{t.titleHighlight}</span>{t.titlePost}
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              {t.subtitle}
            </p>
          </motion.div>

          {/* Grid de reseñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Estrellas */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`}
                    />
                  ))}
                </div>

                {/* Comentario */}
                <p className="text-sm text-foreground leading-relaxed flex-1">
                  "{r.comment}"
                </p>

                {/* Autor anónimo */}
                <div className="flex items-center gap-2.5 pt-1 border-t border-border/40">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm shrink-0">
                    ✦
                  </div>
                  <span className="text-sm font-semibold text-foreground/80 leading-tight">
                    {t.anonName}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
