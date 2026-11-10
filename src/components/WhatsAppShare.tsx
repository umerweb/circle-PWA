'use client';

import React from 'react';
import { Share2 } from 'lucide-react';

interface WhatsAppShareProps {
  collectorName?: string;
  mobilepayNumber?: string;
  monthTitle?: string;
  amount?: number;
  label?: string;
}

export function WhatsAppShare({
  collectorName = 'Circle Fund Collector',
  mobilepayNumber = '+45 52 34 56 78',
  monthTitle = 'Current Month',
  amount = 50,
  label = 'Share via WhatsApp',
}: WhatsAppShareProps) {
  const handleShare = () => {
    const text = encodeURIComponent(
      `🇩🇰 Circle Fund (${monthTitle})\n` +
      `Månedligt bidrag: ${amount} DKK\n` +
      `Månedens indsamler: ${collectorName}\n` +
      `MobilePay: ${mobilepayNumber}\n` +
      `Note ved overførsel: CF-[DitNavn]\n\n` +
      `Husk at registrere din indbetaling i Circle Fund appen: https://circle-fund.vercel.app`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-medium transition-colors"
      title="Share payment instructions with community on WhatsApp"
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
