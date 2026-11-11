'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { Bell, CheckCheck, Send, Info, MailCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { t, formatDate, language } = useI18n();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    fetchNotifications();
  };

  const handleSendReminder = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_payment_reminder' }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminderMsg(data.message);
        fetchNotifications();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const canSendReminder = user?.role === 'admin' || user?.role === 'collector';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t.notifications.title}
          </h1>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Community announcements, reminders, and collection updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.notifications.markAllRead}</span>
            </button>
          )}

          {canSendReminder && (
            <button
              onClick={handleSendReminder}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{actionLoading ? t.common.loading : 'Dispatch Payment Reminders'}</span>
            </button>
          )}
        </div>
      </div>

      {reminderMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{reminderMsg}</span>
          <button onClick={() => setReminderMsg(null)} className="font-bold text-emerald-900">&times;</button>
        </div>
      )}

      {/* Email Integration Status Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <MailCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">
            Email System Status: Safe Mode (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">EMAIL_ENABLED=false</code>)
          </p>
          <p className="text-slate-500 mt-0.5 leading-relaxed">
            All bilingual email templates and delivery pipelines are implemented. Outbound external emails are safely skipped without errors. WhatsApp mobile sharing is enabled for direct sharing.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {notifications.map((n) => {
          const title = language === 'da' ? n.title_da : n.title_en;
          const message = language === 'da' ? n.message_da : n.message_en;
          return (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-white' : 'bg-emerald-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.notifications.noNotifications}
          </div>
        )}
      </div>
    </div>
  );
}
