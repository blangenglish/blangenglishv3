// @ts-nocheck
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  UserPlus, Pencil, Trash2, X, Check, Loader2, GraduationCap,
  Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
} from 'lucide-react';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string;
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
  if (!res.ok || payload?.error) {
    throw new Error(payload?.error ?? `Error ${res.status}`);
  }
  return payload?.data;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { full_name: '', email: '', password: '' };

export default function AdminTeachers() {
  const [teachers, setTeachers]       = useState<Teacher[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState(emptyForm);
  const [showPass, setShowPass]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [error, setError]             = useState('');
  const [toast, setToast]             = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const data = await callTeachers({ action: 'list_teachers' });
      setTeachers(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando profesores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeachers(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowPass(false);
    setShowForm(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({ full_name: t.full_name, email: t.email, password: '' });
    setError('');
    setShowPass(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.email.trim())     { setError('El correo es obligatorio'); return; }
    if (!editingId && form.password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres'); return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await callTeachers({
          action: 'update_teacher',
          id: editingId,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
        });
        showToast('✅ Profesor actualizado correctamente');
      } else {
        await callTeachers({
          action: 'create_teacher',
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        showToast('✅ Profesor creado y correo enviado con credenciales');
      }
      closeForm();
      await loadTeachers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este profesor? Se borrará su cuenta de acceso permanentemente.')) return;
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-700" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Profesores</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-13">
              Gestiona las cuentas de acceso del equipo docente
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-xl gap-2 bg-green-600 hover:bg-green-700 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Agregar profesor
          </Button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg">
                    {editingId ? 'Editar profesor' : 'Agregar profesor'}
                  </h2>
                  <button onClick={closeForm} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Ej: María García"
                        value={form.full_name}
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        className="pl-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Correo personal</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="profesor@ejemplo.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="pl-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Contraseña — solo al crear */}
                  {!editingId && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          className="pl-10 pr-10 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se enviará automáticamente un correo con estas credenciales al profesor.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={closeForm} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 rounded-xl gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editingId ? 'Guardar cambios' : 'Crear cuenta'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : teachers.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border-dashed border-2">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-muted-foreground">Aún no hay profesores registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Haz clic en "Agregar profesor" para crear la primera cuenta.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {teachers.map(t => (
              <Card
                key={t.id}
                className="p-4 rounded-2xl border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg shrink-0">
                    {t.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t.full_name}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Creado el {new Date(t.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                    t.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.is_active ? '✅ Activo' : '⏸️ Inactivo'}
                  </span>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 h-8"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 h-8 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                    >
                      {deletingId === t.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
