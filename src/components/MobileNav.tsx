'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { LayoutDashboard, Wallet, Users, HandHeart, FileSpreadsheet } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const links = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/fund', label: t.nav.monthlyFund, icon: Wallet },
    { href: '/members', label: t.nav.members, icon: Users },
    { href: '/volunteers', label: t.nav.volunteers, icon: HandHeart },
    { href: '/reports', label: t.nav.reports, icon: FileSpreadsheet },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
