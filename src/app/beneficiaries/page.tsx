'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import { StatCard } from '@/components/StatCard';
import {
  HeartHandshake,
  PlusCircle,
  ShieldCheck,
  DollarSign,
  Eye,
  EyeOff,
  Receipt,
  Calendar,
} from 'lucide-react';

export default function BeneficiariesPage() {
  const { t, formatCurrency, formatDate } = useI18n();
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addBenModal, setAddBenModal] = useState(false);
  const [distModal, setDistModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Add Beneficiary Form
  const [benName, setBenName] = useState('');
  const [benAlias, setBenAlias] = useState('');
  const [benCategory, setBenCategory] = useState('medical');
  const [benReason, setBenReason] = useState('');
  const [benIsAnon, setBenIsAnon] = useState(true);
  const [benContact, setBenContact] = useState('');

  // Record Distribution Form
  const [selectedBenId, setSelectedBenId] = useState('');
  const [distAmount, setDistAmount] = useState('');
  const [distDate, setDistDate] = useState(new Date().toISOString().split('T')[0]);
  const [distDescription, setDistDescription] = useState('');
  const [distReceipt, setDistReceipt] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/beneficiaries');
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
      setDistributions(data.distributions || []);
      setStats(data.stats || null);
      setIsAdmin(data.isAdmin || false);
    } catch (err) {
      console.error('Error fetching beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_beneficiary',
          fullName: benName,
          aliasName: benAlias || `Community Case #${Date.now().toString().slice(-4)}`,
          category: benCategory,
          reason: benReason,
          isAnonymous: benIsAnon,
          contactInfo: benContact,
        }),
      });
      if (res.ok) {
        setAddBenModal(false);
        setBenName('');
        setBenAlias('');
        setBenReason('');
        setBenContact('');
        fetchData();
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleRecordDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_distribution',
          beneficiaryId: selectedBenId,
          amount: parseFloat(distAmount),
          distributionDate: distDate,
          description: distDescription,
          evidenceReference: distReceipt,
        }),
      });
      if (res.ok) {
        setDistModal(false);
        setDistAmount('');
        setDistDescription('');
        setDistReceipt('');
        fetchData();
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t.beneficiaries.title}
          </h1>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t.beneficiaries.subtitle}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setDistModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors shadow-xs active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t.beneficiaries.recordDistribution}</span>
            </button>
            <button
              onClick={() => setAddBenModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.beneficiaries.addBeneficiary}</span>
            </button>
          </div>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t.beneficiaries.anonymousNotice}{' '}
          {isAdmin ? (
            <span className="font-semibold text-emerald-800">
              (Logged in as Administrator: confidential identity details are visible).
            </span>
          ) : (
            <span className="font-semibold text-slate-700">
              (Viewing in member privacy mode).
            </span>
          )}
        </p>
      </div>

      {/* Stats Cards: 2 columns */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <StatCard
          title="Total Aid Distributed"
          value={formatCurrency(Number(stats?.total_distributed || 800))}
          subtitle="Community mutual assistance"
          trend="Audited"
          trendType="positive"
        />
        <StatCard
          title="Beneficiary Cases"
          value={`${beneficiaries.length} Cases`}
          subtitle="Medical, Education, Living"
          trend="Active"
        />
      </div>

      {/* Beneficiary Cases Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Active Support Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{b.full_name}</h3>
                    {b.is_anonymous ? (
                      <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        <EyeOff className="w-3 h-3" /> Anonymous
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        <Eye className="w-3 h-3" /> Public
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                    {t.beneficiaries.categories[b.category as keyof typeof t.beneficiaries.categories] || b.category}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">{t.beneficiaries.totalReceived}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(Number(b.total_allocated))}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {b.reason}
              </p>

              {isAdmin && b.contact_info && (
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                  Contact: {b.contact_info}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Distribution History Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden space-y-3 p-4">
        <h2 className="text-sm font-bold text-slate-900">
          {t.beneficiaries.distributionsList}
        </h2>

        {/* MOBILE CARD FEED (< md) */}
        <div className="md:hidden space-y-2.5">
          {distributions.map((d) => (
            <div key={d.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{d.raw_full_name}</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(Number(d.amount))}
                </span>
              </div>
              <p className="text-slate-600">{d.description}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                <span>{formatDate(d.distribution_date)}</span>
                {d.evidence_reference && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Receipt className="w-3 h-3 text-slate-400" />
                    {d.evidence_reference}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">{t.beneficiaries.distributionDate}</th>
                <th className="py-2.5 px-3">Beneficiary</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Voucher Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {distributions.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 text-slate-600">{formatDate(d.distribution_date)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{d.raw_full_name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {d.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{d.description}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {formatCurrency(Number(d.amount))}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {d.evidence_reference || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Beneficiary */}
      {addBenModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 pb-safe">
            <h3 className="text-base font-bold text-slate-900">{t.beneficiaries.addBeneficiary}</h3>
            <form onSubmit={handleAddBeneficiary} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confidential Full Name (Admin Only) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lars Jensen"
                  value={benName}
                  onChange={(e) => setBenName(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Public Alias Name (Visible to Members)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Community Family #2"
                  value={benAlias}
                  onChange={(e) => setBenAlias(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={benCategory}
                  onChange={(e) => setBenCategory(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="medical">Medical & Healthcare</option>
                  <option value="education">Education & Learning</option>
                  <option value="emergency">Emergency Relief</option>
                  <option value="living_support">Living & Family Support</option>
                  <option value="other">Other Community Support</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Support Purpose / Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the community need..."
                  value={benReason}
                  onChange={(e) => setBenReason(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confidential Contact Info
                </label>
                <input
                  type="text"
                  placeholder="Phone, email or address (kept private)"
                  value={benContact}
                  onChange={(e) => setBenContact(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAnon"
                  checked={benIsAnon}
                  onChange={(e) => setBenIsAnon(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="isAnon" className="font-medium text-slate-700 text-xs">
                  {t.beneficiaries.isAnonymous}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddBenModal(false)}
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

      {/* Modal: Record Distribution */}
      {distModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 pb-safe">
            <h3 className="text-base font-bold text-slate-900">{t.beneficiaries.recordDistribution}</h3>
            <form onSubmit={handleRecordDistribution} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Beneficiary *</label>
                <select
                  required
                  value={selectedBenId}
                  onChange={(e) => setSelectedBenId(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Beneficiary --</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} ({b.alias_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (DKK) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 500.00"
                    value={distAmount}
                    onChange={(e) => setDistAmount(e.target.value)}
                    className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={distDate}
                    onChange={(e) => setDistDate(e.target.value)}
                    className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical prescription subsidy"
                  value={distDescription}
                  onChange={(e) => setDistDescription(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Voucher / Receipt Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. KVIT-2026-MED-042"
                  value={distReceipt}
                  onChange={(e) => setDistReceipt(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDistModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {formLoading ? t.common.loading : 'Record Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
