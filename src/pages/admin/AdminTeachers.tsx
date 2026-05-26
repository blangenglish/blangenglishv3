// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  UserPlus, Pencil, Trash2, X, Check, Loader2, GraduationCap,
  Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  Users, Search, UserCheck,
} from 'lucide-react';

// ─── Edge function helper ────────────────────────────────────────────────────
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const EDGE_URL = `${SUPABASE_URL}/functions/v1/admin-teachers`;

async function callTeachers(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sin sesión');
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.error) throw new Error(payload?.error ?? `Error ${res.status}`);
  return payload?.data;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Teacher {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  current_level: string;
}

const emptyForm = { full_name: '', email: '', password: '' };

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminTeachers() {
  // ── Teacher list state
  const [teachers, setTeachers]     = useState<Teacher[]>([]);
  const [loading, setLoading]       = useState(true);
  const [assignCounts, setAssignCounts] = useState<Record<string, number>>({});

  // ── Create / Edit form state
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [showPass, setShowPass]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError]   = useState('');

  // ── Assign students modal state
  const [assignTeacher, setAssignTeacher]       = useState<Teacher | null>(null);
  const [allStudents, setAllStudents]           = useState<Student[]>([]);
  const [selectedIds, setSelectedIds]           = useState<Set<string>>(new Set());
  const [loadingAssign, setLoadingAssign]       = useState(false);
  const [savingAssign, setSavingAssign]         = useState(false);
  const [studentSearch, setStudentSearch]       = useState('');

  // ── Toast
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ── Load teachers + counts
  const loadTeachers = async () => {
    setLoading(true);
    try {
      const [data, counts] = await Promise.all([
        callTeachers({ action: 'list_teachers' }),
        callTeachers({ action: 'get_assignment_counts' }),
      ]);
      setTeachers(Array.isArray(data) ? data : []);
      setAssignCounts(counts && typeof counts === 'object' ? counts : {});
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeachers(); }, []);

  // ─── Create / Edit ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null); setForm(emptyForm); setFormError(''); setShowPass(false); setShowForm(true);
  };
  const openEdit = (t: Teacher) => {
    setEditingId(t.id); setForm({ full_name: t.full_name, email: t.email, password: '' });
    setFormError(''); setShowPass(false); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setFormError(''); };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setFormError('El nombre es obligatorio'); return; }
    if (!form.email.trim())     { setFormError('El correo es obligatorio'); return; }
    if (!editingId && form.password.length < 6) { setFormError('La contraseña debe tener mínimo 6 caracteres'); return; }
    setSaving(true); setFormError('');
    try {
      if (editingId) {
        await callTeachers({ action: 'update_teacher', id: editingId, full_name: form.full_name.trim(), email: form.email.trim() });
        showToast('✅ Profesor actualizado correctamente');
      } else {
        await callTeachers({ action: 'create_teacher', full_name: form.full_name.trim(), email: form.email.trim(), password: form.password });
        showToast('✅ Profesor creado · correo enviado con credenciales');
      }
      closeForm();
      await loadTeachers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este profesor? Se borrará su cuenta permanentemente.')) return;
    setDeletingId(id);
    try {
      await callTeachers({ action: 'delete_teacher', id });
      showToast('🗑️ Profesor eliminado');
      await loadTeachers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error eliminando');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Assign students ──────────────────────────────────────────────────────
  const openAssign = async (t: Teacher) => {
    setAssignTeacher(t);
    setStudentSearch('');
    setLoadingAssign(true);
    try {
      const [students, assignedIds] = await Promise.all([
        callTeachers({ action: 'list_students' }),
        callTeachers({ action: 'get_assignments', teacher_id: t.id }),
      ]);
      setAllStudents(Array.isArray(students) ? students : []);
      setSelectedIds(new Set(Array.isArray(assignedIds) ? assignedIds : []));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error cargando estudiantes');
      setAssignTeacher(null);
    } finally {
      setLoadingAssign(false);
    }
  };

  const closeAssign = () => { setAssignTeacher(null); setAllStudents([]); setSelectedIds(new Set()); setStudentSearch(''); };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const filtered = filteredStudents.map(s => s.id);
    const allSelected = filtered.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) { filtered.forEach(id => next.delete(id)); }
      else             { filtered.forEach(id => next.add(id)); }
      return next;
    });
  };

  const handleSaveAssign = async () => {
    if (!assignTeacher) return;
    setSavingAssign(true);
    try {
      await callTeachers({ action: 'assign_students', teacher_id: assignTeacher.id, student_ids: [...selectedIds] });
      showToast(`✅ ${selectedIds.size} estudiante${selectedIds.size !== 1 ? 's' : ''} asignado${selectedIds.size !== 1 ? 's' : ''} a ${assignTeacher.full_name}`);
      closeAssign();
      await loadTeachers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error guardando asignación');
    } finally {
      setSavingAssign(false);
    }
  };

  // Filtered students for the search box
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return allStudents;
    return allStudents.filter(s =>
      s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [allStudents, studentSearch]);

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg text-sm font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />{toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Profesores</h1>
              <p className="text-sm text-muted-foreground">Gestiona el equipo docente y sus estudiantes</p>
            </div>
          </div>
          <Button onClick={openCreate} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700 shadow-sm">
            <UserPlus className="w-4 h-4" />Agregar profesor
          </Button>
        </div>

        {/* ── Modal: Crear / Editar profesor ── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg">{editingId ? 'Editar profesor' : 'Agregar profesor'}</h2>
                  <button onClick={closeForm} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Ej: María García" value={form.full_name}
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="pl-10 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Correo personal</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="profesor@ejemplo.com" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="pl-10 rounded-xl" />
                    </div>
                  </div>
                  {!editingId && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="pl-10 pr-10 rounded-xl" />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Se enviará un correo con estas credenciales al profesor.</p>
                    </div>
                  )}
                  {formError && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{formError}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={closeForm} disabled={saving}>Cancelar</Button>
                    <Button className="flex-1 rounded-xl gap-2 bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editingId ? 'Guardar cambios' : 'Crear cuenta'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Asignar estudiantes ── */}
        {assignTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-background rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>
              {/* Header del modal */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-400 shrink-0" />
              <div className="p-5 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                      {assignTeacher.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-base leading-tight">Asignar estudiantes</h2>
                      <p className="text-xs text-muted-foreground">{assignTeacher.full_name}</p>
                    </div>
                  </div>
                  <button onClick={closeAssign} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Buscador */}
                {!loadingAssign && (
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o correo..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="pl-10 rounded-xl h-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Lista de estudiantes */}
              <div className="flex-1 overflow-y-auto">
                {loadingAssign ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
                  </div>
                ) : allStudents.length === 0 ? (
                  <div className="text-center py-14">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-muted-foreground font-medium">No hay estudiantes registrados</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">Sin resultados para "{studentSearch}"</p>
                  </div>
                ) : (
                  <>
                    {/* Seleccionar todos (visibles) */}
                    <div
                      className="flex items-center gap-3 px-5 py-3 border-b border-border cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={toggleAll}
                    >
                      <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        allFilteredSelected ? 'bg-blue-600 border-blue-600' : 'border-muted-foreground'
                      }`}>
                        {allFilteredSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {allFilteredSelected ? 'Deseleccionar todos' : `Seleccionar todos (${filteredStudents.length})`}
                      </span>
                    </div>

                    {/* Filas de estudiantes */}
                    {filteredStudents.map(s => {
                      const isSelected = selectedIds.has(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudent(s.id)}
                          className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-0 ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/40'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            isSelected ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
                          }`}>
                            {s.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                              {s.full_name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                          </div>

                          {/* Level badge */}
                          {s.current_level && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">
                              {s.current_level}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer del modal */}
              <div className="p-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0
                    ? <><strong className="text-foreground">{selectedIds.size}</strong> estudiante{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}</>
                    : 'Ningún estudiante seleccionado'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={closeAssign} disabled={savingAssign}>
                    Cancelar
                  </Button>
                  <Button
                    className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveAssign}
                    disabled={savingAssign || loadingAssign}
                  >
                    {savingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Guardar asignación
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Lista de profesores ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : teachers.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border-dashed border-2">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-muted-foreground">Aún no hay profesores registrados</p>
            <p className="text-sm text-muted-foreground mt-1">Haz clic en "Agregar profesor" para comenzar.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {teachers.map(t => {
              const count = assignCounts[t.id] ?? 0;
              return (
                <Card key={t.id} className="p-4 rounded-2xl border-border/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {t.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t.full_name}</p>
                      <p className="text-xs text-muted-foreground">{t.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {t.is_active ? '✅ Activo' : '⏸️ Inactivo'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {count} estudiante{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Button
                        variant="outline" size="sm"
                        className="rounded-xl gap-1.5 h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => openAssign(t)}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Asignar estudiantes
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="rounded-xl gap-1.5 h-8"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="rounded-xl gap-1.5 h-8 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
