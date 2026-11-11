'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { ShieldCheck, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';

export default function BootstrapAdminPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobilepayNumber, setMobilepayNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, phone, mobilepayNumber, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(data.error || 'Failed to provision admin account');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-8">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6 text-emerald-100" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Super Admin
          </h1>
          <p className="text-xs text-slate-500">
            Provision the production Super Administrator account for genuine fund management (zero demo data).
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Super Administrator provisioned!</p>
              <p className="text-[11px] text-emerald-700">Redirecting to your production dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleBootstrap} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Super Admin Email *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. admin@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This email will be the real Super Admin and will only see real data.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jensen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                placeholder="+45 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MobilePay No.</label>
              <input
                type="tel"
                placeholder="12345678"
                value={mobilepayNumber}
                onChange={(e) => setMobilepayNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Admin Password *
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 text-sm active:scale-[0.99]"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? t.common.loading : 'Create Super Admin Account'}</span>
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            href="/auth/login"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            &larr; Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
