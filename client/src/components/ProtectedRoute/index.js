'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, isAuthenticated, loading, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (loading) return;

    const hasSession = isAuthenticated || !!token;
    if (!hasSession || !user) {
      if (!hasSession) {
        router.replace('/login');
      }
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, token, user, loading, allowedRoles, router]);

  if (loading || ((isAuthenticated || token) && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-teal-400 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-teal-400"></div>
          <span>Verifying identity...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
