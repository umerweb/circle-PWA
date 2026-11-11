'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
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
  ChevronDown,
  ShieldCheck,
  UserCheck,
  User,
  MoreHorizontal,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, signOut, switchUserRoleForDemo } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [pathname]);

  // Close dropdowns on route change or click outside
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary navigation visible on desktop
  const primaryLinks = [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/fund', label: t.nav.monthlyFund, icon: Wallet },
    { href: '/members', label: t.nav.members, icon: Users },
    { href: '/reports', label: t.nav.reports, icon: FileSpreadsheet },
  ];

  // Secondary navigation in "More" dropdown
  const secondaryLinks = [
    { href: '/beneficiaries', label: t.nav.beneficiaries, icon: HandHeart },
    { href: '/volunteers', label: t.nav.volunteers, icon: HandHeart },
    { href: '/audit', label: t.nav.auditLogs, icon: History },
  ];

  const allNavLinks = [...primaryLinks, ...secondaryLinks];

  const isSecondaryActive = secondaryLinks.some((l) => pathname === l.href);

  const getInitials = (name?: string) => {
    if (!name) return 'CF';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-4 xl:gap-8 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                <CircleDot className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Circle Fund
                </span>
                <span className="hidden md:block text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  Danmark · 50 DKK
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryLinks.map((link) => {
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

              {/* "More" Dropdown for Secondary Navigation */}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSecondaryActive
                      ? 'bg-slate-100 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span>More</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-scale-up">
                    {secondaryLinks.map((link) => {
                      const isActive = pathname === link.href;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Section: Compact Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notification Bell */}
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

            {/* Logged in User Profile Dropdown */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-50 transition-colors"
                  aria-label="User profile menu"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="hidden sm:block text-left max-w-[100px] xl:max-w-[130px]">
                    <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                      {user.fullName}
                    </p>
                    <span className="text-[10px] text-emerald-800 font-medium uppercase tracking-wider block">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-scale-up">
                    {/* User Identity Info */}
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          {user.role}
                        </span>
                        {user.isDemo && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                            demo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Demonstration Switcher (only for demo admin / demo accounts) */}
                    {(user.isDemo || user.email === 'umer.web2@gmail.com') && (
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                          Switch Test Persona
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              switchUserRoleForDemo('admin');
                              setProfileDropdownOpen(false);
                            }}
                            className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-900 font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mb-0.5 text-purple-700" />
                            <span>Admin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchUserRoleForDemo('collector');
                              setProfileDropdownOpen(false);
                            }}
                            className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                              user.role === 'collector'
                                ? 'bg-emerald-100 text-emerald-900 font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5 mb-0.5 text-emerald-700" />
                            <span>Collector</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              switchUserRoleForDemo('member');
                              setProfileDropdownOpen(false);
                            }}
                            className={`flex flex-col items-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                              user.role === 'member'
                                ? 'bg-slate-200 text-slate-900 font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <User className="w-3.5 h-3.5 mb-0.5 text-slate-600" />
                            <span>Member</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sign Out */}
                    <div className="px-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.nav.signOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.signIn}</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 ml-0.5"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl">
          {/* User info if logged in */}
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {user.role}
                </span>
              </div>

              {/* Persona Switcher inside Mobile Drawer (only for demo admin / demo accounts) */}
              {(user.isDemo || user.email === 'umer.web2@gmail.com') && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Switch Persona (Demo)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        switchUserRoleForDemo('admin');
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        user.role === 'admin'
                          ? 'bg-purple-700 text-white border-purple-700 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                    <button
                      onClick={() => {
                        switchUserRoleForDemo('collector');
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        user.role === 'collector'
                          ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Collector</span>
                    </button>
                    <button
                      onClick={() => {
                        switchUserRoleForDemo('member');
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        user.role === 'member'
                          ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Member</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation links */}
          <nav className="space-y-1">
            {allNavLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

          {/* Sign Out in Mobile menu */}
          {user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.signOut}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
