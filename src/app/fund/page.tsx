'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import { StatCard } from '@/components/StatCard';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Check,
  Send,
  PlusCircle,
  Phone,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Trash2,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react';

export default function MonthlyFundPage() {
  const { t, formatCurrency, formatDate } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reported' | 'confirmed'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Collection Modal State (Admin)
  const [newFundModal, setNewFundModal] = useState(false);
  const [newMonth, setNewMonth] = useState('12');
  const [newYear, setNewYear] = useState('2026');

  // Exception Modal
  const [exceptionModal, setExceptionModal] = useState<string | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');

  // Threshold Modal State (Admin)
  const [thresholdModal, setThresholdModal] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('50');

  // Member Report Modal State (with amount selection in 50 kr multiples)
  const [reportModal, setReportModal] = useState<any | null>(null);
  const [chosenAmount, setChosenAmount] = useState<number>(50);
  const [reportRef, setReportRef] = useState('');
  const [reportNote, setReportNote] = useState('');

  const fetchFundData = async () => {
    try {
      const res = await fetch('/api/fund');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching fund data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundData();
  }, []);

  const handleConfirmPayment = async (contributionId: string, amount: number) => {
    setActionLoading(contributionId);
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_payment',
          contributionId,
          amount,
        }),
      });
      if (res.ok) {
        fetchFundData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const openReportModal = (c: any) => {
    const minAmt = Number(fund?.min_contribution || 50);
    setChosenAmount(minAmt);
    setReportRef(`MP-${Date.now().toString().slice(-6)}`);
    setReportNote('Overført via MobilePay');
    setReportModal(c);
  };

  const handleConfirmReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal) return;
    setActionLoading(reportModal.id);
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_payment',
          contributionId: reportModal.id,
          amount: Number(chosenAmount),
          paymentReference: reportRef,
          memberNote: reportNote,
        }),
      });
      if (res.ok) {
        setReportModal(null);
        fetchFundData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to submit payment report');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePayment = async (contributionId: string) => {
    if (!confirm('Are you sure you want to delete this payment record? This will adjust fund totals.')) {
      return;
    }
    setActionLoading(contributionId);
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_payment',
          contributionId,
        }),
      });
      if (res.ok) {
        fetchFundData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete payment');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund?.id) return;
    setActionLoading('set_threshold');
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_monthly_threshold',
          fundId: fund.id,
          minContribution: Number(thresholdInput),
        }),
      });
      if (res.ok) {
        setThresholdModal(false);
        fetchFundData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update threshold');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionModal) return;

    setActionLoading(exceptionModal);
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_exception',
          contributionId: exceptionModal,
          exceptionReason: exceptionReason || 'Approved exception',
        }),
      });
      if (res.ok) {
        setExceptionModal(null);
        setExceptionReason('');
        fetchFundData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateNewFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create_fund');
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_fund',
          month: parseInt(newMonth),
          year: parseInt(newYear),
          title: `Month ${newMonth} ${newYear}`,
          targetAmount: 40 * 50.0,
        }),
      });
      if (res.ok) {
        setNewFundModal(false);
        fetchFundData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fund = data?.fund;
  const contributions: any[] = data?.contributions || [];

  const filteredContributions = contributions.filter((c) => {
    const matchesFilter = filter === 'all' ? true : c.status === filter;
    const matchesSearch =
      c.member_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.member_email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const canConfirm = user?.role === 'admin' || user?.role === 'collector';
  const collectorContribution = contributions.find((c) => c.is_collector_contribution);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t.fund.title}: {fund?.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 font-sans">
              {fund?.status?.toUpperCase()}
            </span>
          </div>
          <p className="font-sans text-xs text-slate-500 mt-1">
            50 DKK per member · Collector: <span className="font-semibold text-slate-800">{fund?.collector_name}</span> ({fund?.mobilepay_number})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <WhatsAppShare
            collectorName={fund?.collector_name}
            mobilepayNumber={fund?.mobilepay_number}
            monthTitle={fund?.title}
            amount={50}
          />
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => {
                  setThresholdInput(String(fund?.min_contribution || 50));
                  setThresholdModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs active:scale-95"
                title="Configure monthly minimum threshold"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <span>Threshold: {fund?.min_contribution || 50} kr</span>
              </button>

              <button
                onClick={() => setNewFundModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Open Next Month</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collector's Own Contribution Card */}
      {collectorContribution && (
        <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                {t.fund.collectorSelfContribution}
              </span>
              <h3 className="text-sm font-semibold text-white mt-0.5">
                {collectorContribution.member_name} ({formatCurrency(Number(collectorContribution.amount))})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Collector contributes and verifies their own 50 DKK directly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <Badge status={collectorContribution.status} label={collectorContribution.status.toUpperCase()} />
            {canConfirm && collectorContribution.status !== 'confirmed' && (
              <button
                onClick={() => handleConfirmPayment(collectorContribution.id, 50.0)}
                disabled={actionLoading === collectorContribution.id}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-transform"
              >
                {t.fund.recordCollectorPaid}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Cards (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          title={t.fund.target}
          value={formatCurrency(Number(fund?.computedTarget || 2000))}
          subtitle="40 active members"
        />
        <StatCard
          title={t.fund.collected}
          value={formatCurrency(Number(fund?.computedCollected || 0))}
          subtitle={`${fund?.paidCount || 0} confirmed in MobilePay`}
        />
        <StatCard
          title="Awaiting"
          value={formatCurrency(Number(fund?.totalReported || 0))}
          subtitle={`${fund?.reportedCount || 0} reported`}
        />
        <StatCard
          title={t.fund.outstanding}
          value={formatCurrency(Math.max(0, Number(fund?.computedTarget || 2000) - Number(fund?.computedCollected || 0)))}
          subtitle={`${fund?.pendingCount || 0} pending`}
        />
      </div>

      {/* Search and Tabs Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
        {/* Horizontal Touch-Scrollable Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
              filter === 'all'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.fund.filterAll} ({contributions.length})
          </button>
          <button
            onClick={() => setFilter('reported')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
              filter === 'reported'
                ? 'bg-sky-700 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.fund.filterReported} ({fund?.reportedCount || 0})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
              filter === 'confirmed'
                ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.fund.filterConfirmed} ({fund?.paidCount || 0})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
              filter === 'pending'
                ? 'bg-amber-700 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.fund.filterPending} ({fund?.pendingCount || 0})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search member name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* MOBILE CARD FEED (< md screens) */}
      <div className="md:hidden space-y-2.5">
        {filteredContributions.map((c) => {
          const isMine = user && (c.member_id === user.id || c.member_email === user.email);
          return (
            <div
              key={c.id}
              className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                    <span>{c.member_name}</span>
                    {c.is_collector_contribution && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold">
                        Collector
                      </span>
                    )}
                    {c.member_is_demo && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                        demo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">{c.member_email}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(Number(c.amount))}
                  </div>
                  <Badge
                    status={c.status}
                    label={t.fund.status[c.status as keyof typeof t.fund.status]}
                  />
                </div>
              </div>

              {(c.payment_reference || c.member_note || c.exception_reason) && (
                <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 font-mono">
                  {c.payment_reference || c.member_note || c.exception_reason}
                </div>
              )}

              {/* Action Buttons on Mobile Card */}
              <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400">
                <span>{c.reported_at ? `Reported ${formatDate(c.reported_at)}` : 'Pending'}</span>

                <div className="flex items-center gap-1.5">
                  {isMine && c.status === 'pending' && (
                    <button
                      onClick={() => openReportModal(c)}
                      disabled={actionLoading === c.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-700 text-white font-semibold text-xs active:scale-95 shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Mark Paid</span>
                    </button>
                  )}

                  {canConfirm && c.status !== 'confirmed' && (
                    <button
                      onClick={() => handleConfirmPayment(c.id, Number(c.amount))}
                      disabled={actionLoading === c.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs shadow-xs active:scale-95"
                    >
                      <Check className="w-3 h-3" />
                      <span>Confirm Receipt</span>
                    </button>
                  )}

                  {user?.role === 'admin' && c.status === 'pending' && (
                    <button
                      onClick={() => setExceptionModal(c.id)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
                    >
                      Exempt
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeletePayment(c.id)}
                      disabled={actionLoading === c.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete payment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredContributions.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            No matching contributions found.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= md screens) */}
      <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Note / Reference</th>
                <th className="py-3 px-4">Reported Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContributions.map((c) => {
                const isMine = user && (c.member_id === user.id || c.member_email === user.email);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{c.member_name}</span>
                          {c.is_collector_contribution && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-bold">
                              Collector
                            </span>
                          )}
                          {c.member_is_demo && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                              demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{c.member_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {formatCurrency(Number(c.amount))}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        status={c.status}
                        label={t.fund.status[c.status as keyof typeof t.fund.status]}
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {c.payment_reference || c.member_note || c.exception_reason || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {c.reported_at ? formatDate(c.reported_at) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isMine && c.status === 'pending' && (
                          <button
                            onClick={() => openReportModal(c)}
                            disabled={actionLoading === c.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-700 text-white font-medium hover:bg-sky-800 transition-colors shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </button>
                        )}

                        {canConfirm && c.status !== 'confirmed' && (
                          <button
                            onClick={() => handleConfirmPayment(c.id, Number(c.amount))}
                            disabled={actionLoading === c.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors shadow-xs"
                            title="Confirm receipt in MobilePay"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm Receipt</span>
                          </button>
                        )}

                        {user?.role === 'admin' && c.status === 'pending' && (
                          <button
                            onClick={() => setExceptionModal(c.id)}
                            className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px]"
                          >
                            Exempt
                          </button>
                        )}

                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeletePayment(c.id)}
                            disabled={actionLoading === c.id}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Grant Exception (Mobile Bottom Sheet / Center Dialog) */}
      {exceptionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 pb-safe">
            <h3 className="text-sm font-bold text-slate-900">Grant Approved Exception</h3>
            <form onSubmit={handleGrantException} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Exemption
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Temporary leave, medical exception"
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExceptionModal(null)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
                >
                  Save Exemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Set Monthly Threshold (Admin) */}
      {thresholdModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 pb-safe">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Set Monthly Threshold</h3>
                <p className="text-[11px] text-slate-500">Configure minimum contribution per member</p>
              </div>
            </div>

            <form onSubmit={handleSetThreshold} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Minimum Amount (DKK)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['50', '75', '100', '150'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setThresholdInput(preset)}
                      className={`py-2 rounded-xl font-bold border text-xs transition-colors ${
                        thresholdInput === preset
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset} kr
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setThresholdModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'set_threshold'}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                >
                  {actionLoading === 'set_threshold' ? t.common.loading : 'Save Threshold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Member Report Payment (Choose Amount in 50 kr multiples) */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 pb-safe">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Report Payment</h3>
                <p className="text-[11px] text-slate-500">Choose your contribution amount in 50 kr</p>
              </div>
            </div>

            <form onSubmit={handleConfirmReportPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Select Amount (DKK)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[50, 100, 150, 200, 250, 300].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setChosenAmount(amt)}
                      className={`py-2 px-1 rounded-xl font-bold border text-xs transition-colors ${
                        chosenAmount === amt
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {amt} kr
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Custom Amount (in multiples of 50 kr)
                  </label>
                  <input
                    type="number"
                    min={fund?.min_contribution || 50}
                    step="50"
                    required
                    value={chosenAmount}
                    onChange={(e) => setChosenAmount(Number(e.target.value))}
                    className="w-full text-base sm:text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  MobilePay Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MP-123456"
                  value={reportRef}
                  onChange={(e) => setReportRef(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Overført via MobilePay"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between font-medium">
                <span>Total Contribution:</span>
                <span className="font-mono font-extrabold text-xs">{formatCurrency(chosenAmount)}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReportModal(null)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === reportModal.id}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 active:scale-95 shadow-xs"
                >
                  {actionLoading === reportModal.id ? t.common.loading : 'Confirm & Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Open Next Month's Fund */}
      {newFundModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 pb-safe">
            <h3 className="text-sm font-bold text-slate-900">Open Next Monthly Fund</h3>
            <form onSubmit={handleCreateNewFund} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Month (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  min="2024"
                  required
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewFundModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create_fund'}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                >
                  {actionLoading === 'create_fund' ? t.common.loading : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
