'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const { language } = useI18n();

  useEffect(() => {
    // Register service worker if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker registered with scope:', reg.scope))
        .catch((err) => console.log('Service Worker registration failed:', err));
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if dismissed previously
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white border border-emerald-200 shadow-xl rounded-xl p-3.5 z-50 flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
          CF
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-900">
            {language === 'da' ? 'Installer Circle Fund' : 'Install Circle Fund App'}
          </p>
          <p className="text-[11px] text-slate-500">
            {language === 'da'
              ? 'Få hurtig adgang og offline support på din telefon'
              : 'Add to home screen for instant mobile access'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'da' ? 'Installer' : 'Install'}</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
