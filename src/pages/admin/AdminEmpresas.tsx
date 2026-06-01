// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { adminInsert, adminUpdate, adminDelete, adminSelect } from '@/lib/adminWrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Users, Plus, Search, ChevronLeft, Trash2,
  Edit2, Check, X, Mail, BookOpen, History, CreditCard,
  CalendarDays, Loader2, Eye, EyeOff, ToggleLeft, ToggleRight,
  Globe, Briefcase, Send,
} from 'lucide-react';

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface EmpresaStudent {
  id: string;
  full_name: string;
  email?: string;
  company_name?: string;
  account_status?: string;
  account_enabled?: boolean;
  created_at?: string;
  current_level?: string;
  is_empresa?: boolean;
  subscription?: {
    plan_name?: string;
    status?: string;
    current_period_end?: string;
    amount_usd?: number;
    payment_method?: string;
  };
}

interface EmpresaModule {
  id: string;
  title: string;
  level: 'B1' | 'B2' | 'C1';
  description?: string;
  content?: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

interface PaymentRow {
  id: string;
  event_type: string;
  amount_usd: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active:          { label: 'Activo',           cls: 'bg-green-100 text-green-700' },
  active_trial:    { label: 'Prueba activa',     cls: 'bg-blue-100 text-blue-700' },
  pending_payment: { label: 'Pago pendiente',    cls: 'bg-amber-100 text-amber-700' },
  pending:         { label: 'Pendiente',         cls: 'bg-amber-100 text-amber-700' },
  expired_trial:   { label: 'Prueba expirada',   cls: 'bg-gray-100 text-gray-500' },
  disabled:        { label: 'Deshabilitado',     cls: 'bg-red-100 text-red-600' },
  cancelled:       { label: 'Cancelado',         cls: 'bg-red-100 text-red-600' },
};

const LEVEL_COLORS: Record<string, string> = {
  B1: 'bg-blue-100 text-blue-700 border-blue-200',
  B2: 'bg-purple-100 text-purple-700 border-purple-200',
  C1: 'bg-orange-100 text-orange-700 border-orange-200',
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminEmpresas() {
  const [tab, setTab] = useState<'estudiantes' | 'modulos'>('estudiantes');

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Inglés para Empresas</h1>
            <p className="text-sm text-muted-foreground">Gestiona estudiantes corporativos y módulos especializados</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit mb-6">
          {(['estudiantes', 'modulos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'estudiantes' ? '👥 Estudiantes' : '📚 Módulos'}
            </button>
          ))}
        </div>

        {tab === 'estudiantes' && <EmpresaStudentsTab />}
        {tab === 'modulos' && <EmpresaModulesTab />}
      </div>
    </AdminLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 1: ESTUDIANTES
═══════════════════════════════════════════════════════════════════════════ */
function EmpresaStudentsTab() {
  const [students, setStudents] = useState<EmpresaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EmpresaStudent | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /* Payment history per student */
  const [payHistory, setPayHistory] = useState<Record<string, PaymentRow[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});

  /* Activation form */
  const PLAN = {
    slug: 'empresas_trimestral',
    name: 'Plan Empresas (3 meses)',
    days: 90,
    defaultAmount: 80,
    accountStatus: 'active',
    subStatus: 'active',
  };
  const [activationForm, setActivationForm] = useState({
    activationDate: new Date().toISOString().split('T')[0],
    amount: String(PLAN.defaultAmount),
    method: 'PayPal',
    notes: '',
  });
  const [activating, setActivating] = useState(false);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  /* ── Load students ── */
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-update-student', {
        body: { action: 'list_all_students' },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (error || !data?.students) {
        // Fallback directo
        const { data: direct } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('is_empresa', true)
          .order('created_at', { ascending: false });
        setStudents(direct ?? []);
      } else {
        setStudents(
          (data.students as EmpresaStudent[]).filter(s => s.is_empresa === true)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  /* ── Load payment history ── */
  const loadPayHistory = async (studentId: string, force = false) => {
    if (payHistory[studentId] && !force) return;
    setLoadingHistory(p => ({ ...p, [studentId]: true }));
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (!error) setPayHistory(p => ({ ...p, [studentId]: data ?? [] }));
    } finally {
      setLoadingHistory(p => ({ ...p, [studentId]: false }));
    }
  };

  /* ── Select student → load history ── */
  const handleSelect = (s: EmpresaStudent) => {
    setSelected(s);
    loadPayHistory(s.id);
    setActivationForm({
      activationDate: new Date().toISOString().split('T')[0],
      amount: String(PLAN.defaultAmount),
      method: 'PayPal',
      notes: '',
    });
  };

  /* ── Activate plan ── */
  const handleActivate = async () => {
    if (!selected) return;
    setActivating(true);
    try {
      const activationDate = new Date(activationForm.activationDate + 'T12:00:00');
      const periodEnd = new Date(activationDate.getTime() + PLAN.days * 24 * 60 * 60 * 1000);
      const amount = parseFloat(activationForm.amount) || 0;

      const fmtShort = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

      // Edge function activate_plan
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('admin-update-student', {
        body: {
          action: 'activate_plan',
          student_id: selected.id,
          activation_date: activationDate.toISOString(),
          amount_usd: amount,
          payment_method: activationForm.method,
          level: selected.current_level || 'B1',
          notes: activationForm.notes || '',
          plan_slug: PLAN.slug,
          plan_name: PLAN.name,
          period_end: periodEnd.toISOString(),
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      // Actualizar subscriptions
      const subPayload = {
        plan_slug: PLAN.slug,
        plan_name: PLAN.name,
        status: PLAN.subStatus,
        amount_usd: amount,
        payment_method: activationForm.method,
        account_enabled: true,
        approved_by_admin: true,
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        await adminUpdate('subscriptions', subPayload, selected.id);
      } catch {
        try { await adminInsert('subscriptions', { student_id: selected.id, ...subPayload }); } catch {}
      }

      // Actualizar student_profiles
      await adminUpdate('student_profiles', {
        account_enabled: true,
        account_status: PLAN.accountStatus,
        updated_at: new Date().toISOString(),
      }, selected.id);

      // Registrar payment_history
      await adminInsert('payment_history', {
        student_id: selected.id,
        event_type: 'payment_approved',
        amount_usd: amount,
        payment_method: activationForm.method,
        notes: `${PLAN.name} — Vence: ${fmtShort(periodEnd)}${activationForm.notes ? ' · ' + activationForm.notes : ''}`,
        created_by: 'admin',
      });

      showMsg('success', `✅ ${PLAN.name} activado hasta ${fmtShort(periodEnd)}`);
      await loadStudents();
      loadPayHistory(selected.id, true);

      // Update selected
      setSelected(prev => prev ? { ...prev, account_enabled: true, account_status: PLAN.accountStatus } : prev);
    } catch (e: any) {
      showMsg('error', `Error: ${e?.message || 'Error inesperado'}`);
    } finally {
      setActivating(false);
    }
  };

  /* ── Delete student ── */
  const handleDelete = async (studentId: string) => {
    if (!confirm('¿Eliminar este estudiante? Esta acción no se puede deshacer.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('admin-update-student', {
        body: { action: 'delete_account', student_id: studentId },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      showMsg('success', 'Estudiante eliminado');
      setSelected(null);
      await loadStudents();
    } catch (e: any) {
      showMsg('error', `Error al eliminar: ${e?.message}`);
    }
  };

  const filtered = students.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Detail view ── */
  if (selected) {
    const status = STATUS_LABELS[selected.account_status || 'pending'] || STATUS_LABELS.pending;
    const history = payHistory[selected.id] ?? [];

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg.text}
          </div>
        )}

        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Volver a la lista
        </button>

        {/* Info card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-xl font-bold text-teal-700">
                {selected.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-lg font-bold">{selected.full_name}</h2>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                {selected.company_name && (
                  <p className="text-xs text-teal-600 font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" /> {selected.company_name}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Nivel actual</p>
              <p className="font-semibold">{selected.current_level || 'Sin asignar'}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Registrado</p>
              <p className="font-semibold">{selected.created_at ? fmtDate(selected.created_at) : '—'}</p>
            </div>
            {selected.subscription?.current_period_end && (
              <div className="bg-muted/40 rounded-xl p-3 col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Plan activo hasta</p>
                <p className="font-semibold text-green-700">{fmtDate(selected.subscription.current_period_end)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activate plan */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-600" />
            Activar {PLAN.name}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha de activación</Label>
              <Input
                type="date"
                value={activationForm.activationDate}
                onChange={e => setActivationForm(p => ({ ...p, activationDate: e.target.value }))}
                className="rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Monto (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={activationForm.amount}
                onChange={e => setActivationForm(p => ({ ...p, amount: e.target.value }))}
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <Label className="text-xs font-medium">Método de pago</Label>
            <div className="flex gap-2">
              {['PayPal', 'Bold (PSE)', 'Transferencia', 'Efectivo'].map(m => (
                <button
                  key={m}
                  onClick={() => setActivationForm(p => ({ ...p, method: m }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    activationForm.method === m
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-border text-muted-foreground hover:border-teal-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 mb-4">
            <Label className="text-xs font-medium">Notas (opcional)</Label>
            <Input
              placeholder="Ej: Factura #001, empresa XYZ"
              value={activationForm.notes}
              onChange={e => setActivationForm(p => ({ ...p, notes: e.target.value }))}
              className="rounded-xl text-sm"
            />
          </div>

          <Button
            onClick={handleActivate}
            disabled={activating}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
          >
            {activating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Activando...
              </span>
            ) : (
              `✅ Activar ${PLAN.name} (+${PLAN.days} días)`
            )}
          </Button>
        </div>

        {/* Payment history */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Historial de pagos
          </h3>

          {loadingHistory[selected.id] ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados</p>
          ) : (
            <div className="space-y-2">
              {history.map(row => {
                const planName = row.notes?.match(/^(.+?)\s*[—–-]/)?.[1]?.trim() || 'Pago';
                const statusInfo =
                  row.event_type === 'payment_approved' ? { label: 'Aprobado', cls: 'bg-green-100 text-green-700' } :
                  row.event_type === 'payment_pending'  ? { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' } :
                  row.event_type === 'cancelled'        ? { label: 'Cancelado', cls: 'bg-red-100 text-red-700' } :
                                                          { label: 'Registrado', cls: 'bg-muted text-muted-foreground' };
                return (
                  <div key={row.id} className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{planName}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(row.created_at)} · {row.payment_method || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{row.amount_usd > 0 ? `$${row.amount_usd} USD` : '—'}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-red-700 mb-3 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Zona peligrosa
          </h3>
          <Button
            variant="outline"
            onClick={() => handleDelete(selected.id)}
            className="border-red-300 text-red-600 hover:bg-red-100 rounded-xl text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar estudiante
          </Button>
        </div>
      </motion.div>
    );
  }

  /* ── List view ── */
  return (
    <div>
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 rounded-xl"
            placeholder="Buscar por nombre, correo o empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar estudiante
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-bold text-teal-800">{students.length}</span>
          <span className="text-teal-600 ml-1">estudiantes de empresa</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-bold text-green-800">
            {students.filter(s => s.account_status === 'active').length}
          </span>
          <span className="text-green-600 ml-1">activos</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-bold text-amber-800">
            {students.filter(s => s.account_status === 'pending_payment').length}
          </span>
          <span className="text-amber-600 ml-1">pago pendiente</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? 'No se encontraron resultados' : 'Aún no hay estudiantes de empresa'}
          </p>
          <p className="text-sm mt-1">
            {!search && 'Agrega el primer estudiante con el botón de arriba'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Estudiante</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Empresa</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Registrado</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(s => {
                const status = STATUS_LABELS[s.account_status || 'pending'] || STATUS_LABELS.pending;
                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-sm font-bold text-teal-700 shrink-0">
                          {s.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold">{s.full_name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {s.company_name || '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {s.created_at ? fmtDate(s.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelect(s)}
                        className="rounded-lg text-xs font-semibold"
                      >
                        Ver detalles →
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add student modal */}
      <AnimatePresence>
        {showAdd && (
          <AddStudentModal
            onClose={() => setShowAdd(false)}
            onCreated={() => { setShowAdd(false); loadStudents(); showMsg('success', '✅ Estudiante creado correctamente'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL: Agregar estudiante de empresa
═══════════════════════════════════════════════════════════════════════════ */
function AddStudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    level: 'B1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setLoading(true);
    setError('');
    try {
      // 1. Crear usuario en Auth
      const { data: { session } } = await supabase.auth.getSession();
      const { data: authResult, error: authErr } = await supabase.functions.invoke('admin-user-manager-2026', {
        body: {
          action: 'create',
          email: form.email.trim(),
          password: form.password.trim(),
          full_name: form.name.trim(),
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (authErr || !authResult?.user?.id) {
        throw new Error(authErr?.message || authResult?.error || 'No se pudo crear el usuario');
      }
      const userId = authResult.user.id;

      // 2. Crear/actualizar student_profile
      await adminInsert('student_profiles', {
        id: userId,
        full_name: form.name.trim(),
        company_name: form.company.trim() || null,
        current_level: form.level,
        account_status: 'pending_payment',
        account_enabled: false,
        is_empresa: true,
        onboarding_step: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 3. Enviar correo con credenciales (best-effort)
      supabase.functions.invoke('send-session-email', {
        body: {
          type: 'empresa_credenciales',
          studentName: form.name.trim(),
          studentEmail: form.email.trim(),
          password: form.password.trim(),
          company: form.company.trim(),
          level: form.level,
        },
      }).catch(() => {});

      onCreated();
    } catch (e: any) {
      setError(e?.message || 'Error al crear el estudiante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-background rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-t-3xl" />
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" /> Agregar estudiante de empresa
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Se creará una cuenta y se enviará el correo con credenciales</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nombre completo *</Label>
              <Input
                placeholder="Nombre completo"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Correo electrónico *</Label>
              <Input
                type="email"
                placeholder="correo@empresa.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Empresa</Label>
              <Input
                placeholder="Nombre de la empresa (opcional)"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Contraseña temporal *</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nivel inicial</Label>
              <div className="flex gap-2">
                {(['B1', 'B2', 'C1'] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, level: l }))}
                    className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                      form.level === l
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-border text-muted-foreground hover:border-teal-400'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold py-6"
              disabled={loading || !form.name.trim() || !form.email.trim() || !form.password.trim()}
              onClick={handleSubmit}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Crear estudiante y enviar credenciales
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 2: MÓDULOS EMPRESARIALES
═══════════════════════════════════════════════════════════════════════════ */
function EmpresaModulesTab() {
  const [modules, setModules] = useState<EmpresaModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'B1' | 'B2' | 'C1'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const emptyForm = { title: '', level: 'B1' as const, description: '', content: '', is_published: true, sort_order: 0 };
  const [form, setForm] = useState(emptyForm);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadModules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empresa_modules')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });
      if (!error) setModules(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadModules(); }, [loadModules]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editingId) {
        await adminUpdate('empresa_modules', {
          title: form.title.trim(),
          level: form.level,
          description: form.description.trim(),
          content: form.content.trim(),
          is_published: form.is_published,
          sort_order: Number(form.sort_order) || 0,
          updated_at: new Date().toISOString(),
        }, editingId);
        showMsg('success', '✅ Módulo actualizado');
      } else {
        await adminInsert('empresa_modules', {
          title: form.title.trim(),
          level: form.level,
          description: form.description.trim(),
          content: form.content.trim(),
          is_published: form.is_published,
          sort_order: Number(form.sort_order) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        showMsg('success', '✅ Módulo creado');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadModules();
    } catch (e: any) {
      showMsg('error', `Error: ${e?.message}`);
    }
  };

  const handleEdit = (mod: EmpresaModule) => {
    setForm({
      title: mod.title,
      level: mod.level,
      description: mod.description || '',
      content: mod.content || '',
      is_published: mod.is_published,
      sort_order: mod.sort_order,
    });
    setEditingId(mod.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este módulo?')) return;
    try {
      await adminDelete('empresa_modules', id);
      showMsg('success', '✅ Módulo eliminado');
      await loadModules();
    } catch (e: any) {
      showMsg('error', `Error: ${e?.message}`);
    }
  };

  const handleTogglePublish = async (mod: EmpresaModule) => {
    try {
      await adminUpdate('empresa_modules', {
        is_published: !mod.is_published,
        updated_at: new Date().toISOString(),
      }, mod.id);
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_published: !m.is_published } : m));
    } catch (e: any) {
      showMsg('error', `Error: ${e?.message}`);
    }
  };

  const filtered = filterLevel === 'all' ? modules : modules.filter(m => m.level === filterLevel);

  return (
    <div>
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Level filter */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(['all', 'B1', 'B2', 'C1'] as const).map(l => (
            <button
              key={l}
              onClick={() => setFilterLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterLevel === l
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l === 'all' ? 'Todos' : l}
            </button>
          ))}
        </div>

        <Button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold gap-2 ml-auto"
        >
          <Plus className="w-4 h-4" /> Nuevo módulo
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-teal-200 rounded-2xl p-5 mb-5"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              {editingId ? 'Editar módulo' : 'Nuevo módulo'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Título *</Label>
                <Input
                  placeholder="Ej: Business English Meetings"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nivel</Label>
                <div className="flex gap-2">
                  {(['B1', 'B2', 'C1'] as const).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, level: l }))}
                      className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                        form.level === l
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-border text-muted-foreground hover:border-teal-400'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mb-3">
              <Label className="text-xs font-medium">Descripción corta</Label>
              <Input
                placeholder="Breve descripción del módulo"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5 mb-3">
              <Label className="text-xs font-medium">Contenido (texto, Markdown o URL de recurso)</Label>
              <textarea
                placeholder="Contenido del módulo, ejercicios, links, etc."
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Orden</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">¿Publicado?</Label>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))}
                  className={`w-full py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                    form.is_published
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {form.is_published ? '✅ Publicado' : '🔒 Oculto'}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
              >
                <Check className="w-4 h-4 mr-1" /> {editingId ? 'Guardar cambios' : 'Crear módulo'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="rounded-xl"
              >
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modules list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin módulos {filterLevel !== 'all' ? `nivel ${filterLevel}` : ''}</p>
          <p className="text-sm mt-1">Crea el primer módulo con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(mod => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${LEVEL_COLORS[mod.level] || 'bg-muted text-muted-foreground border-border'}`}>
                    {mod.level}
                  </span>
                  {!mod.is_published && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                      Oculto
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">Orden: {mod.sort_order}</span>
                </div>
                <h3 className="font-bold text-sm">{mod.title}</h3>
                {mod.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                )}
                {mod.content && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1 font-mono">
                    {mod.content.substring(0, 80)}{mod.content.length > 80 ? '…' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleTogglePublish(mod)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title={mod.is_published ? 'Ocultar' : 'Publicar'}
                >
                  {mod.is_published
                    ? <ToggleRight className="w-5 h-5 text-green-600" />
                    : <ToggleLeft className="w-5 h-5" />
                  }
                </button>
                <button
                  onClick={() => handleEdit(mod)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(mod.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
