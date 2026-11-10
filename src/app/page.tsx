'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { StatCard } from '@/components/StatCard';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { Badge } from '@/components/Badge';
import {
  TrendingUp,
  Users,
  Clock,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  ShieldAlert,
  Send,
} from 'lucide-react';

export default function DashboardPage() {
  const { t, formatCurrency } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myContribution, setMyContribution] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReference, setReportReference] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/fund');
      const fundData = await res.json();
      setData(fundData);

      // Find my contribution record
      if (fundData.contributions && user) {
        const mine = fundData.contributions.find(
          (c: any) => c.member_id === user.id || c.member_email === user.email
        );
        setMyContribution(mine || null);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myContribution) return;

    setReporting(true);
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_payment',
          contributionId: myContribution.id,
          amount: 50.0,
          paymentReference: reportReference || `MP-${Date.now().toString().slice(-6)}`,
          memberNote: 'Reported via dashboard',
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccess(false);
          fetchDashboardData();
        }, 1200);
      }
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const fund = data?.fund;
  const target = Number(fund?.target_amount || fund?.computedTarget || 2000);
  const collected = Number(fund?.collected_amount || fund?.computedCollected || 0);
  const progressPercent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const paidCount = fund?.paidCount || 0;
  const pendingCount = fund?.pendingCount || 0;
  const reportedCount = fund?.reportedCount || 0;

  return (
    <div className="space-y-6">
      {/* Top Greeting & Community Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t.dashboard.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {fund?.title || 'November 2026'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {user ? `${t.dashboard.welcomeBack}, ${user.fullName}` : t.brand.tagline}
          </p>
        </div>

        {/* WhatsApp Share Button */}
        <div className="flex items-center gap-2">
          <WhatsAppShare
            collectorName={fund?.collector_name || 'Demo Member 1'}
            mobilepayNumber={fund?.mobilepay_number || '+45 52 34 56 78'}
            monthTitle={fund?.title || 'November 2026'}
            amount={50}
          />
        </div>
      </div>

      {/* Member Payment Status Callout Card */}
      {user && myContribution && (
        <div
          className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            myContribution.status === 'confirmed'
              ? 'bg-emerald-50/70 border-emerald-200'
              : myContribution.status === 'reported'
              ? 'bg-sky-50/70 border-sky-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {myContribution.status === 'confirmed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : myContribution.status === 'reported' ? (
              <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  {t.dashboard.quickPayAction}: {formatCurrency(50)}
                </span>
                <Badge
                  status={myContribution.status}
                  label={t.fund.status[myContribution.status as keyof typeof t.fund.status]}
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {myContribution.status === 'confirmed'
                  ? 'Your monthly contribution has been verified by the collector in MobilePay.'
                  : myContribution.status === 'reported'
                  ? 'You marked payment as sent. Awaiting collector MobilePay confirmation.'
                  : 'Please transfer 50 DKK via MobilePay to the collector and mark it below.'}
              </p>
            </div>
          </div>

          {myContribution.status === 'pending' && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.fund.markAsSent}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.dashboard.monthlyTarget}
          value={formatCurrency(target)}
          subtitle={`40 ${t.members.roles.member.toLowerCase()}`}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={`${progressPercent}%`}
          trendType="positive"
        />
        <StatCard
          title={t.dashboard.confirmedCollection}
          value={formatCurrency(collected)}
          subtitle={`${paidCount} ${t.fund.status.confirmed.toLowerCase()}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          trend={`${formatCurrency(Math.max(0, target - collected))} remaining`}
          trendType="attention"
        />
        <StatCard
          title={t.dashboard.paidMembers}
          value={`${paidCount} / ${fund?.totalMembers || 40}`}
          subtitle={`${reportedCount} awaiting confirmation`}
          icon={<Users className="w-4 h-4" />}
          trend={`${Math.round((paidCount / (fund?.totalMembers || 40)) * 100)}%`}
          trendType="positive"
        />
        <StatCard
          title={t.dashboard.pendingMembers}
          value={`${pendingCount}`}
          subtitle={`Expected: 50 DKK each`}
          icon={<Clock className="w-4 h-4" />}
          trend={`${pendingCount * 50} DKK pending`}
          trendType="neutral"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>{t.dashboard.collectionProgress}</span>
          <span className="text-emerald-700 font-mono text-sm">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>0 DKK</span>
          <span>{formatCurrency(collected)} confirmed</span>
          <span>{formatCurrency(target)} target</span>
        </div>
      </div>

      {/* Two Column Layout: Current Collector & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Collector Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.dashboard.currentCollector}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {fund?.collector_name || 'Demo Member 1'}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              MobilePay Primary
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">{t.dashboard.mobilePayNumber}</span>
              <div className="flex items-center gap-2 mt-1">
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span className="text-base font-bold font-mono text-slate-900">
                  {fund?.mobilepay_number || '+45 52 34 56 78'}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Payment Note Format</span>
              <p className="text-sm font-semibold font-mono text-slate-800 mt-1">
                CF-NOV-[YourName]
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-lg p-3.5 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-emerald-900 mb-1">
              {t.dashboard.paymentInstructions}:
            </p>
            <p>
              {fund?.payment_instructions ||
                'Overfør venligst mindst 50 DKK via MobilePay til månedens indsamler. Husk at angive dit navn i overførslen og bekræfte betalingen i appen.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/fund"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
            >
              <span>{t.dashboard.viewDetails}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/volunteers"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              {t.volunteers.applyToCollect} &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Community Highlights & Mutual Aid */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <HeartHandshake className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">
              {t.beneficiaries.title}
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {t.beneficiaries.anonymousNotice}
          </p>

          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Active Cases</span>
              <span className="font-bold text-slate-900">2 Community Cases</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Disbursed Aid</span>
              <span className="font-bold text-emerald-700 font-mono">800 DKK</span>
            </div>
          </div>

          <Link
            href="/beneficiaries"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>View Beneficiaries & Distributions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/reports"
              className="flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 py-1"
            >
              <span>Download Published Reports</span>
              <span className="text-emerald-700 font-semibold">PDF / CSV &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: Mark Payment Sent */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900">
              {t.fund.markAsSent}
            </h3>
            <p className="text-xs text-slate-600">
              Please transfer <span className="font-semibold text-slate-900">50 DKK</span> via MobilePay to{' '}
              <span className="font-semibold text-slate-900">{fund?.collector_name}</span> at{' '}
              <span className="font-mono font-semibold text-emerald-800">{fund?.mobilepay_number}</span>.
            </p>

            <form onSubmit={handleReportPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional MobilePay Transaction Note / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. CF-NOV-YourName or MP transaction code"
                  value={reportReference}
                  onChange={(e) => setReportReference(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {reportSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium">
                  {t.fund.reportedSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={reporting}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50"
                >
                  {reporting ? t.common.loading : t.common.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
