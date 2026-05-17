// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminSelect, adminInsert, adminUpdate, adminDelete } from '@/lib/adminWrite';
import { supabase } from '@/integrations/supabase/client';
import {
  CalendarDays, Clock, User, Users, Plus, Pencil,
  Trash2, X, Check, AlertCircle, Mail, BookOpen,
  CheckCircle2, CircleDot, Circle,
} from 'lucide-react';

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  teacher_name: string;
  available_spots: number;
  status: 'available' | 'pending' | 'confirmed';
  booked_student_name?: string;
  booked_student_email?: string;
  session_topic?: string;
  created_at: string;
}

const EMPTY_FORM = {
  date: '',
  start_time: '',
  end_time: '',
  teacher_name: '',
  available_spots: 1,
};

const STATUS_CONFIG = {
  available:  { label: 'Disponible', bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  pending:    { label: 'Pendiente',  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  confirmed:  { label: 'Reservado', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}
function fmtTime(t: string) { return t.slice(0, 5); }

export default function AdminSchedule() {
  const [slots, setSlots]                     = useState<Slot[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [showForm, setShowForm]               = useState(false);
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [form, setForm]                       = useState({ ...EMPTY_FORM });
  const [saving, setSaving]                   = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [formError, setFormError]             = useState('');
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const [confirmedNotice, setConfirmedNotice]   = useState<string | null>(null); // email del estudiante confirmado

  /* ── Carga inicial + auto-eliminar pasados disponibles ── */
  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = (await adminSelect('schedule_slots', {
        order: { column: 'date', ascending: true },
      }) as Slot[]) || [];

      // Auto-eliminar horarios pasados que siguen en "Disponible"
      const today = new Date().toISOString().split('T')[0];
      const expired = data.filter(s => s.status === 'available' && s.date < today);
      if (expired.length > 0) {
        await Promise.all(expired.map(s => adminDelete('schedule_slots', s.id)));
      }
      setSlots(data.filter(s => !(s.status === 'available' && s.date < today)));
    } catch (_) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, []);

  /* ── Formulario nuevo ── */
  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setShowForm(true);
  };

  /* ── Formulario edición ── */
  const openEdit = (slot: Slot) => {
    setEditingId(slot.id);
    setForm({
      date: slot.date,
      start_time: fmtTime(slot.start_time),
      end_time: fmtTime(slot.end_time),
      teacher_name: slot.teacher_name,
      available_spots: slot.available_spots,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
  };

  const validate = () => {
    if (!form.date)                             return 'Selecciona una fecha.';
    if (!form.start_time)                       return 'Ingresa la hora de inicio.';
    if (!form.end_time)                         return 'Ingresa la hora de fin.';
    if (form.start_time >= form.end_time)       return 'La hora de fin debe ser mayor a la de inicio.';
    if (!form.teacher_name.trim())              return 'Ingresa el nombre del profesor.';
    if (!form.available_spots || form.available_spots < 1) return 'Los cupos deben ser mínimo 1.';
    return '';
  };

  /* ── Guardar ── */
  const handleSave = async () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setSaving(true);
    setFormError('');
    const payload = {
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      teacher_name: form.teacher_name.trim(),
      available_spots: Number(form.available_spots),
    };
    try {
      if (editingId) {
        await adminUpdate('schedule_slots', editingId, payload);
        setSlots(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s));
      } else {
        const created = await adminInsert('schedule_slots', { ...payload, status: 'available' }) as Slot;
        if (created?.id) {
          setSlots(prev => [...prev, created].sort((a, b) => a.date < b.date ? -1 : 1));
        } else {
          await loadSlots();
        }
      }
      closeForm();
    } catch (_) {
      setFormError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Cambiar estado ── */
  const handleStatusChange = async (slot: Slot, newStatus: 'available' | 'pending' | 'confirmed') => {
    setStatusChangingId(slot.id);
    try {
      const patch: Partial<Slot> = { status: newStatus };
      if (newStatus === 'available') {
        patch.booked_student_name  = null;
        patch.booked_student_email = null;
        patch.session_topic        = null;
        patch.available_spots      = 1;
      }
      await adminUpdate('schedule_slots', slot.id, patch);
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, ...patch } : s));

      // Mostrar aviso de cuenta pendiente
      if (newStatus === 'confirmed' && slot.booked_student_email) {
        setConfirmedNotice(slot.booked_student_email);
        setTimeout(() => setConfirmedNotice(null), 12000);
      }

      // Enviar correo de confirmación al estudiante
      if (newStatus === 'confirmed' && slot.booked_student_email) {
        supabase.functions.invoke('send-session-email', {
          body: {
            type: 'slot_confirmed',
            studentName:  slot.booked_student_name  || 'Estudiante',
            studentEmail: slot.booked_student_email,
            teacherName:  slot.teacher_name,
            slotDate:     slot.date,
            slotStartTime: slot.start_time,
            slotEndTime:   slot.end_time,
            topic:        slot.session_topic || '',
          },
        }).catch(() => {});
      }
    } catch (_) {
      // silenciar
    } finally {
      setStatusChangingId(null);
    }
  };

  /* ── Eliminar ── */
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminDelete('schedule_slots', id);
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (_) {}
    finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  /* ── Agrupar por fecha ── */
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Agenda con Estudiantes</h1>
              <p className="text-sm text-muted-foreground">
                {loading ? '...' : `${slots.length} horario${slots.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <Button onClick={openNew} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Agregar disponibilidad
          </Button>
        </div>

        {/* ── Aviso post-confirmación ── */}
        <AnimatePresence>
          {confirmedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3"
            >
              <span className="text-xl shrink-0">✅</span>
              <div className="flex-1 text-sm">
                <p className="font-bold text-blue-800 mb-0.5">Sesión confirmada — correo enviado a {confirmedNotice}</p>
                <p className="text-blue-700">
                  Si este estudiante aún no tiene acceso a la plataforma, activa su cuenta en{' '}
                  <a href="#/adminblang/estudiantes" className="font-bold underline underline-offset-2">Estudiantes → habilitar cuenta</a>.
                </p>
              </div>
              <button onClick={() => setConfirmedNotice(null)} className="text-blue-400 hover:text-blue-600 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal formulario ── */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40" onClick={closeForm}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h2 className="font-bold text-lg">
                      {editingId ? 'Editar horario' : 'Nueva disponibilidad'}
                    </h2>
                    <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Fecha
                      </Label>
                      <Input type="date" value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="rounded-xl" min={new Date().toISOString().split('T')[0]} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Hora inicio
                        </Label>
                        <Input type="time" value={form.start_time}
                          onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                          className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Hora fin
                        </Label>
                        <Input type="time" value={form.end_time}
                          onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                          className="rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <User className="w-3.5 h-3.5 text-muted-foreground" /> Nombre del profesor
                      </Label>
                      <Input placeholder="Ej. Andrés García" value={form.teacher_name}
                        onChange={e => setForm(f => ({ ...f, teacher_name: e.target.value }))}
                        className="rounded-xl" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" /> Cupos disponibles
                      </Label>
                      <Input type="number" min={1} max={50} value={form.available_spots}
                        onChange={e => setForm(f => ({ ...f, available_spots: parseInt(e.target.value) || 1 }))}
                        className="rounded-xl w-28" />
                    </div>

                    {formError && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-3">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 p-5 pt-0">
                    <Button variant="outline" className="rounded-xl" onClick={closeForm} disabled={saving}>Cancelar</Button>
                    <Button className="rounded-xl gap-2" onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                      ) : (
                        <><Check className="w-4 h-4" /> Guardar</>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Lista ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-48 bg-muted rounded-full mb-2" />
                <div className="h-3 w-64 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-lg">Sin horarios registrados</p>
            <p className="text-sm mt-1">Haz clic en "Agregar disponibilidad" para crear el primero.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                {/* Encabezado fecha */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-bold text-sm">{fmtDate(date)}</span>
                  <span className="text-xs text-muted-foreground">
                    · {grouped[date].length} horario{grouped[date].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-3">
                  <AnimatePresence initial={false}>
                    {grouped[date].map(slot => {
                      const st = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.available;
                      const isChanging = statusChangingId === slot.id;
                      const hasBooking = slot.booked_student_name || slot.booked_student_email;

                      return (
                        <motion.div
                          key={slot.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.18 }}
                          className="bg-card border border-border/60 rounded-2xl shadow-sm ml-2 overflow-hidden"
                        >
                          {/* Fila principal */}
                          <div className="p-4 flex items-start gap-3">
                            <div className="flex-1 min-w-0 space-y-2">

                              {/* Tiempo + profesor + cupos */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1.5 text-sm font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <User className="w-3.5 h-3.5 shrink-0" /> {slot.teacher_name}
                                </span>
                                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                                {slot.status === 'available' && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    {slot.available_spots} cupo{slot.available_spots !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>

                              {/* Info del estudiante (cuando hay reserva) */}
                              {hasBooking && (
                                <div className="bg-muted/40 rounded-xl p-3 space-y-1 text-xs">
                                  {slot.booked_student_name && (
                                    <div className="flex items-center gap-2">
                                      <User className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="font-semibold">{slot.booked_student_name}</span>
                                    </div>
                                  )}
                                  {slot.booked_student_email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="text-muted-foreground">{slot.booked_student_email}</span>
                                    </div>
                                  )}
                                  {slot.session_topic && (
                                    <div className="flex items-start gap-2">
                                      <BookOpen className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                                      <span className="text-muted-foreground">{slot.session_topic}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Botones de cambio de estado */}
                              {slot.status !== 'available' && (
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                  {slot.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs rounded-lg gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                      disabled={isChanging}
                                      onClick={() => handleStatusChange(slot, 'confirmed')}
                                    >
                                      {isChanging ? (
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      Confirmar reserva
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs rounded-lg gap-1.5"
                                    disabled={isChanging}
                                    onClick={() => handleStatusChange(slot, 'available')}
                                  >
                                    {isChanging ? (
                                      <span className="w-3 h-3 border-2 border-border border-t-foreground rounded-full animate-spin" />
                                    ) : (
                                      <Circle className="w-3 h-3" />
                                    )}
                                    Liberar horario
                                  </Button>
                                </div>
                              )}
                              {slot.status === 'available' && (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                                    onClick={() => openEdit(slot)}
                                  >
                                    <Pencil className="w-3 h-3" /> Editar
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Botón eliminar */}
                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                              {confirmDeleteId === slot.id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-destructive font-medium hidden sm:block">¿Eliminar?</span>
                                  <Button size="sm" variant="outline"
                                    className="h-7 px-2 text-xs rounded-lg"
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deletingId === slot.id}>
                                    No
                                  </Button>
                                  <Button size="sm" variant="destructive"
                                    className="h-7 px-2 text-xs rounded-lg"
                                    onClick={() => handleDelete(slot.id)}
                                    disabled={deletingId === slot.id}>
                                    {deletingId === slot.id
                                      ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      : 'Sí'}
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                  onClick={() => setConfirmDeleteId(slot.id)}
                                  title="Eliminar">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
