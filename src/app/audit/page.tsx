'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { History, Shield, Filter, Search, Terminal } from 'lucide-react';

export default function AuditPage() {
  const { t, formatDate } = useI18n();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('all');

  const fetchLogs = async () => {
    try {
      const url = selectedAction !== 'all' ? `/api/audit?action=${selectedAction}` : '/api/audit';
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t.audit.title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t.audit.subtitle}
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Event:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Events</option>
            <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED</option>
            <option value="PAYMENT_REPORTED">PAYMENT_REPORTED</option>
            <option value="COLLECTOR_APPROVED">COLLECTOR_APPROVED</option>
            <option value="REPORT_PUBLISHED">REPORT_PUBLISHED</option>
            <option value="DISTRIBUTION_RECORDED">DISTRIBUTION_RECORDED</option>
            <option value="MEMBER_ADDED_MANUALLY">MEMBER_ADDED_MANUALLY</option>
            <option value="DEMO_DATA_PURGED">DEMO_DATA_PURGED</option>
          </select>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {logs.length} entries recorded
        </span>
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">{t.audit.timestamp}</th>
                <th className="py-3 px-4">{t.audit.action}</th>
                <th className="py-3 px-4">{t.audit.entity}</th>
                <th className="py-3 px-4">{t.audit.actor}</th>
                <th className="py-3 px-4">{t.audit.details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('da-DK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-sans">
                    <span className="text-xs font-semibold">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="text-[11px] text-slate-400 ml-1">({log.entity_id.slice(0, 8)})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-medium text-slate-900">{log.actor_name || log.actor_email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[280px] truncate text-[11px]">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No audit log records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
