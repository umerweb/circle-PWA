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
  Filter,
  Edit2,
  Shield,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function MembersPage() {
  const { t, formatDate } = useI18n();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.members.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.members.subtitle}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPurgeConfirmModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors"
              title="Remove all placeholder demo records before real production use"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.members.removeDemoData}</span>
            </button>
            <button
              onClick={() => setAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.members.addMember}</span>
            </button>
          </div>
        )}
      </div>

      {notificationMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.members.totalMembers}
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {summary?.total_members || members.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.members.activeCount}
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {summary?.active_count || members.filter((m) => m.status === 'active').length}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t.members.demoCount}
          </span>
          <div className="text-2xl font-bold font-mono text-slate-500 mt-1">
            {summary?.demo_count || members.filter((m) => m.is_demo).length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="collector">Collectors</option>
            <option value="member">Members</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <form onSubmit={handleSearch} className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t.members.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </form>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
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
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Member Manually */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.role}</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">{t.members.edit}</h3>
            <form onSubmit={handleEditMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.members.name}</label>
                <input
                  type="text"
                  required
                  value={editModal.full_name}
                  onChange={(e) => setEditModal({ ...editModal, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">MobilePay Number</label>
                <input
                  type="text"
                  value={editModal.mobilepay_number || ''}
                  onChange={(e) => setEditModal({ ...editModal, mobilepay_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.members.role}</label>
                  <select
                    value={editModal.role}
                    onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">{t.members.removeDemoData}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t.members.confirmRemoveDemo}
            </p>
            <div className="p-3 bg-amber-50 rounded-lg text-[11px] text-amber-800 border border-amber-200">
              Note: This action safely deletes only placeholder test records marked with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">is_demo=true</code>. The administrator account and any real members you added will be preserved.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPurgeConfirmModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handlePurgeDemoData}
                disabled={formLoading}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {formLoading ? t.common.loading : 'Yes, Purge Demo Members'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
