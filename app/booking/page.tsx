'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Clock, CheckCircle2, XCircle, Loader2, ArrowLeft,
  Star, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  onBookingRealtime, updateBookingStatus, rejectAndReassign,
  onProvidersRealtime
} from '@/lib/firebase';
import { matchProviders } from '@/lib/matching';
import { formatPrice } from '@/lib/pricing';
import { getUrgencyLabel, getUrgencyColor } from '@/lib/antigravity';
import { Booking, ProviderProfile, ServiceRequest } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: React.ReactNode; label: string; classes: string }> = {
    pending: {
      icon: <Clock className="w-4 h-4 animate-pulse" />,
      label: 'Waiting for Provider',
      classes: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    },
    accepted: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: 'Confirmed!',
      classes: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    },
    rejected: {
      icon: <XCircle className="w-4 h-4" />,
      label: 'Looking for next provider...',
      classes: 'text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    },
    in_progress: {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'In Progress',
      classes: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    },
    completed: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: 'Completed',
      classes: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    },
    cancelled: {
      icon: <XCircle className="w-4 h-4" />,
      label: 'Cancelled',
      classes: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    },
  };

  const cfg = configs[status] || configs.pending;
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-medium text-sm ${cfg.classes}`}>
      {cfg.icon} {cfg.label}
    </div>
  );
}

function BookingContent() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [allProviders, setAllProviders] = useState<ProviderProfile[]>([]);
  const [isReassigning, setIsReassigning] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!bookingId) { router.push('/ai-chat'); return; }

    const unsub = onBookingRealtime(bookingId, (b) => {
      if (b) {
        // Detect status changes
        if (prevStatus && prevStatus !== b.status) {
          if (b.status === 'accepted') toast.success('🎉 Provider accepted your booking!');
          else if (b.status === 'rejected') toast.error('Provider rejected. Finding next best match...');
          else if (b.status === 'completed') {
            toast.success('✅ Service completed!');
            setTimeout(() => router.push('/success'), 1500);
          }
        }
        setPrevStatus(b.status);
        setBooking(b);
      }
      setBookingLoading(false);
    });

    return unsub;
  }, [bookingId, router]);

  // Load providers for reassignment
  useEffect(() => {
    if (!booking) return;
    const unsub = onProvidersRealtime(booking.serviceType, (p) => setAllProviders(p));
    return unsub;
  }, [booking?.serviceType]);

  // Auto-reassign if rejected
  useEffect(() => {
    if (booking?.status !== 'rejected' || isReassigning) return;

    const doReassign = async () => {
      setIsReassigning(true);
      await new Promise((r) => setTimeout(r, 2000)); // Brief delay

      const request: ServiceRequest = {
        rawMessage: booking.description,
        serviceType: booking.serviceType,
        urgency: booking.urgency,
        preferredTime: booking.preferredTime,
        description: booking.description,
        language: 'english',
        city: booking.city,
      };

      const excluded = [...(booking.rejectedProviders || []), booking.providerId];
      const matches = matchProviders(allProviders, request, excluded);

      if (matches.length > 0) {
        await rejectAndReassign(booking.id, booking.providerId, matches[0]);
        toast.success(`Assigned to ${matches[0].provider.name}!`);
      } else {
        toast.error('No more providers available. Please try again later.');
        await updateBookingStatus(booking.id, 'cancelled', 'No providers available');
        router.push('/ai-chat');
      }
      setIsReassigning(false);
    };

    doReassign();
  }, [booking?.status, allProviders]);

  // Simulate provider accepting the booking
  useEffect(() => {
    if (booking?.status === 'pending') {
      // Simulate a 4-second delay before the provider "accepts" the job
      const timer = setTimeout(async () => {
        try {
          await updateBookingStatus(booking.id, 'accepted');
        } catch (error) {
          console.error('Simulation error:', error);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [booking?.status, booking?.id]);

  if (loading || bookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="font-semibold mb-2">Booking not found</h2>
          <button onClick={() => router.push('/ai-chat')} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Header */}
      <div className="glass border-b border-slate-200/50 dark:border-slate-800/50 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/ai-chat')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-sm">Booking #{booking.id.slice(-6).toUpperCase()}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live updates
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status */}
        <motion.div
          key={booking.status}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-6"
        >
          {booking.status === 'pending' && (
            <div className="w-16 h-16 rounded-full border-4 border-amber-300 border-t-amber-500 animate-spin mb-4" />
          )}
          {booking.status === 'accepted' && (
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          )}
          {(booking.status === 'rejected' || isReassigning) && (
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          )}
          <StatusBadge status={isReassigning ? 'rejected' : booking.status} />
          {booking.status === 'pending' && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Waiting for {booking.providerName} to respond...
            </p>
          )}
        </motion.div>

        {/* Provider card */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Provider
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
              {booking.providerName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{booking.providerName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{booking.providerSkill}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">4.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service details */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Service Details
          </p>
          <div className="space-y-2.5">
            <Row label="Service" value={booking.serviceType} />
            <Row label="Urgency" value={<span className={`badge text-xs border ${getUrgencyColor(booking.urgency)}`}>{getUrgencyLabel(booking.urgency)}</span>} />
            <Row label="Preferred Time" value={booking.preferredTime} />
            <Row label="City" value={booking.city} />
            <Row label="Description" value={booking.description} small />
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Pricing
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Base Fee</span>
              <span>{formatPrice(booking.pricing.baseFee)}</span>
            </div>
            {booking.pricing.urgencyFee !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Urgency Fee</span>
                <span className={booking.pricing.urgencyFee > 0 ? 'text-red-500' : 'text-emerald-500'}>
                  {booking.pricing.urgencyFee > 0 ? '+' : ''}{formatPrice(booking.pricing.urgencyFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Travel Fee</span>
              <span>{formatPrice(booking.pricing.distanceFee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-600 dark:text-brand-400 text-lg">
                {formatPrice(booking.pricing.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {booking.status === 'accepted' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <button
              onClick={async () => {
                await updateBookingStatus(booking.id, 'completed');
              }}
              className="btn-primary w-full py-3"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Completed
            </button>
          </motion.div>
        )}

        {booking.status === 'pending' && (
          <button
            onClick={async () => {
              await updateBookingStatus(booking.id, 'cancelled', 'Cancelled by customer');
              toast.success('Booking cancelled');
              router.push('/ai-chat');
            }}
            className="btn-secondary w-full py-3 text-red-500 border-red-200 dark:border-red-900"
          >
            Cancel Booking
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className={`text-slate-500 dark:text-slate-400 flex-shrink-0 ${small ? 'text-xs' : 'text-sm'}`}>
        {label}
      </span>
      <span className={`text-right text-slate-900 dark:text-white font-medium ${small ? 'text-xs' : 'text-sm'}`}>
        {value}
      </span>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
