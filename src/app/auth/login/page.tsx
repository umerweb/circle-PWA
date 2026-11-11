'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import {
  CircleDot,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Phone,
  UserPlus,
  LogIn,
  Lock,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const { t, language } = useI18n();
  const { requestOtp, verifyOtp, signIn } = useAuth();
  const router = useRouter();

  // Mode: 'signin' | 'signup' | 'forgot_password'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');

  // Step: 1 = Enter form details, 2 = Verify 6-digit OTP (for registration or password reset)
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobilepayNumber, setMobilepayNumber] = useState('');

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown countdown for OTP
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Timer effect for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Focus OTP input when stepping into step 2
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // DIRECT LOGIN (Email + Password - NO OTP NEEDED!)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please provide your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    const res = await signIn(cleanEmail, password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(language === 'da' ? 'Logget ind! Omdirigerer...' : 'Signed in! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      setError(res.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  // REGISTRATION & FORGOT PASSWORD (OTP Trigger)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please provide a valid email address');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError('Please enter your full name (minimum 2 characters)');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    } else if (mode === 'forgot_password') {
      if (!newPassword || newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);

    const res = await requestOtp({
      email: cleanEmail,
      purpose: mode === 'signup' ? 'signup' : 'forgot_password',
      fullName: mode === 'signup' ? fullName.trim() : undefined,
      password: mode === 'signup' ? password : undefined,
      newPassword: mode === 'forgot_password' ? newPassword : undefined,
      phone: mode === 'signup' && phone ? phone.trim() : undefined,
      mobilepayNumber: mode === 'signup' && mobilepayNumber ? mobilepayNumber.trim() : undefined,
      language: language as 'en' | 'da',
    } as any);

    setLoading(false);

    if (res.success) {
      setStep(2);
      setCooldown(res.cooldownSeconds || 60);
      setSuccessMessage(
        language === 'da'
          ? `En 6-cifret bekræftelseskode er sendt til ${cleanEmail}`
          : `A 6-digit verification code has been sent to ${cleanEmail}`
      );
    } else {
      setError(res.error || 'Failed to dispatch verification code');
      if (res.cooldownSeconds) {
        setCooldown(res.cooldownSeconds);
      }
    }
  };

  // VERIFY OTP (Finalize Registration or Password Reset)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = otpCode.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);

    const res = await verifyOtp({
      email: email.trim().toLowerCase(),
      otpCode: cleanCode,
      purpose: mode === 'signup' ? 'signup' : 'forgot_password',
    } as any);

    setLoading(false);

    if (res.success) {
      setSuccessMessage(
        mode === 'signup'
          ? (language === 'da' ? 'Konto oprettet! Sender dig videre...' : 'Account created! Redirecting...')
          : (language === 'da' ? 'Adgangskode nulstillet! Sender dig videre...' : 'Password reset! Redirecting...')
      );
      setTimeout(() => {
        router.push('/');
      }, 700);
    } else {
      setError(res.error || 'Verification failed');
      if (res.maxAttemptsReached || res.expired) {
        setOtpCode('');
      }
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await requestOtp({
      email: email.trim().toLowerCase(),
      purpose: mode === 'signup' ? 'signup' : 'forgot_password',
      fullName: mode === 'signup' ? fullName.trim() : undefined,
      password: mode === 'signup' ? password : undefined,
      newPassword: mode === 'forgot_password' ? newPassword : undefined,
      phone: mode === 'signup' && phone ? phone.trim() : undefined,
      mobilepayNumber: mode === 'signup' && mobilepayNumber ? mobilepayNumber.trim() : undefined,
      language: language as 'en' | 'da',
    } as any);

    setLoading(false);

    if (res.success) {
      setCooldown(res.cooldownSeconds || 60);
      setSuccessMessage(
        language === 'da' ? 'Ny bekræftelseskode sendt!' : 'A new verification code has been dispatched!'
      );
    } else {
      setError(res.error || 'Failed to resend code');
      if (res.cooldownSeconds) {
        setCooldown(res.cooldownSeconds);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[78vh] px-3.5 py-8">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-9 space-y-7">
        {/* Urbanist Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-sm">
            <CircleDot className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Circle Fund
            </h1>
            <p className="font-sans text-xs text-slate-500 font-medium tracking-wide mt-1">
              Danmark · 50 DKK Månedlig Fællesskabsopsparing
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Create Account (Only on Step 1) */}
        {step === 1 && mode !== 'forgot_password' && (
          <div className="flex rounded-xl bg-slate-100/90 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.auth.signInTab}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.auth.signUpTab}</span>
            </button>
          </div>
        )}

        {/* Forgot Password Header return button */}
        {mode === 'forgot_password' && step === 1 && (
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-emerald-800 font-semibold hover:text-emerald-950"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>&larr; Back to Sign In</span>
            </button>
            <span className="text-xs font-semibold text-slate-600">Reset Password</span>
          </div>
        )}

        {/* Alerts / Error Feedback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN MODE: Direct Email & Password (NO OTP) */}
        {mode === 'signin' && step === 1 && (
          <form onSubmit={handleSignIn} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {t.auth.emailLabel} *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-700">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setError(null);
                  }}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 text-sm active:scale-[0.99] mt-2 font-sans"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? t.common.loading : t.nav.signIn}</span>
            </button>
          </form>
        )}

        {/* 2. SIGN UP MODE: Registration details + Password + OTP Email Verification */}
        {mode === 'signup' && step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {t.auth.fullNameLabel} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={t.auth.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {t.auth.emailLabel} *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Choose Password (minimum 6 characters) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.auth.mobilepayLabel}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder={t.auth.mobilepayPlaceholder}
                    value={mobilepayNumber}
                    onChange={(e) => setMobilepayNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-9 font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.auth.phoneLabel}
                </label>
                <input
                  type="tel"
                  placeholder={t.auth.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              {t.auth.termsNotice}
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 text-sm active:scale-[0.99] mt-2 font-sans"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Sending Verification Code...' : 'Verify Email & Create Account'}</span>
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE: Email + New Password + OTP Verification */}
        {mode === 'forgot_password' && step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs font-sans">
            <p className="text-xs text-slate-500">
              Enter your account email and your new password. We will email you a 6-digit verification code to confirm the change.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Account Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                New Password (minimum 6 characters) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 text-sm active:scale-[0.99] mt-2 font-sans"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit Verification Code (for Registration or Reset) */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs font-sans">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="truncate">
                <span className="text-[11px] text-emerald-800 font-medium block">
                  {t.auth.otpSentTo}:
                </span>
                <span className="font-bold text-slate-900 truncate block text-xs font-mono">
                  {email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpCode('');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline shrink-0 ml-2"
              >
                {t.auth.changeEmail}
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2 text-center font-heading text-sm">
                {t.auth.enterOtp}
              </label>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full tracking-[0.5em] text-center font-mono text-2xl sm:text-3xl font-extrabold py-3.5 px-4 rounded-xl border-2 border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 bg-emerald-50/30 text-emerald-900 placeholder:text-slate-300"
              />
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Valid for 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 text-sm active:scale-[0.99]"
            >
              <span>
                {loading
                  ? t.common.loading
                  : mode === 'signup'
                  ? 'Confirm Code & Complete Registration'
                  : 'Confirm Code & Reset Password'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Resend Action with countdown */}
            <div className="text-center pt-1">
              {cooldown > 0 ? (
                <span className="text-xs text-slate-400 font-medium">
                  {t.auth.resendIn} <span className="font-mono font-bold text-slate-600">{cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.auth.resendCode}</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-[11px] text-center text-slate-400 font-sans">
          Circle Fund Danmark · Sikkerhed og gennemsigtighed for fællesskabet.
        </p>
      </div>
    </div>
  );
}
