'use client';

import React from 'react';
import { useI18n, Language } from '@/lib/i18n/context';

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium text-slate-700 shadow-sm">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          language === 'en'
            ? 'bg-slate-900 text-white font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('da')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          language === 'da'
            ? 'bg-slate-900 text-white font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        aria-label="Skift til dansk"
      >
        DA
      </button>
    </div>
  );
}
