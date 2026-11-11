'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import {
  CircleDot,
  Mail,
  KeyRound,
  Shield,
  User,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Phone,
  UserPlus,
  LogIn,
} from 'lucide-react';

export default function LoginPage() {
  const { t, language } = useI18n();
  const { requestOtp, verifyOtp, enterDemoMode, switchUserRoleForDemo } = useAuth();
  const router = useRouter();

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Step: 1 = Enter email/details, 2 = Enter 6-digit OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobilepayNumber, setMobilepayNumber] = useState('');

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown countdown
  const [cooldown, setCooldown] = useState(0);

  // Suggested action for edge cases (e.g., account exists or needs signup)
  const [suggestedAction, setSuggestedAction] = useState<{
    text: string;
    action: () => void;
  } | null>(null);

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

  // Handle Requesting OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSuggestedAction(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please provide a valid email address');
      return;
    }

    if (mode === 'signup' && (!fullName.trim() || fullName.trim().length < 2)) {
      setError('Please enter your full name (minimum 2 characters)');
      return;
    }

    setLoading(true);

    const res = await requestOtp({
      email: cleanEmail,
      purpose: mode === 'signup' ? 'signup' : 'login',
      fullName: mode === 'signup' ? fullName.trim() : undefined,
      phone: mode === 'signup' && phone ? phone.trim() : undefined,
      mobilepayNumber: mode === 'signup' && mobilepayNumber ? mobilepayNumber.trim() : undefined,
      language: language as 'en' | 'da',
    });

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
      setError(res.error || 'Failed to send verification code');
      if (res.cooldownSeconds) {
        setCooldown(res.cooldownSeconds);
      }

      // Edge Case: User tried to login but account does not exist
      if (res.notRegistered) {
        setSuggestedAction({
          text: language === 'da' ? 'Opret konto nu' : 'Create an account now',
          action: () => {
            setMode('signup');
            setError(null);
            setSuggestedAction(null);
          },
        });
      }

      // Edge Case: User tried to signup but account already exists
      if (res.alreadyRegistered) {
        setSuggestedAction({
          text: language === 'da' ? 'Log ind med denne e-mail' : 'Sign in with this email',
          action: () => {
            setMode('signin');
            setError(null);
            setSuggestedAction(null);
          },
        });
      }
    }
  };

  // Handle Verifying OTP
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
      purpose: mode === 'signup' ? 'signup' : 'login',
    });

    setLoading(false);

    if (res.success) {
      setSuccessMessage(
        language === 'da' ? 'Verifikation gennemført! Sender dig videre...' : 'Verified! Redirecting to dashboard...'
      );
      setTimeout(() => {
        router.push('/');
      }, 800);
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
      purpose: mode === 'signup' ? 'signup' : 'login',
      fullName: mode === 'signup' ? fullName.trim() : undefined,
      phone: mode === 'signup' && phone ? phone.trim() : undefined,
      mobilepayNumber: mode === 'signup' && mobilepayNumber ? mobilepayNumber.trim() : undefined,
      language: language as 'en' | 'da',
    });

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

  // Instant Demo Mode handler
  const handleDemoMode = async (role: 'admin' | 'collector' | 'member' = 'admin') => {
    setLoading(true);
    setError(null);

    if (role === 'admin') {
      await enterDemoMode();
    } else {
      await switchUserRoleForDemo(role);
    }

    setLoading(false);
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-3.5 py-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-8 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
            <CircleDot className="w-6 h-6 text-emerald-100" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t.auth.signInTitle}
          </h1>
          <p className="text-xs text-slate-500">
            {step === 1 ? t.auth.signInSubtitle : t.auth.enterOtpSubtitle}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up (Visible in Step 1) */}
        {step === 1 && (
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuggestedAction(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
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
                setSuggestedAction(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.auth.signUpTab}</span>
            </button>
          </div>
        )}

        {/* Alerts / Feedback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            {suggestedAction && (
              <button
                type="button"
                onClick={suggestedAction.action}
                className="self-start text-[11px] font-bold text-rose-900 underline hover:text-rose-950 mt-0.5"
              >
                &rarr; {suggestedAction.text}
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Email / Signup Details */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
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
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
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

            {mode === 'signup' && (
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm pl-9"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-base sm:text-sm"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                {t.auth.termsNotice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 text-sm active:scale-[0.99]"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? t.auth.sendingOtp : t.auth.sendOtp}</span>
            </button>
          </form>
        ) : (
          /* STEP 2: Enter 6-Digit Verification Code */
          <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="truncate">
                <span className="text-[11px] text-emerald-800 font-medium block">
                  {t.auth.otpSentTo}:
                </span>
                <span className="font-bold text-slate-900 truncate block text-xs">
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
              <label className="block font-semibold text-slate-700 mb-2 text-center">
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
              <span>{loading ? t.common.loading : mode === 'signup' ? t.auth.verifyAndSignUp : t.auth.verifyAndContinue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Resend Action with live countdown */}
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

        {/* DEMO MODE: Reviewer & Evaluation Access */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Demo Mode (Super Admin)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              umer.web2@gmail.com
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            {t.auth.demoNoticeDesc}
          </p>

          <button
            type="button"
            onClick={() => handleDemoMode('admin')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100/90 text-amber-950 font-semibold text-xs transition-colors shadow-xs"
          >
            <Shield className="w-4 h-4 text-amber-700" />
            <span>{t.auth.demoAdminButton}</span>
          </button>

          {/* Quick Persona Demo Switcher */}
          <div className="pt-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center mb-1.5">
              {t.auth.switchPersona}
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoMode('admin')}
                className="p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 flex flex-col items-center gap-1 font-semibold transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoMode('collector')}
                className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex flex-col items-center gap-1 font-semibold transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Collector</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoMode('member')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex flex-col items-center gap-1 font-semibold transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Member</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
