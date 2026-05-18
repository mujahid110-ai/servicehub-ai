'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Clock, MapPin, Zap, Loader2 } from 'lucide-react';
import { onProviderBookings, updateBookingStatus } from '@/lib/firebase';
import { formatPrice } from '@/lib/pricing';
import { getUrgencyLabel, getUrgencyColor } from '@/lib/antigravity';
import { Booking } from '@/types';

interface Props {
  providerId: string;
}

export function ProviderBookings({ providerId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onProviderBookings(providerId, (b) => {
      setBookings(b);
      setLoading(false);
    });
    return unsub;
  }, [providerId]);

  const handleAction = async (bookingId: string, action: 'accepted' | 'rejected') => {
    setProcessingId(bookingId);
    try {
      await updateBookingStatus(bookingId, action);
      toast.success(action === 'accepted' ? '✅ Booking accepted!' : '❌ Booking rejected');
    } catch {
      toast.error('Failed to update booking');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm text-slate-500 dark:text-slate-400">No pending bookings</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">New bookings will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mb-4">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        {bookings.length} pending booking{bookings.length > 1 ? 's' : ''} — live
      </div>

      <AnimatePresence>
        {bookings.map((booking) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="card p-4"
          >
            {/* Customer & service */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {booking.customerName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{booking.serviceType}</p>
              </div>
              <span className={`badge text-[10px] border ${getUrgencyColor(booking.urgency)}`}>
                {getUrgencyLabel(booking.urgency)}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {booking.preferredTime}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                {booking.city}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                {booking.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">Earnings</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {formatPrice(booking.pricing.total)}
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction(booking.id, 'rejected')}
                disabled={!!processingId}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-red-200 dark:border-red-900 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
              >
                {processingId === booking.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Decline
              </button>
              <button
                onClick={() => handleAction(booking.id, 'accepted')}
                disabled={!!processingId}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {processingId === booking.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Accept
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
