'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { CircleDot, LogIn, Shield, User, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { t } = useI18n();
  const { signIn, switchUserRoleForDemo } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Failed to sign in');
    }
  };

  const handleQuickDemoRole = async (role: 'admin' | 'collector' | 'member') => {
    setLoading(true);
    await switchUserRoleForDemo(role);
    setLoading(false);
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
            <CircleDot className="w-6 h-6 text-emerald-100" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.auth.signInTitle}
          </h1>
          <p className="text-xs text-slate-500">
            {t.auth.signInSubtitle}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t.auth.emailLabel}
            </label>
            <input
              type="email"
              required
              placeholder="e.g. umer.web2@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                {t.auth.passwordLabel}
              </label>
              <Link
                href="/auth/bootstrap"
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Set Admin Password &rarr;
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-xs active:scale-95 disabled:opacity-50 text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? t.common.loading : t.nav.signIn}</span>
          </button>
        </form>

        {/* Quick Persona Switcher for Instant Evaluation */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center">
            One-Click Role Demonstration
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoRole('admin')}
              className="p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 flex flex-col items-center gap-1 font-semibold"
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('collector')}
              className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex flex-col items-center gap-1 font-semibold"
            >
              <UserCheck className="w-4 h-4" />
              <span>Collector</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoRole('member')}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex flex-col items-center gap-1 font-semibold"
            >
              <User className="w-4 h-4" />
              <span>Member</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400">
          {t.auth.invitationOnly}
        </p>
      </div>
    </div>
  );
}
