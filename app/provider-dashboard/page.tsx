'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { signOut } from '@/lib/firebase';
import { ProviderBookings } from '@/components/booking/ProviderBookings';
import { ProviderProfile } from '@/types';

export default function ProviderDashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (!loading && user && profile?.role !== 'provider') router.push('/ai-chat');
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  const providerProfile = profile as ProviderProfile;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 max-w-lg mx-auto">
      {/* Header */}
      <div className="glass border-b border-slate-200/50 dark:border-slate-800/50 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Provider Dashboard</p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live notifications
          </p>
        </div>
        <button
          onClick={async () => { await signOut(); router.push('/'); }}
          className="btn-ghost p-2"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-6">
        {/* Provider profile card */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">{profile?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{providerProfile?.skill}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px]">
                  Active
                </span>
                <span className="text-[10px] text-slate-400">{providerProfile?.city}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {providerProfile?.rating?.toFixed(1) || '4.5'}★
              </p>
              <p className="text-[10px] text-slate-400">Rating</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {providerProfile?.completedJobs || 0}
              </p>
              <p className="text-[10px] text-slate-400">Jobs Done</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {providerProfile?.reliability || 95}%
              </p>
              <p className="text-[10px] text-slate-400">Reliability</p>
            </div>
          </div>
        </div>

        {/* Live bookings */}
        <h2 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
          Incoming Bookings
        </h2>
        {user && <ProviderBookings providerId={user.uid} />}
      </div>
    </div>
  );
}
