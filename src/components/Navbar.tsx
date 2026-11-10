'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RoleSwitcher } from './RoleSwitcher';
import {
  CircleDot,
  LayoutDashboard,
  Wallet,
  Users,
  HandHeart,
  FileSpreadsheet,
  History,
  Bell,
  LogOut,
  LogIn,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/fund', label: t.nav.monthlyFund, icon: Wallet },
    { href: '/members', label: t.nav.members, icon: Users },
    { href: '/volunteers', label: t.nav.volunteers, icon: HandHeart },
    { href: '/beneficiaries', label: t.nav.beneficiaries, icon: HandHeart },
    { href: '/reports', label: t.nav.reports, icon: FileSpreadsheet },
    { href: '/audit', label: t.nav.auditLogs, icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                <CircleDot className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Circle Fund
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  Danmark · 50 DKK
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Persona Switcher for testing/demo */}
            <div className="hidden sm:block">
              <RoleSwitcher />
            </div>

            {/* Notifications link */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Session */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-900 truncate max-w-[120px]">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title={t.nav.signOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.signIn}</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Switch Test Role:</span>
            <RoleSwitcher />
          </div>
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">{user.fullName}</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-rose-600 font-medium px-2 py-1 rounded-md hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.signOut}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
