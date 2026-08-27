'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Lock, Bell, CheckCircle } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters')
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const prefsKey = (userId) => `campusfix_notif_prefs_${userId}`;

function loadPrefs(userId) {
  if (typeof window === 'undefined' || !userId) {
    return { inApp: true, emailDigest: false };
  }
  try {
    const raw = localStorage.getItem(prefsKey(userId));
    if (!raw) return { inApp: true, emailDigest: false };
    return { inApp: true, emailDigest: false, ...JSON.parse(raw) };
  } catch {
    return { inApp: true, emailDigest: false };
  }
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [prefsMsg, setPrefsMsg] = useState(null);
  const [prefs, setPrefs] = useState({ inApp: true, emailDigest: false });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' }
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  useEffect(() => {
    if (user?.name) {
      profileForm.reset({ name: user.name });
    }
    if (user?.id) {
      setPrefs(loadPrefs(user.id));
    }
  }, [user, profileForm]);

  const onSaveProfile = async (data) => {
    setProfileMsg(null);
    try {
      const res = await api.put('/auth/profile', { name: data.name });
      if (typeof setUser === 'function') {
        setUser(res.data.user);
      } else {
        useAuthStore.setState({ user: res.data.user });
      }
      setProfileMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({
        type: 'err',
        text: err.response?.data?.error || 'Failed to update profile.'
      });
    }
  };

  const onChangePassword = async (data) => {
    setPasswordMsg(null);
    try {
      await api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      passwordForm.reset();
      setPasswordMsg({ type: 'ok', text: 'Password changed successfully.' });
    } catch (err) {
      setPasswordMsg({
        type: 'err',
        text: err.response?.data?.error || 'Failed to change password.'
      });
    }
  };

  const onSavePrefs = () => {
    if (!user?.id) return;
    localStorage.setItem(prefsKey(user.id), JSON.stringify(prefs));
    setPrefsMsg({ type: 'ok', text: 'Notification preferences saved on this device.' });
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6 font-sans text-slate-200">
          <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
            <p className="text-xs text-slate-400 mt-1">Profile, password, and notification preferences.</p>
          </div>

          <section className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="h-4 w-4 text-teal-400" />
              Profile
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">{user?.email} · {user?.role}</p>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                  Display name
                </label>
                <input
                  {...profileForm.register('name')}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              {profileMsg && (
                <p className={`text-xs font-mono ${profileMsg.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profileMsg.text}
                </p>
              )}
              <button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {profileForm.formState.isSubmitting ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-400" />
              Change password
            </h2>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                  Current password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                  New password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                  Confirm new password
                </label>
                <input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  className="w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              {passwordMsg && (
                <p className={`text-xs font-mono ${passwordMsg.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passwordMsg.text}
                </p>
              )}
              <button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-400" />
              Notification preferences
            </h2>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={prefs.inApp}
                onChange={(e) => setPrefs((p) => ({ ...p, inApp: e.target.checked }))}
                className="rounded border-slate-700"
              />
              In-app notifications (bell)
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={prefs.emailDigest}
                onChange={(e) => setPrefs((p) => ({ ...p, emailDigest: e.target.checked }))}
                className="rounded border-slate-700"
              />
              Email digest (stored preference; email delivery not enabled yet)
            </label>
            {prefsMsg && (
              <p className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {prefsMsg.text}
              </p>
            )}
            <button
              type="button"
              onClick={onSavePrefs}
              className="px-4 py-2 border border-slate-700 hover:border-teal-600 text-slate-200 text-xs font-semibold rounded-lg"
            >
              Save preferences
            </button>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
