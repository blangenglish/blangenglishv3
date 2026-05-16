// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { adminSelect, adminDelete } from '@/lib/adminWrite';
import { Star, Trash2, MessageSquare, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  full_name: string;
  rating: number;
  comment: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await adminSelect('student_reviews', {
        order: { column: 'created_at', ascending: false },
      });
      setReviews((data as Review[]) || []);
    } catch (_) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminDelete('student_reviews', id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (_) {
      // silenciar error
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Comentarios</h1>
              <p className="text-sm text-muted-foreground">
                {loading ? '...' : `${reviews.length} reseña${reviews.length !== 1 ? 's' : ''} de estudiantes`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-muted rounded-full" />
                    <div className="h-3 w-20 bg-muted rounded-full" />
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded-full mb-2" />
                <div className="h-3 w-3/4 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">Aún no hay reseñas</p>
            <p className="text-sm mt-1">Aparecerán aquí cuando los estudiantes califiquen su experiencia.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-4">
              {reviews.map(review => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Izquierda: info del estudiante */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {review.full_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Nombre + fecha */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{review.full_name}</span>
                          <span className="text-xs text-muted-foreground">{fmt(review.created_at)}</span>
                        </div>

                        {/* Estrellas */}
                        <div className="flex gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">{review.rating}/5</span>
                        </div>

                        {/* Comentario */}
                        <p className="text-sm text-foreground leading-relaxed">
                          "{review.comment}"
                        </p>
                      </div>
                    </div>

                    {/* Derecha: botón eliminar */}
                    <div className="shrink-0">
                      {confirmId === review.id ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            ¿Eliminar?
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setConfirmId(null)}
                              disabled={deletingId === review.id}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDelete(review.id)}
                              disabled={deletingId === review.id}
                            >
                              {deletingId === review.id ? (
                                <span className="flex items-center gap-1">
                                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Eliminando...
                                </span>
                              ) : 'Sí, eliminar'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmId(review.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </AdminLayout>
  );
}
