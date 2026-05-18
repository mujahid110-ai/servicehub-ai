'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, Home, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SuccessPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    // Dynamic import confetti to avoid SSR issues
    const fireConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.4 },
        colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#f97316', '#22c55e'],
      });
    };
    setTimeout(fireConfetti, 300);
  }, []);

  const handleRate = (r: number) => {
    setRating(r);
    setRated(true);
  };

  const getRatingLabel = (r: number) => {
    const labels: Record<number, string> = {
      5: 'Excellent! 🌟',
      4: 'Great! 😊',
      3: 'Good 👍',
      2: 'Fair 😐',
      1: 'Poor 😕',
    };
    return labels[r] || 'Tap to rate';
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm"
      >
        {/* Success icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-lg"
            >
              <span className="text-white text-sm">✓</span>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Service Completed! 🎉
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Your booking has been completed successfully. Thank you for using ServiceHub AI!
          </p>
        </motion.div>

        {/* Rating card */}
        {!rated ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-5 mb-4 text-center"
          >
            <p className="font-semibold text-slate-900 dark:text-white mb-1">Rate Your Experience</p>
            <p className="text-xs text-slate-400 mb-4">How was the service?</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRate(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 h-4">
              {getRatingLabel(hoverRating || rating)}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-5 mb-4 text-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700'}`}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Thanks for your rating! ❤️
            </p>
          </motion.div>
        )}

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <button
            onClick={() => router.push('/ai-chat')}
            className="btn-primary w-full py-3"
          >
            <MessageSquare className="w-4 h-4" />
            Book Another Service
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-secondary w-full py-3"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </motion.div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ServiceHub AI — Pakistan&apos;s Trusted Service Platform
        </p>
      </motion.div>
    </div>
  );
}
