'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from './en';
import { da } from './da';

export type Language = 'en' | 'da';
export type Translations = typeof en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date | null | undefined) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Check saved language preference from localStorage or browser cookie
    const saved = localStorage.getItem('circle_fund_lang') as Language;
    if (saved === 'da' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('circle_fund_lang', lang);
    document.cookie = `circle_fund_lang=${lang}; path=/; max-age=31536000`;
  };

  const t = language === 'da' ? da : en;

  // Format currency: 50,00 DKK / 50 DKK according to Danish conventions
  const formatCurrency = (amount: number): string => {
    const locale = language === 'da' ? 'da-DK' : 'en-DK';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format dates: 10. nov. 2026 or 10-11-2026
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    const locale = language === 'da' ? 'da-DK' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
