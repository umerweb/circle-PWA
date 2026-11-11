'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import {
  FileSpreadsheet,
  Download,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { t, formatCurrency, formatDate } = useI18n();
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [livePeriods, setLivePeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Generate Report Modal
  const [generateModal, setGenerateModal] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data.reports || []);
      setLivePeriods(data.livePeriods || []);
      if (data.livePeriods?.length > 0 && !selectedFundId) {
        setSelectedFundId(data.livePeriods[0].fund_id);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('generate');
    try {
      const selectedFund = livePeriods.find((f) => f.fund_id === selectedFundId);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report',
          fundId: selectedFundId,
          year: selectedFund ? selectedFund.year : 2026,
          month: selectedFund ? selectedFund.month : 11,
          reportType: 'monthly',
          summaryNotes,
        }),
      });
      if (res.ok) {
        setGenerateModal(false);
        setSummaryNotes('');
        fetchReports();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    setActionLoading(reportId);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_report',
          reportId,
        }),
      });
      if (res.ok) {
        fetchReports();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const exportPdf = (report: any) => {
    const doc = new jsPDF();

    // Nordic Header
    doc.setFontSize(20);
    doc.setTextColor(22, 101, 52);
    doc.text('Circle Fund Denmark', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Community Financial Statement · ${report.period_label}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleDateString('da-DK')}`, 14, 34);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 38, 196, 38);

    const participationRate =
      report.member_count > 0
        ? `${Math.round((report.paying_member_count / report.member_count) * 100)}%`
        : '0%';

    autoTable(doc, {
      startY: 44,
      head: [['Financial Metric', 'Amount / Value (DKK)']],
      body: [
        ['Target Collection', `${report.total_expected} DKK`],
        ['Confirmed Collected', `${report.total_collected} DKK`],
        ['Total Disbursed Aid', `${report.total_distributed} DKK`],
        ['Outstanding Amount', `${report.total_outstanding} DKK`],
        ['Total Community Members', `${report.member_count}`],
        ['Paying Members Confirmed', `${report.paying_member_count}`],
        ['Participation Rate', participationRate],
        ['Publication Status', `${report.status.toUpperCase()}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [21, 128, 61], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    if (report.summary_notes) {
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Auditor / Administrator Summary Notes:', 14, finalY);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(report.summary_notes, 14, finalY + 6);
    }

    doc.save(`circle-fund-report-${report.period_label.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t.reports.title}
          </h1>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/reports?format=csv"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs active:scale-95 font-sans"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.reports.exportCsv}</span>
          </a>

          {isAdmin && (
            <button
              onClick={() => setGenerateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95 font-sans"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Generate Statement</span>
            </button>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-3 sm:space-y-4">
        {reports.map((r) => {
          const rate =
            r.member_count > 0 ? Math.round((r.paying_member_count / r.member_count) * 100) : 0;
          return (
            <div
              key={r.id}
              className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900">{r.period_label}</h2>
                    <span className="font-sans text-[11px] text-slate-500">
                      Statement created {formatDate(r.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <Badge
                    status={r.status}
                    label={t.reports.status[r.status as keyof typeof t.reports.status] || r.status}
                  />

                  {isAdmin && r.status !== 'published' && (
                    <button
                      onClick={() => handleApproveReport(r.id)}
                      disabled={actionLoading === r.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95"
                    >
                      {t.reports.approveReport}
                    </button>
                  )}

                  <button
                    onClick={() => exportPdf(r)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium active:scale-95"
                    title="Export clean PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Financial Metrics (2x2 on mobile, 4 columns on desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium text-[10px] sm:text-xs">Target Expected</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                    {formatCurrency(Number(r.total_expected))}
                  </p>
                </div>
                <div className="bg-emerald-50/60 p-2.5 sm:p-3 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 font-medium text-[10px] sm:text-xs">{t.reports.totalCollected}</span>
                  <p className="font-mono font-bold text-emerald-900 mt-0.5 text-xs sm:text-sm">
                    {formatCurrency(Number(r.total_collected))}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium text-[10px] sm:text-xs">{t.reports.totalDistributed}</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                    {formatCurrency(Number(r.total_distributed))}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium text-[10px] sm:text-xs">Participation</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                    {rate}% ({r.paying_member_count}/{r.member_count})
                  </p>
                </div>
              </div>

              {r.summary_notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {r.summary_notes}
                </p>
              )}
            </div>
          );
        })}

        {reports.length === 0 && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-400 text-xs">
            No financial reports generated yet.
          </div>
        )}
      </div>

      {/* Modal: Generate Statement */}
      {generateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 pb-safe">
            <h3 className="text-base font-bold text-slate-900">Generate Financial Statement</h3>
            <form onSubmit={handleGenerateReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Monthly Fund Collection *
                </label>
                <select
                  required
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {livePeriods.map((f) => (
                    <option key={f.fund_id} value={f.fund_id}>
                      {f.title} (Target: {f.target_amount} DKK, Collected: {f.collected_amount} DKK)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Summary Notes / Auditor Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. November 2026 collections verified against MobilePay transaction records."
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  className="w-full text-base sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGenerateModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'generate'}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50 shadow-xs"
                >
                  {actionLoading === 'generate' ? t.common.loading : 'Generate Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
