'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Edit2,
  Phone,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';

export default function MembersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [purgeConfirmModal, setPurgeConfirmModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMobilePay, setFormMobilePay] = useState('');
  const [formRole, setFormRole] = useState('member');

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      setMembers(data.members || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_member',
          fullName: formName,
          email: formEmail,
          phone: formPhone,
          mobilepayNumber: formMobilePay,
          role: formRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddModal(false);
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormMobilePay('');
        setNotificationMsg(`Member ${formName} added successfully.`);
        fetchMembers();
      } else {
        alert(data.error || 'Failed to add member');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    setFormLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_member',
          memberId: editModal.id,
          fullName: editModal.full_name,
          phone: editModal.phone,
          mobilepayNumber: editModal.mobilepay_number,
          role: editModal.role,
          status: editModal.status,
        }),
      });
      if (res.ok) {
        setEditModal(null);
        setNotificationMsg('Member updated successfully.');
        fetchMembers();
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handlePurgeDemoData = async () => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_demo_data' }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurgeConfirmModal(false);
        setNotificationMsg(data.message);
        fetchMembers();
      }
    } finally {
      setFormLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t.members.title}
          </h1>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t.members.subtitle}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {user?.email === 'umer.web2@gmail.com' && (
              <button
                onClick={() => setPurgeConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors active:scale-95 shadow-xs font-sans"
                title="Remove placeholder demo records before real production use"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.members.removeDemoData}</span>
              </button>
            )}
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95 font-sans"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.members.addMember}</span>
            </button>
          </div>
        )}
      </div>

      {notificationMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-1">
            &times;
          </button>
        </div>
      )}

      {/* KPI Counters */}
      <div className={`grid ${user?.email === 'umer.web2@gmail.com' ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 sm:gap-4`}>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate font-sans">
            {t.members.totalMembers}
          </span>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {summary?.total_members || members.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate font-sans">
            {t.members.activeCount}
          </span>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-800 mt-1">
            {summary?.active_count || members.filter((m) => m.status === 'active').length}
          </div>
        </div>
        {user?.email === 'umer.web2@gmail.com' && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate font-sans">
              {t.members.demoCount}
            </span>
            <div className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-500 mt-1">
              {summary?.demo_count || members.filter((m) => m.is_demo).length}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 text-base sm:text-xs"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="collector">Collectors</option>
            <option value="member">Members</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 text-base sm:text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t.members.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </form>
      </div>

      {/* MOBILE CARD FEED (< md screens) */}
      <div className="md:hidden space-y-2.5">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                  <span>{m.full_name}</span>
                  {m.is_demo && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      demo
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">{m.email}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    m.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : m.role === 'collector'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.role}
                </span>
                <Badge
                  status={m.status}
                  label={t.members.statuses[m.status as keyof typeof t.members.statuses] || m.status}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-mono">
                {m.mobilepay_number || m.phone ? (
                  <a
                    href={`tel:${m.mobilepay_number || m.phone}`}
                    className="flex items-center gap-1 text-emerald-800 font-semibold hover:underline"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{m.mobilepay_number || m.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400">No MobilePay</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500">
                  Paid: <strong className="font-mono text-slate-800">{m.confirmed_payments_count || 0} mo</strong>
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setEditModal(m)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    title="Edit member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            No members found.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= md screens) */}
      <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">{t.members.name}</th>
                <th className="py-3 px-4">{t.members.email}</th>
                <th className="py-3 px-4">{t.members.phone} / MobilePay</th>
                <th className="py-3 px-4">{t.members.role}</th>
                <th className="py-3 px-4">{t.members.status}</th>
                <th className="py-3 px-4">Paid Months</th>
                {isAdmin && <th className="py-3 px-4 text-right">{t.members.actions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{m.full_name}</span>
                    {m.is_demo && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                        demo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{m.email}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {m.mobilepay_number || m.phone || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : m.role === 'collector'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.members.roles[m.role as keyof typeof t.members.roles] || m.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      status={m.status}
                      label={t.members.statuses[m.status as keyof typeof t.members.statuses] || m.status}
                    />
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">
                    {m.confirmed_payments_count || 0}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditModal(m)}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        title="Edit member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Member Manually (Mobile Bottom Sheet / Center Dialog) */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 pb-safe">
            <h3 className="text-base font-bold text-slate-900">{t.members.addMember}</h3>
            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.name} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mads Mikkelsen"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.email} *</label>
                <input
                  type="email"
                  required
                  placeholder="mads@example.dk"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.phone} / MobilePay</label>
                <input
                  type="text"
                  placeholder="+45 12 34 56 78"
                  value={formMobilePay}
                  onChange={(e) => {
                    setFormMobilePay(e.target.value);
                    setFormPhone(e.target.value);
                  }}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.role}</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="member">Member</option>
                  <option value="collector">Collector</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {formLoading ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Member */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 pb-safe">
            <h3 className="text-base font-bold text-slate-900">{t.members.edit}</h3>
            <form onSubmit={handleEditMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.name}</label>
                <input
                  type="text"
                  required
                  value={editModal.full_name}
                  onChange={(e) => setEditModal({ ...editModal, full_name: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">MobilePay Number</label>
                <input
                  type="text"
                  value={editModal.mobilepay_number || ''}
                  onChange={(e) => setEditModal({ ...editModal, mobilepay_number: e.target.value })}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.members.role}</label>
                  <select
                    value={editModal.role}
                    onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                    className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="collector">Collector</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.members.status}</label>
                  <select
                    value={editModal.status}
                    onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                    className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {formLoading ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Purge Demo Data */}
      {purgeConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 pb-safe">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">{t.members.removeDemoData}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.members.confirmRemoveDemo}
            </p>
            <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200">
              Note: Deletes only placeholder records marked with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">is_demo=true</code>. The administrator account and any real members added will be preserved.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPurgeConfirmModal(false)}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handlePurgeDemoData}
                disabled={formLoading}
                className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {formLoading ? t.common.loading : 'Yes, Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
