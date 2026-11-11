'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'collector' | 'member';
  status: 'active' | 'invited' | 'suspended';
  phone?: string;
  mobilepayNumber?: string;
  isDemo?: boolean;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchUserRoleForDemo: (role: 'admin' | 'collector' | 'member') => Promise<void>;
  enterDemoMode: () => Promise<{ success: boolean; error?: string }>;
  requestOtp: (params: {
    email: string;
    purpose: 'login' | 'signup';
    fullName?: string;
    phone?: string;
    mobilepayNumber?: string;
    language?: 'en' | 'da';
  }) => Promise<{
    success: boolean;
    error?: string;
    cooldownSeconds?: number;
    notRegistered?: boolean;
    alreadyRegistered?: boolean;
    suspended?: boolean;
  }>;
  verifyOtp: (params: {
    email: string;
    otpCode: string;
    purpose?: 'login' | 'signup';
  }) => Promise<{
    success: boolean;
    error?: string;
    user?: UserProfile;
    expired?: boolean;
    maxAttemptsReached?: boolean;
    remainingAttempts?: number;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session profile on load
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const enterDemoMode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoMode: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to enter demo mode' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  // Helper for evaluation / demo to test all 3 personas (Admin, Collector, Member)
  const switchUserRoleForDemo = async (role: 'admin' | 'collector' | 'member') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (params: {
    email: string;
    purpose: 'login' | 'signup';
    fullName?: string;
    phone?: string;
    mobilepayNumber?: string;
    language?: 'en' | 'da';
  }) => {
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Failed to send verification code',
          cooldownSeconds: data.cooldownRemaining,
          notRegistered: data.notRegistered,
          alreadyRegistered: data.alreadyRegistered,
          suspended: data.suspended,
        };
      }
      return { success: true, cooldownSeconds: data.cooldownSeconds || 60 };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const verifyOtp = async (params: {
    email: string;
    otpCode: string;
    purpose?: 'login' | 'signup';
  }) => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Failed to verify code',
          expired: data.expired,
          maxAttemptsReached: data.maxAttemptsReached,
          remainingAttempts: data.remainingAttempts,
        };
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        switchUserRoleForDemo,
        enterDemoMode,
        requestOtp,
        verifyOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
