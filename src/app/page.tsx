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
  Send,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  LogIn,
} from 'lucide-react';

export default function DashboardPage() {
  const { t, formatCurrency } = useI18n();
  const { user, enterDemoMode } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myContribution, setMyContribution] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReference, setReportReference] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/fund');
      const fundData = await res.json();
      setData(fundData);

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

  const handleCopyMobilePay = (number: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(number);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.fund) return;

    setReporting(true);
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_payment',
          contributionId: myContribution?.id || null,
          fundId: data.fund.id,
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
          <p className="text-xs text-slate-500 font-medium">{t.common.loading}</p>
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
  const mobilePayNum = fund?.mobilepay_number || '+45 52 34 56 78';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Greeting & Community Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t.dashboard.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 font-sans">
              {fund?.title || 'November 2026'}
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1">
            {user ? `${t.dashboard.welcomeBack}, ${user.fullName}` : t.brand.tagline}
          </p>
        </div>

        {/* WhatsApp Mobile Share Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <WhatsAppShare
            collectorName={fund?.collector_name || 'Demo Member 1'}
            mobilepayNumber={mobilePayNum}
            monthTitle={fund?.title || 'November 2026'}
            amount={50}
          />
        </div>
      </div>

      {/* Unauthenticated Visitor Welcome Banner */}
      {!user && (
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white uppercase tracking-wider font-sans">
                Circle Fund Danmark
              </span>
              <span className="font-heading text-sm text-emerald-950 font-bold">
                Transparent 50 DKK Community Mutual Aid
              </span>
            </div>
            <p className="font-sans text-xs text-slate-600 max-w-xl leading-relaxed">
              Sign in with your email and password to record your monthly MobilePay contributions, volunteer as a collector, and review transparent financial audits.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/auth/login"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 shadow-sm transition-colors flex items-center gap-1.5 font-sans"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.auth.signInTab} / {t.auth.signUpTab}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Member Payment Status Callout Card */}
      {user && myContribution && (
        <div
          className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-xs ${
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-xs sm:text-sm text-slate-900">
                  {t.dashboard.quickPayAction}: {formatCurrency(50)}
                </span>
                <Badge
                  status={myContribution.status}
                  label={t.fund.status[myContribution.status as keyof typeof t.fund.status]}
                />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
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
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm shrink-0 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.fund.markAsSent}</span>
            </button>
          )}
        </div>
      )}

      {/* Newly enrolled user without an explicit contribution row */}
      {user && !myContribution && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs sm:text-sm text-slate-900">
                Monthly Contribution: {formatCurrency(50)}
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
                Welcome to the circle! Transfer 50 DKK via MobilePay to the monthly collector and record your payment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setReportModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.fund.markAsSent}</span>
          </button>
        </div>
      )}

      {/* Main Stats Grid: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
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
          subtitle={`${paidCount} confirmed`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          trend={`${formatCurrency(Math.max(0, target - collected))} left`}
          trendType="attention"
        />
        <StatCard
          title={t.dashboard.paidMembers}
          value={`${paidCount}/${fund?.totalMembers || 40}`}
          subtitle={`${reportedCount} pending verification`}
          icon={<Users className="w-4 h-4" />}
          trend={`${Math.round((paidCount / (fund?.totalMembers || 40)) * 100)}%`}
          trendType="positive"
        />
        <StatCard
          title={t.dashboard.pendingMembers}
          value={`${pendingCount}`}
          subtitle="Expected: 50 DKK"
          icon={<Clock className="w-4 h-4" />}
          trend={`${pendingCount * 50} DKK pending`}
          trendType="neutral"
        />
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
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
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
          <span>0 DKK</span>
          <span className="font-semibold text-emerald-800">{formatCurrency(collected)}</span>
          <span>{formatCurrency(target)}</span>
        </div>
      </div>

      {/* Two Column Layout: Current Collector & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Active Collector Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t.dashboard.currentCollector}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {fund?.collector_name || 'Demo Member 1'}
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              MobilePay Primary
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {/* Phone Number with One-Tap Copy on Mobile */}
            <div className="bg-slate-50 rounded-xl p-3 sm:p-3.5 border border-slate-100 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {t.dashboard.mobilePayNumber}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PhoneCall className="w-4 h-4 text-emerald-700" />
                  <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tracking-tight">
                    {mobilePayNum}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyMobilePay(mobilePayNum)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shrink-0 shadow-xs active:scale-95"
                title="Copy number to clipboard"
              >
                {copiedNumber ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 sm:p-3.5 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">
                Payment Note Format
              </span>
              <p className="text-sm font-semibold font-mono text-slate-800 mt-1">
                CF-NOV-[YourName]
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-3 sm:p-3.5 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold text-emerald-900 mb-0.5">
              {t.dashboard.paymentInstructions}:
            </p>
            <p>
              {fund?.payment_instructions ||
                'Overfør venligst mindst 50 DKK via MobilePay til månedens indsamler. Husk at angive dit navn i overførslen og bekræfte betalingen i appen.'}
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <Link
              href="/fund"
              className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group py-1"
            >
              <span>{t.dashboard.viewDetails}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/volunteers"
              className="text-slate-500 hover:text-slate-800 font-medium py-1"
            >
              {t.volunteers.applyToCollect} &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Community Mutual Aid */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <HeartHandshake className="w-5 h-5 text-emerald-700 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">
              {t.beneficiaries.title}
            </h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {t.beneficiaries.anonymousNotice}
          </p>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
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
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>View Beneficiaries & Distributions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-1 border-t border-slate-100">
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

      {/* Modal: Mark Payment Sent (Touch-Friendly Responsive Modal) */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-slide-up sm:animate-scale-up pb-safe">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {t.fund.markAsSent}
              </h3>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Transfer <span className="font-semibold text-slate-900">50 DKK</span> via MobilePay to{' '}
              <span className="font-semibold text-slate-900">{fund?.collector_name}</span> at{' '}
              <span className="font-mono font-semibold text-emerald-800">{mobilePayNum}</span>.
            </p>

            <form onSubmit={handleReportPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional MobilePay Transaction Note / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. CF-NOV-YourName or MP transaction code"
                  value={reportReference}
                  onChange={(e) => setReportReference(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {reportSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.fund.reportedSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={reporting}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 shadow-sm active:scale-95"
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
