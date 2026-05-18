'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Star, MapPin, Clock, Shield,
  ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { onProvidersRealtime, createBooking } from '@/lib/firebase';
import { matchProviders, getMatchLabel, getMatchColor } from '@/lib/matching';
import { formatPrice } from '@/lib/pricing';
import { getUrgencyColor, getUrgencyLabel } from '@/lib/antigravity';
import { ServiceRequest, ProviderMatch, ProviderProfile } from '@/types';

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="flex gap-2">
        <div className="skeleton h-8 flex-1 rounded-lg" />
        <div className="skeleton h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProvidersPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [allProviders, setAllProviders] = useState<ProviderProfile[]>([]);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem('serviceRequest');
    if (stored) {
      setServiceRequest(JSON.parse(stored));
    } else {
      router.push('/ai-chat');
    }
  }, [router]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Real-time provider listener
  useEffect(() => {
    if (!serviceRequest) return;

    setIsLoading(true);
    setFetchError(null);
    const unsub = onProvidersRealtime(serviceRequest.serviceType, (providers, error) => {
      if (error) {
        setFetchError(error.message);
      }
      setAllProviders(providers);
      const matched = matchProviders(providers, serviceRequest);
      setMatches(matched.slice(0, 6));
      setIsLoading(false);
    });

    return unsub;
  }, [serviceRequest]);

  const handleBook = async (match: ProviderMatch) => {
    if (!user || !serviceRequest || isBooking) {
      if (!user) toast.error('Please log in to book a service.');
      return;
    }
    
    setSelectedProvider(match.provider.uid);
    setIsBooking(true);

    try {
      const id = await createBooking({
        customerId: user.uid,
        customerName: profile?.name || user.displayName || 'Customer',
        providerId: match.provider.uid,
        providerName: match.provider.name,
        providerSkill: match.provider.skill,
        serviceType: serviceRequest.serviceType,
        description: serviceRequest.description,
        urgency: serviceRequest.urgency,
        preferredTime: serviceRequest.preferredTime,
        status: 'pending',
        pricing: match.pricing,
        city: serviceRequest.city || match.provider.city,
        rejectedProviders: [],
      });

      sessionStorage.setItem('bookingId', id);
      sessionStorage.setItem('bookingData', JSON.stringify({
        id,
        providerName: match.provider.name,
        providerSkill: match.provider.skill,
        serviceType: serviceRequest.serviceType,
        pricing: match.pricing,
        urgency: serviceRequest.urgency,
        preferredTime: serviceRequest.preferredTime,
        estimatedArrival: match.estimatedArrival,
      }));

      toast.success('Booking created! Waiting for provider...');
      router.push(`/booking?id=${id}`);
    } catch (err) {
      toast.error('Failed to create booking. Please try again.');
      console.error(err);
    } finally {
      setIsBooking(false);
      setSelectedProvider(null);
    }
  };

  if (loading || !serviceRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
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
          <p className="font-semibold text-sm">Provider Results</p>
          <p className="text-[10px] text-slate-400">
            {isLoading ? 'Searching...' : `${matches.length} providers found`}
          </p>
        </div>
        <button
          onClick={() => {
            const matched = matchProviders(allProviders, serviceRequest);
            setMatches(matched.slice(0, 6));
            toast.success('Refreshed!');
          }}
          className="ml-auto btn-ghost p-2"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Request summary */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Your Request
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50 text-xs">
              🔧 {serviceRequest.serviceType}
            </span>
            <span className={`badge border text-xs ${getUrgencyColor(serviceRequest.urgency)}`}>
              {getUrgencyLabel(serviceRequest.urgency)}
            </span>
            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
              🕐 {serviceRequest.preferredTime}
            </span>
            {serviceRequest.city && (
              <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                📍 {serviceRequest.city}
              </span>
            )}
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live results — updating in real-time
        </div>

        {/* Provider cards */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="card p-8 text-center">
            {fetchError ? (
              <>
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">Database Error</h3>
                <p className="text-sm text-slate-500 mb-4 px-4">{fetchError}</p>
                <p className="text-xs text-slate-400 mb-4">Please check your Firebase Firestore rules or indexes.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No providers found</h3>
                <p className="text-sm text-slate-400">Try a different city or service type</p>
              </>
            )}
            <button
              onClick={() => router.push('/ai-chat')}
              className="btn-primary mt-4 text-sm"
            >
              Modify Request
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {matches.map((match, idx) => (
              <motion.div
                key={match.provider.uid}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="provider-card"
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {match.provider.name?.[0]?.toUpperCase() || 'P'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {match.provider.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{match.provider.skill}</p>
                      </div>
                      <span className={`badge text-[10px] ${getMatchColor(match.matchScore)}`}>
                        {getMatchLabel(match.matchScore)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{match.provider.rating?.toFixed(1) || '4.5'}</span>
                    <span className="text-slate-300 dark:text-slate-600">({match.provider.totalReviews || 0})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    <span className="truncate">{match.provider.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{match.provider.reliability || 95}%</span>
                  </div>
                </div>

                {/* Experience & availability */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                    {match.provider.experience || 0}y exp
                  </span>
                  <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                    {match.provider.completedJobs || 0} jobs
                  </span>
                  {match.provider.availability?.slice(0, 2).map((slot) => (
                    <span key={slot} className="badge bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px]">
                      {slot.split(' ')[0]}
                    </span>
                  ))}
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatPrice(match.pricing.total)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Base: {formatPrice(match.pricing.baseFee)}
                      {match.pricing.urgencyFee > 0 && ` + Urgency: ${formatPrice(match.pricing.urgencyFee)}`}
                      + Travel: {formatPrice(match.pricing.distanceFee)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px]">{match.estimatedArrival}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBook(match)}
                  disabled={isBooking}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {isBooking && selectedProvider === match.provider.uid ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                  ) : (
                    <>Book {match.provider.name.split(' ')[0]} <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
