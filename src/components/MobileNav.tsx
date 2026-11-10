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
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1.5 rounded-xl text-[10px] font-medium transition-all active:scale-95 ${
                isActive
                  ? 'text-emerald-800 font-bold bg-emerald-50/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-transform ${
                  isActive ? 'text-emerald-700 scale-110' : 'text-slate-400'
                }`}
              />
              <span className="truncate max-w-[62px] text-center tracking-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
