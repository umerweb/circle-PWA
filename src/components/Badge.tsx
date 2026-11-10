import React from 'react';

interface BadgeProps {
  status: 'pending' | 'reported' | 'confirmed' | 'exempt' | 'active' | 'suspended' | 'invited' | 'approved' | 'rejected' | 'draft' | 'published' | 'demo';
  label?: string;
  className?: string;
}

export function Badge({ status, label, className = '' }: BadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'confirmed':
      case 'active':
      case 'approved':
      case 'published':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'reported':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'pending':
      case 'draft':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'exempt':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'suspended':
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'demo':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()} ${className}`}
    >
      {label || status}
    </span>
  );
}
