// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { adminInsert, adminUpdate, adminDelete, adminDeleteByFilter, adminUpsert } from '@/lib/adminWrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search, Users, TrendingUp, CreditCard, Edit2,
  Check, X, Mail, Calendar, Award, Flame,
  ChevronDown, ChevronUp, BookOpen, AlertCircle, KeyRound, RefreshCw,
  Video, Clock, Target, ShieldCheck, ShieldX, Trash2, Lock, Unlock,
  ToggleLeft, ToggleRight, History, Gift, FileText, Printer, Send,
} from 'lucide-react';

interface SessionRequestRow {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  sessions: Array<{ date: string; topic: string }>;
  weekly_plan: boolean;
  weekly_hours: string;
  weekly_schedule: string;
  objective: string;
  created_at: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  current_level: string;
  english_level?: string;
  created_at: string;
  email?: string;
  birthday?: string;
  education_level?: string;
  education_other?: string;
  country?: string;
  city?: string;
  bio?: string;
  onboarding_step?: string;
  is_admin_only?: boolean;
  account_enabled?: boolean;
  subscription?: {
    plan_slug?: string;
    plan_name: string;
    status: string;
    amount_usd: number;
    trial_ends_at: string;
    current_period_end: string;
    payment_method?: string;
    approved_by_admin?: boolean;
    renewal_due_at?: string;
    account_enabled?: boolean;
    created_at?: string;
  };
  progress?: Array<{
    course_slug: string;
    completed_units: number;
    total_units: number;
    streak_days: number;
    total_points: number;
  }>;
  unit_completions_count?: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial:     { label: 'Prueba', color: 'bg-blue-100 text-blue-700' },
  active:    { label: 'Activo', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  expired:   { label: 'Expirado', color: 'bg-gray-100 text-gray-700' },
};

// ─── Helpers para facturas ───────────────────────────────────────────────────

function eventTypeLabel(type: string) {
  if (type === 'payment_approved') return 'Pago aprobado — Plan Mensual';
  if (type === 'payment_pending')  return 'Pago en revisión — Plan Mensual';
  if (type === 'subscription_created') return 'Suscripción creada';
  if (type === 'cancelled')        return 'Cancelación de suscripción';
  return type.replace(/_/g, ' ');
}

function eventStatusLabel(type: string) {
  if (type === 'payment_approved') return 'Aprobado';
  if (type === 'payment_pending')  return 'Pendiente';
  if (type === 'cancelled')        return 'Cancelado';
  return 'Registrado';
}

function generateInvoiceHTML({ studentName, studentEmail, studentCity, studentCountry, invoiceNumber, invoiceDate, items }: any) {
  const total = items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const locationStr = [studentCity, studentCountry].filter(Boolean).join(', ');
  const rowsHtml = items.map((it: any, i: number) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f9f7ff';
    const sc = it.status === 'Aprobado' ? '#16a34a' : it.status === 'Pendiente' ? '#d97706' : '#6b7280';
    const mi = it.method === 'PAYPAL' ? '🅿' : it.method === 'PSE' ? '🏦' : it.method === 'MANUAL' ? '💵' : '💳';
    return `<tr style="background:${bg}"><td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb">${it.date}</td><td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb">${it.description}</td><td style="padding:10px 14px;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;text-align:center">${mi} ${it.method}</td><td style="padding:10px 14px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${sc}20;color:${sc};padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700">${it.status}</span></td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#7c3aed;border-bottom:1px solid #e5e7eb;text-align:right">$${(it.amount||0).toFixed(2)} USD</td></tr>`;
  }).join('');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Factura ${invoiceNumber}</title><style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body style="margin:0;padding:32px;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center"><table width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)"><tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:36px 40px"><table width="100%"><tr><td><div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px">BLANG</div><div style="font-size:11px;font-weight:500;color:#c4b5fd;letter-spacing:3px;text-transform:uppercase;margin-top:2px">English Academy</div></td><td align="right"><div style="font-size:30px;font-weight:900;color:#fff;letter-spacing:2px">FACTURA</div><div style="font-size:12px;color:#c4b5fd;margin-top:4px">${invoiceNumber}</div><div style="font-size:12px;color:#c4b5fd">${invoiceDate}</div></td></tr></table></td></tr><tr><td style="padding:32px 40px 20px;border-bottom:2px solid #f3f4f6"><table width="100%"><tr><td width="50%" style="vertical-align:top"><div style="font-size:10px;font-weight:700;color:#7c3aed;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">EMITIDO POR</div><div style="font-size:14px;font-weight:700;color:#111827">BLANG English Academy</div><div style="font-size:12px;color:#6b7280;margin-top:4px">blangenglishlearning@blangenglish.com</div><div style="font-size:12px;color:#6b7280">www.blangenglish.com</div></td><td width="50%" style="vertical-align:top;padding-left:24px;border-left:2px solid #f3f4f6"><div style="font-size:10px;font-weight:700;color:#7c3aed;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">FACTURADO A</div><div style="font-size:14px;font-weight:700;color:#111827">${studentName}</div><div style="font-size:12px;color:#6b7280;margin-top:4px">${studentEmail}</div>${locationStr ? `<div style="font-size:12px;color:#6b7280">${locationStr}</div>` : ''}</td></tr></table></td></tr><tr><td style="padding:24px 40px"><table width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><thead><tr style="background:#7c3aed"><th style="padding:12px 14px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;text-align:left">Fecha</th><th style="padding:12px 14px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;text-align:left">Descripción</th><th style="padding:12px 14px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;text-align:center">Método</th><th style="padding:12px 14px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;text-align:center">Estado</th><th style="padding:12px 14px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;text-align:right">Valor</th></tr></thead><tbody>${rowsHtml}</tbody></table></td></tr><tr><td style="padding:0 40px 28px"><table width="100%"><tr><td></td><td align="right"><table style="border:2px solid #7c3aed;border-radius:12px;overflow:hidden;min-width:220px"><tr style="background:#f9f7ff"><td style="padding:14px 20px;font-size:14px;color:#4b5563;font-weight:600">Total pagado</td><td style="padding:14px 20px;font-size:22px;font-weight:900;color:#7c3aed;text-align:right">$${total.toFixed(2)} USD</td></tr></table></td></tr></table></td></tr><tr><td style="background:#f9f7ff;padding:24px 40px;border-top:2px solid #ede9fe"><table width="100%"><tr><td><div style="font-size:15px;font-weight:700;color:#7c3aed">¡Gracias por tu confianza! 🎓</div><div style="font-size:12px;color:#6b7280;margin-top:6px">Este documento es un comprobante oficial de pago de BLANG English Academy.</div><div style="font-size:12px;color:#6b7280;margin-top:2px">Consultas: <a href="mailto:blangenglishlearning@blangenglish.com" style="color:#7c3aed">blangenglishlearning@blangenglish.com</a></div></td><td align="right" style="vertical-align:bottom"><div style="font-size:22px;font-weight:900;color:#7c3aed;opacity:.25;letter-spacing:-0.5px">BLANG</div></td></tr></table></td></tr></table></td></tr></table></body></html>`;
}

// ─── InvoiceModal ─────────────────────────────────────────────────────────────
function InvoiceModal({ student, items, onClose }: { student: any; items: any[]; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const [sendError, setSendError] = useState('');

  const payItems = items.filter(i => i.amount_usd > 0);
  const total = payItems.reduce((s, i) => s + (i.amount_usd || 0), 0);

  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${(student.id||'').slice(0,5).toUpperCase()}`;
  const invoiceDate = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  const invoiceItemsForFn = payItems.map(it => ({
    date: new Date(it.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    description: eventTypeLabel(it.event_type),
    method: (it.payment_method || '—').toUpperCase(),
    amount: it.amount_usd || 0,
    status: eventStatusLabel(it.event_type),
  }));

  const handleDownload = () => {
    const html = generateInvoiceHTML({
      studentName: student.full_name || 'Estudiante',
      studentEmail: student.email || '',
      studentCity: student.city || '',
      studentCountry: student.country || '',
      invoiceNumber,
      invoiceDate,
      items: invoiceItemsForFn,
    });
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) { alert('Permite ventanas emergentes para descargar el PDF'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  const handleSendEmail = async () => {
    if (!student.email) { setSendError('Este estudiante no tiene correo registrado.'); return; }
    setSending(true); setSendError(''); setSentMsg('');
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          studentName: student.full_name || 'Estudiante',
          studentEmail: student.email,
          studentCity: student.city || '',
          studentCountry: student.country || '',
          invoiceNumber,
          invoiceDate,
          items: invoiceItemsForFn,
        },
      });
      // La función siempre devuelve 200 — revisamos data.success
      if (error) throw new Error(error.message || 'Error de conexión');
      if (data?.success === false) {
        setSendError(data?.error || 'No se pudo enviar el correo.');
      } else if (data?.sentTo === 'student') {
        setSentMsg(`✅ Factura enviada directamente a ${student.email}`);
      } else if (data?.sentTo === 'admin') {
        setSentMsg(`📬 Factura enviada a tu correo. Reenvíala a ${student.email} desde tu bandeja de entrada.`);
      } else {
        setSentMsg('✅ Factura procesada correctamente.');
      }
    } catch (err: any) {
      setSendError('Error al enviar: ' + (err?.message || String(err)));
    }
    setSending(false);
  };

  const locationStr = [student.city, student.country].filter(Boolean).join(', ');

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Barra de acciones */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
          <span className="flex items-center gap-1.5 font-bold text-sm text-gray-700 flex-1">
            <FileText className="w-4 h-4 text-violet-600" /> Factura · {invoiceNumber}
          </span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Descargar PDF
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Enviando...' : 'Enviar al correo'}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        {sentMsg && <div className="bg-green-50 border-b border-green-200 px-5 py-2.5 text-sm text-green-800 font-medium leading-snug">{sentMsg}</div>}
        {sendError && <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 text-sm text-red-600 font-medium">❌ {sendError}</div>}

        {/* ── PREVIEW DE LA FACTURA ── */}
        <div className="p-6 bg-gray-50">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Header morado */}
            <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }} className="px-8 py-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white tracking-tight">BLANG</p>
                  <p className="text-xs font-medium text-violet-200 tracking-[3px] uppercase mt-0.5">English Academy</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white tracking-widest">FACTURA</p>
                  <p className="text-xs text-violet-200 mt-1">{invoiceNumber}</p>
                  <p className="text-xs text-violet-200">{invoiceDate}</p>
                </div>
              </div>
            </div>

            {/* From / To */}
            <div className="px-8 py-5 border-b-2 border-gray-100 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-violet-600 tracking-[2px] uppercase mb-2">Emitido por</p>
                <p className="text-sm font-bold text-gray-900">BLANG English Academy</p>
                <p className="text-xs text-gray-500 mt-1">blangenglishlearning@blangenglish.com</p>
                <p className="text-xs text-gray-500">www.blangenglish.com</p>
              </div>
              <div className="pl-6 border-l-2 border-gray-100">
                <p className="text-[10px] font-bold text-violet-600 tracking-[2px] uppercase mb-2">Facturado a</p>
                <p className="text-sm font-bold text-gray-900">{student.full_name || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{student.email || '—'}</p>
                {locationStr && <p className="text-xs text-gray-500">{locationStr}</p>}
              </div>
            </div>

            {/* Tabla de pagos */}
            <div className="px-8 py-5">
              <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
                <thead>
                  <tr style={{ background: '#7c3aed' }}>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-white uppercase tracking-wide">Fecha</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-white uppercase tracking-wide">Descripción</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide">Método</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-white uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-white uppercase tracking-wide">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {payItems.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-gray-400 text-xs">Sin pagos registrados</td></tr>
                  ) : payItems.map((it, idx) => {
                    const sc = it.event_type === 'payment_approved' ? 'text-green-700 bg-green-100' : it.event_type === 'payment_pending' ? 'text-amber-700 bg-amber-100' : 'text-gray-600 bg-gray-100';
                    const mi = (it.payment_method||'').toUpperCase() === 'PAYPAL' ? '🅿' : (it.payment_method||'').toUpperCase() === 'PSE' ? '🏦' : (it.payment_method||'').toUpperCase() === 'MANUAL' ? '💵' : '💳';
                    return (
                      <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-violet-50/40'}>
                        <td className="px-4 py-2.5 text-xs text-gray-700 border-b border-gray-100">
                          {new Date(it.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700 border-b border-gray-100">
                          {eventTypeLabel(it.event_type)}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700 border-b border-gray-100 text-center">
                          {mi} {(it.payment_method || '—').toUpperCase()}
                        </td>
                        <td className="px-4 py-2.5 border-b border-gray-100 text-center">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${sc}`}>{eventStatusLabel(it.event_type)}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-bold text-violet-700 border-b border-gray-100 text-right">
                          {it.amount_usd > 0 ? `$${it.amount_usd.toFixed(2)} USD` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="px-8 pb-5 flex justify-end">
              <div className="border-2 border-violet-600 rounded-xl overflow-hidden">
                <div className="flex items-center gap-8 px-6 py-3 bg-violet-50">
                  <span className="text-sm font-semibold text-gray-600">Total pagado</span>
                  <span className="text-2xl font-black text-violet-700">${total.toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-violet-50 border-t-2 border-violet-100 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-violet-700">¡Gracias por tu confianza! 🎓</p>
                <p className="text-xs text-gray-500 mt-1">Comprobante oficial de pago — BLANG English Academy</p>
                <p className="text-xs text-gray-500">Consultas: blangenglishlearning@blangenglish.com</p>
              </div>
              <p className="text-2xl font-black text-violet-300 tracking-tight select-none">BLANG</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '', current_level: '', english_level: '',
    country: '', city: '', birthday: '', email: '',
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaveMsg, setEmailSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Record<string, 'info' | 'progreso' | 'pagos' | 'cuenta' | 'modulos'>>({});
  const [detailedProgress, setDetailedProgress] = useState<Record<string, any[]>>({});
  const [loadingProgress, setLoadingProgress] = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ student: any; items: any[] } | null>(null);

  const loadDetailedProgress = async (studentId: string) => {
    if (detailedProgress[studentId]) return;
    setLoadingProgress(studentId);
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, level')
        .order('sort_order', { ascending: true });

      if (!courses) return;

      const result = await Promise.all(courses.map(async (course) => {
        const { data: units } = await supabase
          .from('units')
          .select('id, title')
          .eq('course_id', course.id)
          .eq('is_published', true);

        const totalUnits = units?.length ?? 0;

        const { data: progressRows } = await supabase
          .from('unit_progress')
          .select('unit_id')
          .eq('student_id', studentId)
          .eq('completed', true);

        const completedUnitIds = new Set((progressRows ?? []).map(r => r.unit_id));
        const completedUnits = (units ?? []).filter(u => completedUnitIds.has(u.id)).length;

        return { level: course.level, title: course.title, totalUnits, completedUnits };
      }));

      setDetailedProgress(prev => ({ ...prev, [studentId]: result.filter(r => r.totalUnits > 0) }));
    } catch (e) {
      console.error('Error cargando progreso:', e);
    } finally {
      setLoadingProgress(null);
    }
  };

  // Draft de cambios del tab Cuenta (pendientes de guardar)
  interface AccountDraft {
    account_enabled: boolean;
    onboarding_step: string; // 'completed' | 'english_test'
    sub_status: string;      // 'active' | 'cancelled' | 'trial'
    english_level: string;
  }
  const [accountDrafts, setAccountDrafts] = useState<Record<string, AccountDraft>>({});
  const [savingAccount, setSavingAccount] = useState<string | null>(null);

  const getAccountDraft = (student: StudentRow): AccountDraft => {
    if (accountDrafts[student.id]) return accountDrafts[student.id];
    return {
      account_enabled: student.account_enabled !== false,
      onboarding_step: student.onboarding_step || 'completed',
      sub_status: student.subscription?.status || 'active',
      english_level: student.english_level || student.current_level || '',
    };
  };

  const setDraftField = (studentId: string, field: keyof AccountDraft, value: boolean | string, baseStudent: StudentRow) => {
    setAccountDrafts(prev => ({
      ...prev,
      [studentId]: { ...getAccountDraft(baseStudent), ...(prev[studentId] || {}), [field]: value },
    }));
  };

  const hasDraftChanges = (student: StudentRow): boolean => {
    const draft = accountDrafts[student.id];
    if (!draft) return false;
    const base = {
      account_enabled: student.account_enabled !== false,
      onboarding_step: student.onboarding_step || 'completed',
      sub_status: student.subscription?.status || 'active',
      english_level: student.english_level || student.current_level || '',
    };
    return (
      draft.account_enabled !== base.account_enabled ||
      draft.onboarding_step !== base.onboarding_step ||
      draft.sub_status !== base.sub_status ||
      draft.english_level !== base.english_level
    );
  };

  const saveAccountChanges = async (student: StudentRow) => {
    const draft = accountDrafts[student.id];
    if (!draft) return;
    setSavingAccount(student.id);
    try {
      // ── Derivar account_status correcto según el draft ──
      // El Dashboard usa account_status como fuente primaria de verdad.
      // NUNCA dejar account_status en 'pending' si el admin está activando la cuenta.
      let newAccountStatus: string;
      if (!draft.account_enabled) {
        newAccountStatus = 'disabled';
      } else if (draft.sub_status === 'active') {
        newAccountStatus = 'active';
      } else if (draft.sub_status === 'trial') {
        newAccountStatus = 'active_trial';
      } else if (draft.sub_status === 'cancelled') {
        newAccountStatus = 'cancelled';
      } else {
        newAccountStatus = 'active'; // default: si admin habilitó → activo
      }

      // ── 1. Actualizar student_profiles con TODOS los campos relevantes ──
      const profileUpdate: Record<string, unknown> = {
        account_enabled: draft.account_enabled,
        account_status: newAccountStatus,          // ← CLAVE: fuente primaria del Dashboard
        onboarding_step: draft.onboarding_step,
        // Si el admin activa el examen, borrar el nivel para que el estudiante lo defina
        english_level: draft.onboarding_step === 'english_test' ? null : (draft.english_level || null),
        updated_at: new Date().toISOString(),
      };

      await adminUpdate('student_profiles', profileUpdate, student.id);

      // ── 2. Actualizar subscriptions ──
      if (student.subscription) {
        const subUpdate: Record<string, unknown> = {
          status: draft.sub_status,
          account_enabled: draft.account_enabled,
          approved_by_admin: draft.account_enabled && draft.sub_status === 'active',
          updated_at: new Date().toISOString(),
        };
        try { await adminUpdate('subscriptions', subUpdate, student.id); } catch(e) { console.error('sub update error', e); }
      } else if (draft.account_enabled && draft.sub_status === 'active') {
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 1);
        try {
          await adminInsert('subscriptions', {
            student_id: student.id, plan_slug: 'monthly', plan_name: 'Plan Mensual',
            status: 'active', amount_usd: 15, payment_method: 'manual',
            approved_by_admin: true, account_enabled: true,
            current_period_end: farFuture.toISOString(),
          });
        } catch(e) { console.error('sub insert error', e); }
      }

      // ── 3. Si se deshabilitó, revocar acceso a módulos ──
      if (!draft.account_enabled) {
        const { error: moduleAccessError } = await supabase
          .from('student_module_access')
          .update({ is_active: false })
          .eq('student_id', student.id);
        if (moduleAccessError) console.error('module access revoke error', moduleAccessError);
      }

      // ── 4. Limpiar draft y recargar lista ──
      setAccountDrafts(prev => { const n = { ...prev }; delete n[student.id]; return n; });
      showMsg('success', `✅ Cambios guardados para ${student.full_name}`);
      await loadStudents();
    } catch (err) {
      console.error('saveAccountChanges error:', err);
      showMsg('error', `❌ Error al guardar: ${(err as Error).message}`);
    } finally {
      setSavingAccount(null);
    }
  };
  const [coursesForAccess, setCoursesForAccess] = useState<Array<{id: string; title: string; emoji: string; level?: string; units?: Array<{id: string; title: string}>}>>([]);
  const [studentModuleAccess, setStudentModuleAccess] = useState<Record<string, string[]>>({});
  const [expandedAccessLevel, setExpandedAccessLevel] = useState<Record<string, string | null>>({});
  const [resetSent, setResetSent] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [sessionRequests, setSessionRequests] = useState<SessionRequestRow[]>([]);
  const [sessionReqExpanded, setSessionReqExpanded] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'students' | 'sessions'>('students');
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; title: string; msg: string; fn: () => Promise<void> }>({
    open: false, title: '', msg: '', fn: async () => {}
  });
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showMsg = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 5000);
  };

  // Payment history per student
  interface PayHistRow { id: string; event_type: string; amount_usd: number; payment_method: string; notes?: string; created_at: string; created_by?: string; }
  const [studentPayHistory, setStudentPayHistory] = useState<Record<string, PayHistRow[]>>({});

  // Estado del formulario de activación manual de plan
  const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'Todas', 'Ninguna'];
  const [activationForm, setActivationForm] = useState<Record<string, {
    activationDate: string;
    amount: string;
    method: string;
    level: string;
    notes: string;
    plan: 'trial' | 'mensual' | 'trimestral';
  }>>({});
  const [activating, setActivating] = useState<string | null>(null);
  const [activatingTrial, setActivatingTrial] = useState<string | null>(null);
  const defaultActivationForm = () => ({
    activationDate: new Date().toISOString().split('T')[0],
    amount: '16',
    method: 'paypal',
    level: 'Todas',
    notes: '',
    plan: 'mensual' as const,
  });
  const getActivationForm = (studentId: string) => activationForm[studentId] || defaultActivationForm();
  const setActivationField = (studentId: string, field: string, value: string) => {
    // Bug fix: usar prev[studentId] en lugar de getActivationForm() para evitar leer
    // estado stale cuando hay dos setActivationField consecutivos en el mismo evento
    // (p.ej. al hacer clic en un plan: se actualizan 'plan' y 'amount' al mismo tiempo).
    setActivationForm(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || defaultActivationForm()), [field]: value },
    }));
  };

  const loadPaymentHistory = async (studentId: string, forceReload = false) => {
    if (!forceReload && studentPayHistory[studentId]) return;
    const { data } = await supabase.from('payment_history').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20);
    if (data) setStudentPayHistory(prev => ({ ...prev, [studentId]: data as PayHistRow[] }));
  };

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Pasar JWT token manualmente (verify_jwt: true en la edge)
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-update-student', {
        body: { action: 'list_all_students' },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (error || !data?.students) {
        console.error('Edge error, usando fallback directo:', error);
        // Fallback directo con cliente Supabase (puede estar limitado por RLS)
        const { data: fallbackData } = await supabase
          .from('student_profiles')
          .select('*, subscriptions(*)')
          .neq('is_admin_only', true)
          .order('created_at', { ascending: false });
        if (fallbackData && fallbackData.length > 0) {
          type FallbackRow = StudentRow & { subscriptions?: StudentRow['subscription'] | StudentRow['subscription'][] };
          const rows: StudentRow[] = (fallbackData as FallbackRow[]).map(s => ({
            ...s,
            subscription: Array.isArray(s.subscriptions)
              ? (s.subscriptions as StudentRow['subscription'][])[0] ?? undefined
              : s.subscriptions ?? undefined,
            progress: [] as StudentRow['progress'],
          }));
          setStudents(rows);
        } else {
          setStudents([]);
        }
        return;
      }

      // Filtrar perfiles de admin (is_admin_only = true), mantener null/false
      const rows: StudentRow[] = (data.students as StudentRow[])
        .filter((s: StudentRow) => s.is_admin_only !== true)
        .map((s: StudentRow) => ({
          ...s,
          progress: s.progress || [],
        }));

      setStudents(rows);
    } catch (err) {
      console.error('loadStudents error:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const loadSessionRequests = useCallback(async () => {
    const { data } = await supabase
      .from('session_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSessionRequests(data as SessionRequestRow[]);
  }, []);

  useEffect(() => { loadSessionRequests(); }, [loadSessionRequests]);

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (s: StudentRow) => {
    setEditingId(s.id);
    setExpandedId(s.id); // auto-expand the card
    setEmailSaveMsg(null);
    setEditForm({
      full_name: s.full_name,
      current_level: s.current_level || 'A1', english_level: s.english_level || '',
      country: s.country || '', city: s.city || '', birthday: s.birthday || '',
      email: s.email || '',
    });
  };

  const calcAge = (birthday?: string) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const EDUCATION_LABELS: Record<string, string> = {
    bachiller: 'Bachiller / Secundaria',
    universitario: 'Universitario / Técnico',
    posgrado: 'Posgrado / Maestría / PhD',
    trabajo: 'Trabajo (sin título universitario)',
    otro: 'Otro',
    high_school: 'Bachillerato',
    university: 'Universidad',
    postgraduate: 'Posgrado',
    work: 'Laboral',
    other: 'Otro',
  };

  const sendPasswordReset = async (email: string, studentId: string) => {
    if (!email) return;
    setResetting(studentId);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password`,
    });
    setResetting(null);
    setResetSent(studentId);
    setTimeout(() => setResetSent(null), 4000);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await adminInvoke({
      action: 'update_student',
      student_id: editingId,
      new_full_name: editForm.full_name,
      new_current_level: editForm.current_level,
      new_english_level: editForm.english_level || null,
      new_country: editForm.country,
      new_city: editForm.city,
      new_birthday: editForm.birthday || null,
    });
    if (error) {
      // Direct fallback via RLS
      const { error: fallbackError } = await supabase.from('student_profiles').update({
        full_name: editForm.full_name,
        current_level: editForm.current_level,
        english_level: editForm.english_level || null,
        country: editForm.country,
        city: editForm.city,
        birthday: editForm.birthday || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId);
      if (fallbackError) {
        setSaving(false);
        showMsg('error', `❌ Error al guardar: ${fallbackError.message}`);
        return;
      }
    }
    setSaving(false);
    setEditingId(null);
    await loadStudents();
  };

  // Update email via edge function (also updates auth.users)
  const saveEmail = async (studentId: string) => {
    if (!editForm.email.trim()) return;
    setSavingEmail(true);
    setEmailSaveMsg(null);
    const { data, error } = await adminInvoke({ action: 'update_student', student_id: studentId, new_email: editForm.email.trim() });
    if (error || !data?.success) {
      const errMsg = (data?.results?.email_auth as string) || (error as Error)?.message || 'Error desconocido';
      setEmailSaveMsg(`❌ ${errMsg}`);
    } else {
      setEmailSaveMsg('✅ Correo actualizado (perfil y login del estudiante)');
      await loadStudents();
    }
    setSavingEmail(false);
    setTimeout(() => setEmailSaveMsg(null), 5000);
  };

  // ── Helper: call edge function with auto-fallback to direct Supabase ──
  const adminInvoke = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('admin-update-student', {
      body: payload,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (error) console.error('[admin-invoke] edge error:', error);
    return { data, error };
  };

  const setFreeAccount = async (studentId: string, free: boolean) => {
    await adminInvoke({ action: 'set_free_account', student_id: studentId, free });
    if (!free) await adminInvoke({ student_id: studentId, module_access: { action: 'revoke_all_courses' } });
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 50);
    try {
      await adminDeleteByFilter('subscriptions', { student_id: studentId });
      if (free) {
        await adminInsert('subscriptions', {
          student_id: studentId, plan_slug: 'free_admin', plan_name: 'Acceso Gratuito (Admin)',
          status: 'active', amount_usd: 0, payment_method: 'none',
          approved_by_admin: true, account_enabled: true, current_period_end: farFuture.toISOString(),
        });
        await adminUpdate('student_profiles', { account_enabled: true, account_status: 'active', updated_at: new Date().toISOString() }, studentId);
      } else {
        await adminInsert('subscriptions', {
          student_id: studentId, plan_slug: 'monthly', plan_name: 'Plan Mensual',
          status: 'pending_approval', amount_usd: 15, payment_method: 'paypal',
          approved_by_admin: false, account_enabled: false,
        });
        await adminUpdate('student_profiles', { account_enabled: false, account_status: 'disabled', updated_at: new Date().toISOString() }, studentId);
      }
    } catch(e) { console.error('setFreeAccount error', e); }
    await loadStudents();
  };

  const toggleAccountEnabled = async (studentId: string, enabled: boolean) => {
    const profileStatus = enabled ? 'active' : 'disabled';
    try { await adminUpdate('student_profiles', { account_enabled: enabled, account_status: profileStatus, updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    try { await adminUpdate('subscriptions', { account_enabled: enabled, approved_by_admin: enabled, updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    await loadStudents();
  };

  // Activar plan manualmente — usa edge function con service_role para bypasear RLS
  const activatePlanManual = async (studentId: string) => {
    const form = getActivationForm(studentId);
    setActivating(studentId);
    try {
      const activationDate = form.activationDate ? new Date(form.activationDate + 'T12:00:00') : new Date();
      const fmtShort = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
      const fmtLong  = (d: Date) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

      // Determinar datos del plan
      const planMap = {
        trial:      { slug: 'free_trial',  name: '7 días gratis',   days: 7,  accountStatus: 'active_trial', subStatus: 'trial'  },
        mensual:    { slug: 'monthly',     name: 'Plan Mensual',     days: 30, accountStatus: 'active',       subStatus: 'active' },
        trimestral: { slug: 'trimestral',  name: 'Plan Trimestral',  days: 90, accountStatus: 'active',       subStatus: 'active' },
      };
      const planInfo = planMap[form.plan] || planMap.mensual;
      const periodEnd = new Date(activationDate.getTime() + planInfo.days * 24 * 60 * 60 * 1000);
      const amount = parseFloat(form.amount) || 0;

      // 1. Edge function — maneja acceso a módulos + correo al estudiante
      const { data: result, error } = await supabase.functions.invoke('admin-update-student', {
        body: {
          action: 'activate_plan',
          student_id: studentId,
          activation_date: activationDate.toISOString(),
          amount_usd: amount,
          payment_method: form.method,
          level: form.level,
          notes: form.notes || '',
          plan_slug: planInfo.slug,
          plan_name: planInfo.name,
          period_end: periodEnd.toISOString(),
        },
      });
      if (error) {
        showMsg('error', `Error al activar: ${error.message || JSON.stringify(error)}`);
        return;
      }

      // 2. Asegurar que subscriptions tiene el plan_slug correcto (fallback si edge no lo guarda)
      const isTrial = form.plan === 'trial';
      const subPayload: Record<string, unknown> = {
        plan_slug:        planInfo.slug,
        plan_name:        planInfo.name,
        status:           planInfo.subStatus,
        amount_usd:       amount,
        payment_method:   form.method,
        account_enabled:  true,
        approved_by_admin: true,
        current_period_end: periodEnd.toISOString(),
        trial_active:     isTrial,
        updated_at:       new Date().toISOString(),
      };
      if (isTrial) {
        subPayload.trial_ends_at = periodEnd.toISOString();
      }
      // Fix: usar filters:{student_id} en lugar de id: studentId
      // (subscriptions.id !== studentId — el update anterior filtraba 0 filas silenciosamente)
      try {
        await adminUpdate('subscriptions', subPayload, undefined, { student_id: studentId });
      } catch {
        try { await adminInsert('subscriptions', { student_id: studentId, ...subPayload }); } catch(e) { console.error('[activatePlan] sub insert:', e); }
      }

      // 3. Asegurar account_status correcto en student_profiles
      try {
        const profilePayload: Record<string, unknown> = {
          account_enabled: true,
          account_status:  planInfo.accountStatus,
          trial_active:    isTrial,
          updated_at:      new Date().toISOString(),
        };
        if (isTrial) {
          profilePayload.trial_start_date = activationDate.toISOString();
          profilePayload.trial_end_date   = periodEnd.toISOString();
        }
        await adminUpdate('student_profiles', profilePayload, studentId);
      } catch(e) { console.error('[activatePlan] profile update:', e); }

      // 4. Registrar en payment_history con plan + vencimiento en notes
      try {
        await adminInsert('payment_history', {
          student_id:     studentId,
          event_type:     'payment_approved',
          amount_usd:     amount,
          payment_method: form.method,
          notes:          `${planInfo.name} — Vence: ${fmtShort(periodEnd)}${form.notes ? ' · ' + form.notes : ''}`,
          created_by:     'admin',
        });
      } catch(e) { console.error('[activatePlan] history insert:', e); }

      // 5. Actualizar estado local
      const updatedSub = result?.subscription || { ...subPayload, student_id: studentId };
      setStudents(prev => prev.map(s =>
        s.id !== studentId ? s : { ...s, account_enabled: true, subscription: updatedSub as any }
      ));

      showMsg('success', `✅ ${planInfo.name} activado · Vence ${fmtLong(periodEnd)}`);
      loadStudents();
      setStudentPayHistory(prev => { const n = { ...prev }; delete n[studentId]; return n; });
      loadPaymentHistory(studentId, true);

      // Preparar formulario para el próximo cobro
      setActivationForm(prev => ({
        ...prev,
        [studentId]: {
          activationDate: periodEnd.toISOString().split('T')[0],
          amount: String(amount),
          method: form.method,
          level:  form.level === 'Ninguna' ? 'Todas' : form.level,
          notes:  '',
          plan:   form.plan,
        },
      }));
    } finally {
      setActivating(null);
    }
  };

  const approvePayment = async (studentId: string, notes?: string) => {
    try { await adminUpdate('subscriptions', { approved_by_admin: true, account_enabled: true, status: 'active', updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    try { await adminUpdate('student_profiles', { account_enabled: true, account_status: 'active', updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    const { data: subData } = await supabase.from('subscriptions').select('amount_usd, payment_method').eq('student_id', studentId).order('created_at', { ascending: false }).limit(1).single();
    try {
      await adminInsert('payment_history', {
        student_id: studentId, event_type: 'payment_approved',
        amount_usd: subData?.amount_usd || 15, payment_method: subData?.payment_method || 'paypal',
        notes: notes || 'Pago verificado y aprobado por administrador', created_by: 'admin',
      });
    } catch(e) { console.error(e); }
    await loadStudents();
    setStudentPayHistory(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    loadPaymentHistory(studentId);
  };

  const cancelSubscription = async (studentId: string) => {
    try { await adminUpdate('subscriptions', { status: 'cancelled', account_enabled: false, updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    try { await adminUpdate('student_profiles', { account_enabled: false, account_status: 'cancelled', updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    await loadStudents();
  };

  const disableAccount = async (studentId: string) => {
    try { await adminUpdate('subscriptions', { account_enabled: false, updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    try { await adminUpdate('student_profiles', { account_enabled: false, account_status: 'disabled', updated_at: new Date().toISOString() }, studentId); } catch(e) { console.error(e); }
    showMsg('success', '🔒 Cuenta deshabilitada');
    await loadStudents();
  };

  const activateTrial = async (studentId: string) => {
    setActivatingTrial(studentId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-student', {
        body: { action: 'activate_trial', student_id: studentId },
      });
      if (error || !data?.success) {
        showMsg('error', `Error: ${error?.message || data?.error || 'Error inesperado'}`);
        return;
      }
      const trialEnd = data.trial_ends_at
        ? new Date(data.trial_ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
        : '7 días';
      showMsg('success', `🎉 Prueba de 7 días activada. Vence el ${trialEnd}. Se notificó al estudiante por correo.`);
      await loadStudents();
    } finally {
      setActivatingTrial(null);
    }
  };

  const changeStatus = async (studentId: string, status: string) => {
    const { error } = await adminInvoke({ action: 'update_student', student_id: studentId, new_status: status });
    if (error) {
      try { await adminUpdate('subscriptions', { status }, studentId); } catch(e) { console.error(e); }
    }
    await loadStudents();
  };

  // Habilita o deshabilita el examen de inglés de un estudiante
  const toggleEnglishExam = async (studentId: string, enable: boolean) => {
    const { data, error } = await supabase.functions.invoke('admin-update-student', {
      body: {
        action: 'set_onboarding_step',
        student_id: studentId,
        onboarding_step: enable ? 'english_test' : 'completed',
        english_level: enable ? null : undefined,
      },
    });
    try {
      await adminUpdate('student_profiles', {
        onboarding_step: enable ? 'english_test' : 'completed',
        ...(enable ? { english_level: null } : {}),
        updated_at: new Date().toISOString(),
      }, studentId);
    } catch(e) { console.error(e); }
    showMsg('success', enable
      ? '🎓 Examen de inglés habilitado — el estudiante verá el examen en su panel'
      : '✅ Examen desactivado — el estudiante mantiene su nivel actual'
    );
    await loadStudents();
  };

  const deleteAccount = async (studentId: string) => {
    const { data, error } = await adminInvoke({ action: 'delete_account', student_id: studentId });
    if (error || !data?.success) {
      for (const [tbl, col] of [['payment_history','student_id'],['unit_progress','student_id'],['student_module_access','student_id'],['session_requests','student_id'],['subscriptions','student_id']] as [string,string][]) {
        try { await adminDeleteByFilter(tbl, { [col]: studentId }); } catch(e) { console.error(e); }
      }
      try { await adminDelete('student_profiles', studentId); } catch(e) { console.error(e); }
    }
    setExpandedId(null);
    await loadStudents();
  };

  const getTab = (id: string) => activeTab[id] || 'info';
  const setTab = (id: string, tab: 'info' | 'progreso' | 'pagos' | 'cuenta' | 'modulos') => {
    setActiveTab(prev => ({ ...prev, [id]: tab }));
    if (tab === 'progreso') loadDetailedProgress(id);
  };

  // Load courses for module access management
  const loadCoursesForAccess = useCallback(async () => {
    const { data: courses } = await supabase.from('courses').select('id, title, emoji, level').order('sort_order');
    if (!courses) return;
    const coursesWithUnits = await Promise.all(courses.map(async (c) => {
      const { data: units } = await supabase.from('units').select('id, title').eq('course_id', c.id).order('sort_order');
      return { ...c, units: units || [] };
    }));
    setCoursesForAccess(coursesWithUnits);
  }, []);

  useEffect(() => { loadCoursesForAccess(); }, [loadCoursesForAccess]);

  const loadStudentModuleAccess = useCallback(async (studentId: string) => {
    const { data } = await supabase.from('student_module_access')
      .select('course_id, unit_id, is_active')
      .eq('student_id', studentId)
      .eq('is_active', true);
    if (data) {
      const granted = data.map((d: {course_id?: string; unit_id?: string}) => d.unit_id || d.course_id || '').filter(Boolean);
      setStudentModuleAccess(prev => ({ ...prev, [studentId]: granted }));
    }
  }, []);

  const toggleModuleAccess = async (studentId: string, courseId: string, unitId: string | null, currentlyGranted: boolean) => {
    const newState = !currentlyGranted;
    const targetId = unitId || courseId;
    // Actualizar UI local inmediatamente
    setStudentModuleAccess(prev => {
      const current = prev[studentId] || [];
      const updated = newState ? [...current, targetId] : current.filter(id => id !== targetId);
      return { ...prev, [studentId]: updated };
    });
    try {
      const filters = unitId
        ? { student_id: studentId, course_id: courseId, unit_id: unitId }
        : { student_id: studentId, course_id: courseId };
      // Siempre borrar primero para evitar duplicados
      await adminDeleteByFilter('student_module_access', filters);
      if (newState) {
        const record = unitId
          ? { student_id: studentId, course_id: courseId, unit_id: unitId, is_active: true, granted_at: new Date().toISOString() }
          : { student_id: studentId, course_id: courseId, is_active: true, granted_at: new Date().toISOString() };
        await adminInsert('student_module_access', record);
      }
    } catch (e) {
      console.error('[toggleModuleAccess] error:', e);
      // Revertir UI si falló
      setStudentModuleAccess(prev => {
        const current = prev[studentId] || [];
        const reverted = !newState ? [...current, targetId] : current.filter(id => id !== targetId);
        return { ...prev, [studentId]: reverted };
      });
      showMsg('error', '❌ Error al cambiar acceso. Intenta de nuevo.');
    }
    await loadStudentModuleAccess(studentId);
  };

  const grantAllCourses = async (studentId: string) => {
    showMsg('success', '⏳ Habilitando todos los módulos...');
    try {
      const { data: allCourses } = await supabase.from('courses').select('id,level').eq('is_published', true);
      if (allCourses && allCourses.length > 0) {
        for (const c of allCourses as { id: string; level: string }[]) {
          const { data: units } = await supabase.from('units').select('id').eq('course_id', c.id);
          await adminDeleteByFilter('student_module_access', { student_id: studentId, course_id: c.id });
          const now = new Date().toISOString();
          const records = [
            { student_id: studentId, course_id: c.id, is_active: true, granted_at: now },
            ...((units || []) as { id: string }[]).map(u => ({
              student_id: studentId, course_id: c.id, unit_id: u.id, is_active: true, granted_at: now,
            })),
          ];
          await adminInsert('student_module_access', records);
        }
      }
      await loadStudentModuleAccess(studentId);
      showMsg('success', '✅ Todos los módulos habilitados');
    } catch (e) {
      console.error('[grantAllCourses] error:', e);
      showMsg('error', '❌ Error al habilitar módulos.');
    }
  };

  const revokeAllCourses = async (studentId: string) => {
    showMsg('success', '⏳ Deshabilitando todos los módulos...');
    try {
      await adminDeleteByFilter('student_module_access', { student_id: studentId });
      setStudentModuleAccess(prev => ({ ...prev, [studentId]: [] }));
      await loadStudentModuleAccess(studentId);
      showMsg('success', '🔒 Todos los módulos deshabilitados');
    } catch (e) {
      console.error('[revokeAllCourses] error:', e);
      showMsg('error', '❌ Error al deshabilitar módulos.');
    }
  };

  const toggleLevelWithUnits = async (
    studentId: string,
    course: { id: string; units?: { id: string }[] },
    currentlyActive: boolean,
  ) => {
    const units = course.units || [];
    const allIds = [course.id, ...units.map(u => u.id)];
    if (currentlyActive) {
      // Deshabilitar nivel: actualizar UI y borrar registros del curso y sus unidades
      setStudentModuleAccess(prev => ({
        ...prev,
        [studentId]: (prev[studentId] || []).filter(id => !allIds.includes(id)),
      }));
      try {
        await adminDeleteByFilter('student_module_access', { student_id: studentId, course_id: course.id });
      } catch (e) {
        console.error('[toggleLevelWithUnits] error deshabilitando:', e);
        showMsg('error', '❌ Error al deshabilitar el nivel.');
      }
    } else {
      // Habilitar nivel: actualizar UI e insertar curso + todas sus unidades
      setStudentModuleAccess(prev => ({
        ...prev,
        [studentId]: [...new Set([...(prev[studentId] || []), ...allIds])],
      }));
      try {
        const now = new Date().toISOString();
        await adminDeleteByFilter('student_module_access', { student_id: studentId, course_id: course.id });
        const records = [
          { student_id: studentId, course_id: course.id, is_active: true, granted_at: now },
          ...units.map(u => ({ student_id: studentId, course_id: course.id, unit_id: u.id, is_active: true, granted_at: now })),
        ];
        await adminInsert('student_module_access', records);
      } catch (e) {
        console.error('[toggleLevelWithUnits] error habilitando:', e);
        showMsg('error', '❌ Error al habilitar el nivel.');
      }
    }
    await loadStudentModuleAccess(studentId);
  };

  // Habilitar todas las unidades de un nivel
  const grantLevelUnits = async (studentId: string, course: { id: string; units?: { id: string }[] }) => {
    const units = course.units || [];
    const allIds = [course.id, ...units.map(u => u.id)];
    setStudentModuleAccess(prev => ({
      ...prev,
      [studentId]: [...new Set([...(prev[studentId] || []), ...allIds])],
    }));
    try {
      const now = new Date().toISOString();
      await adminDeleteByFilter('student_module_access', { student_id: studentId, course_id: course.id });
      const records = [
        { student_id: studentId, course_id: course.id, is_active: true, granted_at: now },
        ...units.map(u => ({ student_id: studentId, course_id: course.id, unit_id: u.id, is_active: true, granted_at: now })),
      ];
      await adminInsert('student_module_access', records);
    } catch (e) {
      console.error('[grantLevelUnits] error:', e);
      showMsg('error', '❌ Error al habilitar el nivel.');
    }
    await loadStudentModuleAccess(studentId);
  };

  // Deshabilitar todas las unidades de un nivel
  const revokeLevelUnits = async (studentId: string, course: { id: string; units?: { id: string }[] }) => {
    const allIds = [course.id, ...(course.units || []).map(u => u.id)];
    setStudentModuleAccess(prev => ({
      ...prev,
      [studentId]: (prev[studentId] || []).filter(id => !allIds.includes(id)),
    }));
    try {
      await adminDeleteByFilter('student_module_access', { student_id: studentId, course_id: course.id });
    } catch (e) {
      console.error('[revokeLevelUnits] error:', e);
      showMsg('error', '❌ Error al deshabilitar el nivel.');
    }
    await loadStudentModuleAccess(studentId);
  };

  const totalProgress = (s: StudentRow) => {
    const progs = s.progress || [];
    if (!progs.length) return 0;
    const total = progs.reduce((a, p) => a + (p.total_units || 0), 0);
    const done = progs.reduce((a, p) => a + (p.completed_units || 0), 0);
    return total ? Math.round((done / total) * 100) : 0;
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Gestión de Estudiantes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{students.length} estudiantes registrados</p>
          </div>
          {adminTab === 'students' && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o correo..." className="pl-10 rounded-xl"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        {/* Admin top tabs */}
        <div className="flex gap-2 mb-6">
          {([
            { id: 'students', icon: <Users className="w-4 h-4" />, label: 'Estudiantes' },
            { id: 'sessions', icon: <Video className="w-4 h-4" />, label: `Sesiones (${sessionRequests.length})` },
          ] as { id: 'students' | 'sessions'; icon: React.ReactNode; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setAdminTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                adminTab === t.id ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {adminTab === 'students' && (<>
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: <Users className="w-5 h-5 text-primary" />, value: students.length, label: 'Total', bg: 'bg-primary/5 border-primary/10' },
            { icon: <TrendingUp className="w-5 h-5 text-green-600" />, value: students.filter(s => s.subscription?.status === 'active' && s.subscription?.plan_slug !== 'free_admin').length, label: 'Activos', bg: 'bg-green-50 border-green-100' },
            { icon: <Calendar className="w-5 h-5 text-blue-600" />, value: students.filter(s => s.subscription?.status === 'trial').length, label: 'En prueba', bg: 'bg-blue-50 border-blue-100' },
            { icon: <Clock className="w-5 h-5 text-red-500" />, value: students.filter(s => s.subscription?.approved_by_admin === false && s.subscription?.account_enabled === false && s.subscription?.status !== 'cancelled').length, label: 'Pendientes', bg: 'bg-red-50 border-red-100' },
            { icon: <Gift className="w-5 h-5 text-violet-600" />, value: students.filter(s => s.subscription?.plan_slug === 'free_admin' && s.subscription?.status === 'active').length, label: 'Gratuitos', bg: 'bg-violet-50 border-violet-100' },
            { icon: <CreditCard className="w-5 h-5 text-amber-600" />, value: `$${students.filter(s => s.subscription?.plan_slug !== 'free_admin').reduce((a, s) => a + (s.subscription?.amount_usd || 0), 0).toFixed(0)} USD`, label: 'Ingresos', bg: 'bg-amber-50 border-amber-100' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border rounded-2xl p-4`}>
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-xl font-extrabold text-center">{s.value}</p>
              <p className="text-xs text-muted-foreground text-center">{s.label}</p>
            </div>
          ))}
        </div>


        {/* Students list */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando estudiantes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{search ? 'Sin resultados para esta búsqueda.' : 'Aún no hay estudiantes registrados.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((student) => {
              const sub = student.subscription;
              const statusStyle = STATUS_LABELS[sub?.status || ''] || { label: 'Sin plan', color: 'bg-gray-100 text-gray-500' };
              const isExpanded = expandedId === student.id;
              const isEditing = editingId === student.id;
              const tab = getTab(student.id);
              const pct = totalProgress(student);
              const isEnabled = student.account_enabled !== false;

              return (
                <motion.div key={student.id} layout className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                  {/* Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg shrink-0">
                        {student.full_name ? student.full_name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{student.full_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {student.email || 'Correo no disponible'}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${statusStyle.color}`}>{statusStyle.label}</span>
                      {/* account_enabled badge */}
                      <span className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                        isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isEnabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {isEnabled ? 'Habilitado' : 'Deshabilitado'}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Award className="w-3.5 h-3.5" />{student.current_level || 'A1'}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />{pct}% completado
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {sub && (sub.payment_method === 'pse' || sub.payment_method === 'paypal') && sub.approved_by_admin === false && (
                        <button title="Aprobar pago" onClick={() => setConfirmAction({ open: true, title: '¿Aprobar pago?', msg: `Activará la cuenta de ${student.full_name}.`, fn: async () => approvePayment(student.id) })}
                          className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full hover:bg-amber-200 transition-colors">
                          <AlertCircle className="w-3 h-3" /> Aprobar
                        </button>
                      )}
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 gap-1.5" onClick={() => startEdit(student)}>
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </Button>
                      {student.email && (
                        <Button size="sm" variant="outline"
                          className={`rounded-xl text-xs h-8 gap-1.5 ${ resetSent === student.id ? 'border-green-400 text-green-600' : 'border-amber-300 text-amber-600 hover:bg-amber-50'}`}
                          onClick={() => sendPasswordReset(student.email!, student.id)}
                          disabled={resetting === student.id || resetSent === student.id}
                          title="Enviar enlace de cambio de contraseña">
                          {resetSent === student.id ? <><Check className="w-3.5 h-3.5" /> Enviado</> : resetting === student.id ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando...</> : <><KeyRound className="w-3.5 h-3.5" /> Reset pwd</>}
                        </Button>
                      )}
                      <button title={student.account_enabled !== false ? 'Deshabilitar cuenta' : 'Habilitar cuenta'}
                        onClick={() => setConfirmAction({ open: true, title: student.account_enabled !== false ? '¿Deshabilitar?' : '¿Habilitar?', msg: student.account_enabled !== false ? `Bloqueará a ${student.full_name}.` : `Restaurará a ${student.full_name}.`, fn: async () => toggleAccountEnabled(student.id, student.account_enabled === false) })}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        {student.account_enabled !== false ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
                      </button>
                      <button title="Eliminar cuenta"
                        onClick={() => setConfirmAction({ open: true, title: '¿Eliminar cuenta?', msg: `Eliminará permanentemente a ${student.full_name}. Acción irreversible.`, fn: async () => deleteAccount(student.id) })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { const next = isExpanded ? null : student.id; setExpandedId(next); if (next) loadPaymentHistory(next); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Edit OR Details */}
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/30">
                      {isEditing ? (
                        /* ── EDIT FORM ── */
                        <div className="p-5 bg-muted/20 space-y-5">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
                              <Edit2 className="w-4 h-4" /> Editar información del estudiante
                            </h3>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Section: Datos de acceso */}
                          <div className="space-y-3">
                            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Correo electrónico (actualiza login)</p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  type="email"
                                  value={editForm.email}
                                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                  placeholder="correo@ejemplo.com"
                                  className="rounded-xl text-sm flex-1"
                                />
                                <Button size="sm" onClick={() => saveEmail(student.id)} disabled={savingEmail}
                                  className="rounded-xl text-xs gap-1 shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-0">
                                  {savingEmail ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : <Check className="w-3.5 h-3.5" />}
                                  Guardar correo
                                </Button>
                              </div>
                              {emailSaveMsg && <p className="text-xs font-semibold">{emailSaveMsg}</p>}
                            </div>
                          </div>

                          {/* Section: Datos personales */}
                          <div className="space-y-3">
                            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Datos personales</p>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Nombre completo</Label>
                                <Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Nombre completo" className="rounded-xl text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha de nacimiento</Label>
                                <Input type="date" value={editForm.birthday} onChange={e => setEditForm(p => ({ ...p, birthday: e.target.value }))} className="rounded-xl text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">País</Label>
                                <Input value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} placeholder="Colombia" className="rounded-xl text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Ciudad</Label>
                                <Input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} placeholder="Bogotá" className="rounded-xl text-sm" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1"><Award className="w-3 h-3" /> Nivel inglés</Label>
                                <select value={editForm.english_level} onChange={e => setEditForm(p => ({ ...p, english_level: e.target.value }))}
                                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none">
                                  <option value="">— Sin asignar —</option>
                                  {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-border/30">
                            <Button size="sm" onClick={saveEdit} disabled={saving} className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground">
                              <Check className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="rounded-xl text-xs gap-1.5">
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── DETAIL TABS ── */
                        <div className="p-5">
                          {/* Tab bar */}
                          <div className="flex flex-wrap gap-2 mb-5 border-b border-border/30 pb-3">
                            {([
                              { id: 'info',    label: '👤 Información' },
                              { id: 'progreso',label: '📊 Progreso' },
                              { id: 'cuenta',  label: '⚙️ Cuenta' },
                            ] as { id: 'info'|'progreso'|'cuenta'; label: string }[]).map(t => (
                              <button key={t.id} onClick={() => {
                                setTab(student.id, t.id as 'info'|'progreso'|'pagos'|'cuenta'|'modulos');
                                if (t.id === 'cuenta') { loadStudentModuleAccess(student.id); loadPaymentHistory(student.id); }
                              }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  tab === t.id
                                    ? t.id === 'cuenta'
                                      ? 'bg-violet-600 text-white shadow border-violet-600'
                                      : 'bg-primary text-primary-foreground shadow border-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border/50'
                                }`}>
                                {t.label}
                              </button>
                            ))}
                          </div>

                          {/* TAB: INFO */}
                          {tab === 'info' && (
                            <div className="space-y-4">
                              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                                {[
                                  { icon: <Mail className="w-4 h-4 text-primary" />, label: 'Correo', value: student.email || 'N/A' },
                                  { icon: <Award className="w-4 h-4 text-primary" />, label: 'Nivel inglés', value: student.english_level || student.current_level || '—' },
                                  { icon: <Calendar className="w-4 h-4 text-primary" />, label: 'Registrado', value: new Date(student.created_at).toLocaleDateString('es-CO') },
                                  { icon: <CreditCard className="w-4 h-4 text-primary" />, label: 'Plan', value: sub?.plan_name || 'Sin plan' },
                                  { icon: <TrendingUp className="w-4 h-4 text-primary" />, label: 'Estado', value: statusStyle.label },
                                ].map((item, i) => (
                                  <div key={i} className="bg-muted/30 rounded-xl p-3 border border-border/30">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                      {item.icon} {item.label}
                                    </div>
                                    <p className="font-semibold text-sm truncate">{item.value}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Extended personal info */}
                              <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
                                <p className="text-xs font-bold text-blue-700 mb-3">📋 Información Personal Extendida</p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                                    <p className="font-semibold">
                                      {student.birthday
                                        ? `${new Date(student.birthday).toLocaleDateString('es-CO')} (${calcAge(student.birthday)} años)`
                                        : '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Nivel educativo</p>
                                    <p className="font-semibold">
                                      {student.education_level
                                        ? (EDUCATION_LABELS[student.education_level] || student.education_level)
                                        : '—'}
                                      {student.education_level === 'other' && student.education_other && ` (${student.education_other})`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">País / Ciudad</p>
                                    <p className="font-semibold">
                                      {[student.country, student.city].filter(Boolean).join(', ') || '—'}
                                    </p>
                                  </div>
                                  {student.bio && (
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <p className="text-xs text-muted-foreground">Bio</p>
                                      <p className="text-sm">{student.bio}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Statistics */}
                              <div className="bg-purple-50/50 border border-purple-200/50 rounded-xl p-4">
                                <p className="text-xs font-bold text-purple-700 mb-3">📊 Estadísticas del estudiante</p>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="text-center">
                                    <p className="text-2xl font-black text-purple-600">{student.unit_completions_count || 0}</p>
                                    <p className="text-xs text-muted-foreground">Unidades completadas</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-black text-blue-600">{pct}%</p>
                                    <p className="text-xs text-muted-foreground">Progreso total</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-600">{student.english_level || '—'}</p>
                                    <p className="text-xs text-muted-foreground">Nivel asignado</p>
                                  </div>
                                </div>
                                {student.is_admin_only && (
                                  <div className="mt-2 text-center">
                                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">👑 Cuenta de administrador</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* TAB: PROGRESS */}
                          {tab === 'progreso' && (
                            <div>
                              {loadingProgress === student.id ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                  Cargando progreso...
                                </div>
                              ) : !detailedProgress[student.id]?.length ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                  Este estudiante aún no ha registrado progreso.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {detailedProgress[student.id].map((p, i) => {
                                    const prog = p.totalUnits ? Math.round((p.completedUnits / p.totalUnits) * 100) : 0;
                                    const levelColors: Record<string, string> = {
                                      A1: 'bg-green-100 text-green-700 border-green-200',
                                      A2: 'bg-teal-100 text-teal-700 border-teal-200',
                                      B1: 'bg-blue-100 text-blue-700 border-blue-200',
                                      B2: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                                      C1: 'bg-purple-100 text-purple-700 border-purple-200',
                                    };
                                    const color = levelColors[p.level] || 'bg-gray-100 text-gray-700 border-gray-200';
                                    return (
                                      <div key={i} className="bg-muted/20 rounded-xl p-4 border border-border/30">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{p.level}</span>
                                            <p className="font-semibold text-sm">{p.title}</p>
                                          </div>
                                          <span className="text-xs font-bold text-primary">{prog}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 bg-muted rounded-full h-2">
                                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${prog}%` }} />
                                          </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">{p.completedUnits} de {p.totalUnits} unidades completadas</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB: CUENTA — con draft de cambios + botón Guardar */}
                          {tab === 'cuenta' && (() => {
                            const af = getActivationForm(student.id);
                            const activationDateObj = af.activationDate ? new Date(af.activationDate + 'T12:00:00') : new Date();
                            const periodDays = af.plan === 'trial' ? 7 : af.plan === 'trimestral' ? 90 : 30;
                            const periodEnd = new Date(activationDateObj.getTime() + periodDays * 24 * 60 * 60 * 1000);
                            const fmtD = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
                            const sub = student.subscription;
                            const hist = studentPayHistory[student.id] || [];
                            const examActive = student.onboarding_step === 'english_test';
                            return (
                            <div className="space-y-5">

                              {/* ════ BLOQUE 1: INFORMACIÓN BÁSICA ════ */}
                              <div className="rounded-2xl border border-border/50 overflow-hidden">
                                <div className="bg-muted/30 px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
                                  <span className="text-sm">👤</span>
                                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Información básica</p>
                                </div>
                                <div className="p-4 space-y-4">

                                  {/* Nivel de inglés — se guarda inmediatamente */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-sm">Nivel de inglés asignado</p>
                                      <p className="text-xs text-muted-foreground">Se refleja de inmediato en el perfil del estudiante.</p>
                                    </div>
                                    <select
                                      value={student.english_level || 'A1'}
                                      onChange={async (e) => {
                                        const lvl = e.target.value;
                                        try {
                                          await adminUpdate('student_profiles', { english_level: lvl, updated_at: new Date().toISOString() }, student.id);
                                          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, english_level: lvl } : s));
                                          showMsg('success', `✅ Nivel actualizado a ${lvl}`);
                                        } catch { showMsg('error', '❌ Error al actualizar nivel'); }
                                      }}
                                      className="h-9 rounded-xl border border-input bg-background px-3 text-sm font-bold min-w-[80px]"
                                    >
                                      {['A1','A2','B1','B2','C1'].map(lvl => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Examen de inglés — se guarda inmediatamente */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-sm">Examen de inglés</p>
                                      <p className="text-xs text-muted-foreground">Al activarlo, el estudiante ve la pantalla del examen al entrar y se le asigna nivel automáticamente.</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleEnglishExam(student.id, !examActive)}
                                      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${examActive ? 'bg-sky-500' : 'bg-muted-foreground/30'}`}
                                    >
                                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${examActive ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                  </div>

                                </div>
                              </div>

                              {/* ════ BLOQUE 2: ACTIVAR PLAN ════ */}
                              <div className="rounded-2xl border-2 border-primary/30 overflow-hidden">
                                <div className="px-4 py-3 bg-primary flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-white" />
                                  <p className="font-bold text-white text-sm">Activar plan</p>
                                  {sub && sub.status === 'active' && sub.approved_by_admin && (
                                    <span className="ml-auto text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">🔄 Renovación</span>
                                  )}
                                </div>
                                <div className="p-5 space-y-4">

                                  {/* Selector de plan */}
                                  <div>
                                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">📋 Plan</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {([
                                        { id: 'trial',      label: '🎁 7 días gratis',   amt: 0  },
                                        { id: 'mensual',    label: '📅 Plan Mensual',     amt: 15 },
                                        { id: 'trimestral', label: '🗓️ Plan Trimestral',  amt: 68 },
                                      ] as const).map(p => (
                                        <button
                                          key={p.id}
                                          type="button"
                                          onClick={() => {
                                            setActivationField(student.id, 'plan', p.id);
                                            setActivationField(student.id, 'amount', String(p.amt));
                                          }}
                                          className={`py-2.5 px-2 rounded-xl text-xs font-bold border-2 transition-all text-center leading-tight ${
                                            af.plan === p.id
                                              ? 'bg-primary text-white border-primary shadow-sm'
                                              : 'bg-background border-border/50 text-muted-foreground hover:border-primary/50'
                                          }`}
                                        >
                                          {p.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Fechas */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">📅 Fecha de activación</Label>
                                      <Input
                                        type="date"
                                        value={af.activationDate}
                                        onChange={e => setActivationField(student.id, 'activationDate', e.target.value)}
                                        className="rounded-xl text-sm h-9"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                                        📆 Vence el (+{periodDays} días)
                                      </Label>
                                      <div className="h-9 rounded-xl border border-border/50 bg-muted/40 flex items-center px-3 text-sm font-semibold text-primary">
                                        {fmtD(periodEnd)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Monto + método (oculto para prueba gratuita) */}
                                  {af.plan !== 'trial' && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">💰 Monto cobrado (USD)</Label>
                                        <Input
                                          type="number"
                                          value={af.amount}
                                          onChange={e => setActivationField(student.id, 'amount', e.target.value)}
                                          className="rounded-xl text-sm h-9"
                                          min="0" step="0.01"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">💳 Método de pago</Label>
                                        <select
                                          value={af.method}
                                          onChange={e => setActivationField(student.id, 'method', e.target.value)}
                                          className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm"
                                        >
                                          <option value="paypal">PayPal (USD)</option>
                                          <option value="bold_pse">Bold / PSE (COP)</option>
                                          <option value="transferencia">Transferencia</option>
                                          <option value="efectivo">Efectivo</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Unidades a habilitar */}
                                  <div>
                                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">📚 Unidades a habilitar</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {LEVEL_OPTIONS.map(lvl => (
                                        <button
                                          key={lvl}
                                          type="button"
                                          onClick={() => setActivationField(student.id, 'level', lvl)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                                            af.level === lvl
                                              ? lvl === 'Ninguna' ? 'bg-orange-500 text-white border-orange-500' : 'bg-primary text-white border-primary'
                                              : lvl === 'Ninguna' ? 'bg-background border-orange-300 text-orange-600 hover:border-orange-500' : 'bg-background border-border/50 text-muted-foreground hover:border-primary/50'
                                          }`}
                                        >
                                          {lvl === 'Todas' ? '🌟 Todas' : lvl === 'Ninguna' ? '🧪 Ninguna (Examen)' : `📖 ${lvl}`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Notas opcionales */}
                                  <div>
                                    <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">📝 Notas (opcional)</Label>
                                    <Input
                                      placeholder="Ej: Comprobante verificado vía email..."
                                      value={af.notes}
                                      onChange={e => setActivationField(student.id, 'notes', e.target.value)}
                                      className="rounded-xl text-sm h-9"
                                    />
                                  </div>

                                  {/* Botón Activar plan */}
                                  <Button
                                    className="w-full rounded-xl font-bold text-white gap-2 h-11 text-sm bg-green-600 hover:bg-green-700"
                                    disabled={activating === student.id}
                                    onClick={() => setConfirmAction({
                                      open: true,
                                      title: `✅ ¿Activar plan para ${student.full_name}?`,
                                      msg: `${af.plan === 'trial' ? '7 días gratis' : af.plan === 'mensual' ? 'Plan Mensual' : 'Plan Trimestral'} · ${fmtD(activationDateObj)} → ${fmtD(periodEnd)} · Acceso: ${af.level === 'Todas' ? 'todos los niveles' : af.level === 'Ninguna' ? 'ninguno (examen)' : 'nivel ' + af.level}${af.plan !== 'trial' ? ' · $' + af.amount + ' USD' : ''}`,
                                      fn: async () => activatePlanManual(student.id),
                                    })}
                                  >
                                    {activating === student.id
                                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Activando...</>
                                      : <><ShieldCheck className="w-4 h-4" /> Activar plan</>
                                    }
                                  </Button>

                                </div>
                              </div>

                              {/* ════ BLOQUE 3: HISTORIAL DE PAGOS ════ */}
                              {(() => {
                                const invoiceItems = hist.filter(i => i.amount_usd > 0).length > 0
                                  ? hist
                                  : sub && sub.amount_usd > 0
                                    ? [{ id: sub.created_at || 'sub-1', event_type: 'payment_approved', amount_usd: sub.amount_usd, payment_method: sub.payment_method || 'paypal', notes: sub.plan_name || 'Plan Mensual', created_at: sub.created_at || new Date().toISOString() }]
                                    : [];
                                const canInvoice = invoiceItems.length > 0;

                                // Helper: extraer info del campo notes
                                const parsePlan = (notes?: string) => {
                                  if (!notes) return { plan: '—', vence: '—' };
                                  const planMatch = notes.match(/Plan\s+\w+|7 días gratis/i);
                                  const venceMatch = notes.match(/Vence:\s*(.+?)(?:\s*·|$)/i);
                                  return {
                                    plan:  planMatch ? planMatch[0] : (notes.length < 40 ? notes : 'Pago'),
                                    vence: venceMatch ? venceMatch[1].trim() : '—',
                                  };
                                };

                                return (
                                  <div className="rounded-2xl border border-border/50 overflow-hidden">
                                    <div className="bg-muted/30 px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
                                      <History className="w-4 h-4 text-primary" />
                                      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex-1">Historial de pagos</p>
                                      {canInvoice && (
                                        <button
                                          onClick={() => setInvoiceModal({ student, items: invoiceItems })}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-700 transition"
                                        >
                                          <FileText className="w-3 h-3" /> Generar Factura
                                        </button>
                                      )}
                                    </div>
                                    {hist.length === 0 ? (
                                      <p className="text-sm text-muted-foreground text-center py-6">Sin historial disponible</p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-muted/20 text-muted-foreground">
                                              <th className="text-left px-3 py-2 font-semibold">Fecha</th>
                                              <th className="text-left px-3 py-2 font-semibold">Plan</th>
                                              <th className="text-right px-3 py-2 font-semibold">Monto</th>
                                              <th className="text-left px-3 py-2 font-semibold">Método</th>
                                              <th className="text-left px-3 py-2 font-semibold">Vencimiento</th>
                                              <th className="text-left px-3 py-2 font-semibold">Estado</th>
                                              <th className="px-2 py-2" />
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border/20">
                                            {hist.map(item => {
                                              const parsed = parsePlan(item.notes);
                                              const isActive = sub && sub.approved_by_admin && new Date(sub.current_period_end || 0) > new Date() && item.created_at === hist[0]?.created_at;
                                              return (
                                                <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                  </td>
                                                  <td className="px-3 py-2.5 font-semibold">{parsed.plan}</td>
                                                  <td className="px-3 py-2.5 text-right font-bold text-green-700">
                                                    {item.amount_usd > 0 ? `$${item.amount_usd}` : <span className="text-muted-foreground font-normal">Gratis</span>}
                                                  </td>
                                                  <td className="px-3 py-2.5 text-muted-foreground uppercase">
                                                    {item.payment_method && item.payment_method !== 'none' ? item.payment_method : '—'}
                                                  </td>
                                                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{parsed.vence}</td>
                                                  <td className="px-3 py-2.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                      isActive ? 'bg-green-100 text-green-700' :
                                                      item.event_type === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                      'bg-muted text-muted-foreground'
                                                    }`}>
                                                      {isActive ? 'Activo' : item.event_type === 'cancelled' ? 'Cancelado' : 'Registrado'}
                                                    </span>
                                                  </td>
                                                  <td className="px-2 py-2.5">
                                                    {item.amount_usd > 0 && (
                                                      <button
                                                        title="Ver factura"
                                                        onClick={() => setInvoiceModal({ student, items: [item] })}
                                                        className="p-1 rounded-md hover:bg-violet-100 text-violet-500 hover:text-violet-700 transition"
                                                      >
                                                        <FileText className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* ════ BLOQUE 4: ACCIONES ════ */}
                              <div className="rounded-2xl border border-border/50 overflow-hidden">
                                <div className="bg-muted/30 px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
                                  <Target className="w-4 h-4 text-muted-foreground" />
                                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Acciones</p>
                                </div>
                                <div className="p-4 space-y-3">

                                  {/* Deshabilitar cuenta */}
                                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-amber-900">Deshabilitar cuenta</p>
                                      <p className="text-xs text-amber-700 mt-0.5">Desactiva el acceso sin borrar datos ni progreso. Se puede reactivar después con "Activar plan".</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl text-xs shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 gap-1"
                                      onClick={() => setConfirmAction({
                                        open: true,
                                        title: '🔒 ¿Deshabilitar cuenta?',
                                        msg: `Se desactivará el acceso de ${student.full_name}. Sus datos y progreso se conservan.`,
                                        fn: () => disableAccount(student.id),
                                      })}
                                    >
                                      <Lock className="w-3 h-3" /> Deshabilitar
                                    </Button>
                                  </div>

                                  {/* Eliminar cuenta */}
                                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                                    <Trash2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-red-900">Eliminar cuenta permanentemente</p>
                                      <p className="text-xs text-red-700 mt-0.5">Borra perfil, suscripción, progreso e historial. <strong>Esta acción no se puede deshacer.</strong></p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl text-xs shrink-0 border-red-500 text-red-700 hover:bg-red-100 gap-1"
                                      onClick={() => setConfirmAction({
                                        open: true,
                                        title: '🗑️ ¿Eliminar cuenta?',
                                        msg: `IRREVERSIBLE. Se eliminarán todos los datos de ${student.full_name} incluyendo historial y suscripción.`,
                                        fn: async () => deleteAccount(student.id),
                                      })}
                                    >
                                      <Trash2 className="w-3 h-3" /> Eliminar
                                    </Button>
                                  </div>

                                </div>
                              </div>

                              {/* ════ ACCESO A CURSOS (expandible) ════ */}
                              {/* ════ 2. HABILITAR ACCESO AL CURSO ════ */}
                              <div className="border border-green-200 rounded-2xl overflow-hidden bg-green-50/40">

                                {/* ── Header ── */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-green-200 bg-green-50">
                                  <div className="flex items-center gap-2">
                                    <Unlock className="w-4 h-4 text-green-700" />
                                    <p className="font-bold text-sm text-green-900">Habilitar acceso al curso</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3"
                                      onClick={() => grantAllCourses(student.id)}
                                    >
                                      ✅ Habilitar todos
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white h-7 px-3"
                                      onClick={() => setConfirmAction({
                                        open: true,
                                        title: '🔒 ¿Deshabilitar todos los módulos?',
                                        msg: `Se quitará el acceso a todos los cursos y unidades de ${student.full_name}.`,
                                        fn: () => revokeAllCourses(student.id),
                                      })}
                                    >
                                      🔒 Deshabilitar todos
                                    </Button>
                                  </div>
                                </div>

                                {/* ── Cards de nivel ── */}
                                <div className="p-4 space-y-2">
                                  {coursesForAccess.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">No hay cursos disponibles</p>
                                  ) : coursesForAccess.map(course => {
                                    const granted     = studentModuleAccess[student.id] || [];
                                    const courseActive = granted.includes(course.id) || (course.units || []).some(u => granted.includes(u.id));
                                    const units        = course.units || [];
                                    const allActive    = units.length > 0 && units.every(u => granted.includes(u.id));
                                    const isOpen       = expandedAccessLevel[student.id] === course.id;

                                    return (
                                      <div key={course.id} className="rounded-xl border border-border/60 overflow-hidden bg-white shadow-sm">

                                        {/* Card header — click para expandir */}
                                        <button
                                          type="button"
                                          onClick={() => setExpandedAccessLevel(prev => ({
                                            ...prev,
                                            [student.id]: isOpen ? null : course.id,
                                          }))}
                                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50/60 transition-colors text-left"
                                        >
                                          {/* Emoji + info */}
                                          <span className="text-2xl shrink-0">{course.emoji || '📖'}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-extrabold text-sm leading-tight">{course.level || course.title}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{course.title} · {units.length} unidades</p>
                                          </div>

                                          {/* Badge de estado */}
                                          <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                                            courseActive
                                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                              : 'bg-gray-100 text-gray-500 border-gray-200'
                                          }`}>
                                            {courseActive ? '✅ Activo' : '🔒 Inactivo'}
                                          </span>

                                          {/* Chevron */}
                                          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Contenido expandido */}
                                        {isOpen && (
                                          <div className="border-t border-border/40 bg-gray-50/60 p-3 space-y-3">

                                            {/* Botones de nivel */}
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl text-xs h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
                                                onClick={() => grantLevelUnits(student.id, course)}
                                              >
                                                ✅ Habilitar todas
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl text-xs h-7 border-rose-300 text-rose-600 hover:bg-rose-50 font-bold"
                                                onClick={() => revokeLevelUnits(student.id, course)}
                                              >
                                                🔒 Deshabilitar todas
                                              </Button>
                                            </div>

                                            {/* Unidades */}
                                            {units.length === 0 ? (
                                              <p className="text-xs text-muted-foreground py-2 text-center">Sin unidades</p>
                                            ) : (
                                              <div className="space-y-1">
                                                {units.map(unit => {
                                                  const unitActive = granted.includes(unit.id);
                                                  return (
                                                    <div key={unit.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-border/30 hover:border-border/60 transition-colors">
                                                      <p className="text-xs text-foreground/80 flex-1 min-w-0 truncate pr-3">{unit.title}</p>
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleModuleAccess(student.id, course.id, unit.id, unitActive)}
                                                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                                          unitActive
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-primary/10 hover:text-primary border border-gray-200'
                                                        }`}
                                                      >
                                                        {unitActive
                                                          ? <><ToggleRight className="w-3.5 h-3.5" /> Activa</>
                                                          : <><ToggleLeft className="w-3.5 h-3.5" /> Inactiva</>
                                                        }
                                                      </button>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>


                            </div>
                            );
                          })()}


                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        </>)}

        {/* ── INVOICE MODAL ── */}
        {invoiceModal && (
          <InvoiceModal
            student={invoiceModal.student}
            items={invoiceModal.items}
            onClose={() => setInvoiceModal(null)}
          />
        )}

        {/* ── TOAST MENSAJE ── */}
        {actionMsg && (
          <div className={`fixed top-6 right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 transition-all ${
            actionMsg.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {actionMsg.type === 'success' ? '✅' : '❌'} {actionMsg.text}
          </div>
        )}

        {/* ── CONFIRM DIALOG ── */}
        {confirmAction.open && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(c => ({ ...c, open: false }))}>
            <div className="bg-background rounded-2xl border border-border shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <p className="font-bold text-base mb-2">{confirmAction.title}</p>
              <p className="text-sm text-muted-foreground mb-5">{confirmAction.msg}</p>
              <div className="flex gap-3">
                <Button className="flex-1 rounded-xl" onClick={async () => { await confirmAction.fn(); setConfirmAction(c => ({ ...c, open: false })); }}>Confirmar</Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmAction(c => ({ ...c, open: false }))}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── SESSION REQUESTS TAB ── */}
        {adminTab === 'sessions' && (
          <div className="space-y-4">
            {sessionRequests.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aún no hay solicitudes de sesión.</p>
              </div>
            ) : (
              sessionRequests.map(req => (
                <motion.div key={req.id} layout className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-base shrink-0">
                        {req.student_name ? req.student_name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{req.student_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {req.student_email || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {req.weekly_plan && (
                        <span className="flex items-center gap-1 bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Plan semanal
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">{req.sessions?.length || 0} sesión(es)</span>
                    </div>
                    <button onClick={() => setSessionReqExpanded(sessionReqExpanded === req.id ? null : req.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                      {sessionReqExpanded === req.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>

                  {sessionReqExpanded === req.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/30 p-5 space-y-4">
                      {/* Sessions list */}
                      {req.sessions && req.sessions.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">📅 Fechas solicitadas</p>
                          <div className="space-y-2">
                            {req.sessions.map((s, i) => (
                              <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border border-border/30 text-sm">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                  <p className="font-semibold">{s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha por definir'}</p>
                                  {s.topic && <p className="text-xs text-muted-foreground">{s.topic}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Objective */}
                      {req.objective && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Objetivo</p>
                          <p className="text-sm bg-muted/30 rounded-xl p-3 border border-border/30">{req.objective}</p>
                        </div>
                      )}
                      {/* Weekly plan */}
                      {req.weekly_plan && (
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-bold text-violet-700 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Plan semanal personalizado</p>
                          {req.weekly_hours && (
                            <div>
                              <p className="text-xs text-violet-600 font-medium">Horas semanales deseadas:</p>
                              <p className="text-sm">{req.weekly_hours}</p>
                            </div>
                          )}
                          {req.weekly_schedule && (
                            <div>
                              <p className="text-xs text-violet-600 font-medium">Disponibilidad horaria:</p>
                              <p className="text-sm whitespace-pre-line">{req.weekly_schedule}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}