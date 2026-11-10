'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { ShieldCheck, UserCheck, User } from 'lucide-react';

export function RoleSwitcher() {
  const { user, switchUserRoleForDemo } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 text-xs">
      <span className="text-slate-500 font-medium px-1.5 hidden sm:inline">Role:</span>
      <button
        onClick={() => switchUserRoleForDemo('admin')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          user.role === 'admin'
            ? 'bg-emerald-700 text-white font-medium shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
        }`}
        title="View as Admin (umer.web2@gmail.com)"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Admin</span>
      </button>
      <button
        onClick={() => switchUserRoleForDemo('collector')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          user.role === 'collector'
            ? 'bg-emerald-700 text-white font-medium shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
        }`}
        title="View as Current Collector (Demo Member 1)"
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Collector</span>
      </button>
      <button
        onClick={() => switchUserRoleForDemo('member')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          user.role === 'member'
            ? 'bg-emerald-700 text-white font-medium shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
        }`}
        title="View as Member (Demo Member 2)"
      >
        <User className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Member</span>
      </button>
    </div>
  );
}
