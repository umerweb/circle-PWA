'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import {
  HandHeart,
  Phone,
  CheckCircle2,
  XCircle,
  UserCheck,
  Send,
} from 'lucide-react';

export default function VolunteersPage() {
  const { t, formatDate } = useI18n();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [pastCollectors, setPastCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Application Form
  const [targetMonth, setTargetMonth] = useState('12');
  const [targetYear, setTargetYear] = useState('2026');
  const [mobilepayNumber, setMobilepayNumber] = useState(user?.mobilepayNumber || '+45 20 12 34 56');
  const [notes, setNotes] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers');
      const data = await res.json();
      setApplications(data.applications || []);
      setPastCollectors(data.pastCollectors || []);
    } catch (err) {
      console.error('Error fetching volunteers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('apply');
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          targetMonth: parseInt(targetMonth),
          targetYear: parseInt(targetYear),
          mobilepayNumber,
          notes,
        }),
      });
      if (res.ok) {
        setApplySuccess(true);
        setNotes('');
        setTimeout(() => setApplySuccess(false), 2500);
        fetchVolunteers();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async (volunteerId: string, action: 'approve' | 'reject') => {
    setActionLoading(volunteerId);
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          volunteerId,
        }),
      });
      if (res.ok) {
        fetchVolunteers();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/80">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {t.volunteers.title}
        </h1>
        <p className="font-sans text-xs text-slate-500 mt-1">
          {t.volunteers.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Volunteer Application Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <HandHeart className="w-5 h-5 text-emerald-700 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">
              {t.volunteers.applyToCollect}
            </h2>
          </div>

          <form onSubmit={handleApply} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.volunteers.targetMonth}
                </label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="11">November</option>
                  <option value="12">December</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.volunteers.targetYear}
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.volunteers.mobilePayInput} *
              </label>
              <input
                type="text"
                required
                placeholder="+45 12 34 56 78"
                value={mobilepayNumber}
                onChange={(e) => setMobilepayNumber(e.target.value)}
                className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t.volunteers.notes}
              </label>
              <textarea
                rows={3}
                placeholder="A brief message about your availability..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {applySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium">
                Your volunteer application has been submitted for administrator review.
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading === 'apply'}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.volunteers.submitApplication}</span>
            </button>
          </form>
        </div>

        {/* Applications List & Past Collectors */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>{t.volunteers.pendingApplications}</span>
              <span className="text-xs font-normal text-slate-500">
                {applications.length} submitted
              </span>
            </h2>

            <div className="space-y-2.5">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-slate-200/90 p-3.5 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">
                        {app.member_name}
                      </span>
                      <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Month {app.target_month}/{app.target_year}
                      </span>
                      <Badge status={app.status} label={app.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {app.mobilepay_number}
                      </span>
                      <span>Submitted {formatDate(app.created_at)}</span>
                    </div>
                    {app.notes && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">
                        &ldquo;{app.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {isAdmin && app.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleReview(app.id, 'approve')}
                        disabled={actionLoading === app.id}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.volunteers.approveAction}</span>
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'reject')}
                        disabled={actionLoading === app.id}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        title={t.volunteers.rejectAction}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {applications.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No volunteer applications currently pending.
                </p>
              )}
            </div>
          </div>

          {/* Past & Upcoming Approved Collectors */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              {t.volunteers.approvedCollectors}
            </h2>
            <div className="divide-y divide-slate-100">
              {pastCollectors.map((f, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900">{f.title}</span>
                      <span className="text-slate-500 ml-1.5">Collector: {f.collector_name}</span>
                    </div>
                  </div>
                  <span className="font-mono text-slate-600 shrink-0">{f.mobilepay_number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
