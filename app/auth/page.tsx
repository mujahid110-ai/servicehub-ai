'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Sparkles, ArrowLeft, User, Briefcase, Loader2
} from 'lucide-react';
import { registerUser, loginUser } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { SERVICE_CATEGORIES, AVAILABILITY_OPTIONS, PAKISTAN_CITIES } from '@/types';

type Mode = 'login' | 'register';
type Role = 'customer' | 'provider';

function AuthContent() {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    skill: '', city: '', experience: '',
    bio: '', availability: [] as string[],
  });

  useEffect(() => {
    if (searchParams.get('role') === 'provider') {
      setRole('provider');
      setMode('register');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) router.push('/ai-chat');
  }, [user, profile, router]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const toggleAvailability = (slot: string) => {
    setForm((p) => ({
      ...p,
      availability: p.availability.includes(slot)
        ? p.availability.filter((s) => s !== slot)
        : [...p.availability, slot],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!form.name) { toast.error('Name is required'); setLoading(false); return; }
        if (role === 'provider' && (!form.skill || !form.city)) {
          toast.error('Skill and city are required for providers');
          setLoading(false); return;
        }

        await registerUser(form.email, form.password, form.name, role, {
          skill: form.skill,
          city: form.city,
          experience: parseInt(form.experience) || 0,
          availability: form.availability,
          bio: form.bio,
        });
        toast.success(`Welcome to ServiceHub AI! 🎉`);
      } else {
        await loginUser(form.email, form.password);
        toast.success('Welcome back!');
      }
      router.push('/ai-chat');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('email-already-in-use')) toast.error('Email already registered');
      else if (msg.includes('user-not-found') || msg.includes('wrong-password')) toast.error('Invalid email or password');
      else if (msg.includes('weak-password')) toast.error('Password must be at least 6 characters');
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Link href="/" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">ServiceHub AI</span>
        </div>
      </div>

      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mode toggle */}
          <div className="card p-1 flex mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="card p-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {mode === 'login'
                ? 'Sign in to your ServiceHub account'
                : 'Join Pakistan\'s AI service platform'}
            </p>

            {/* Role selector (register only) */}
            {mode === 'register' && (
              <div className="mb-5">
                <label className="label">I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'customer', icon: <User className="w-4 h-4" />, label: 'Customer' },
                    { id: 'provider', icon: <Briefcase className="w-4 h-4" />, label: 'Technician / Provider' },
                  ] as { id: Role; icon: React.ReactElement; label: string }[]).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        role === r.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    placeholder="Ahmed Ali"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="label">Email *</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Provider-specific fields */}
              <AnimatePresence>
                {mode === 'register' && role === 'provider' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Provider Details
                      </p>
                    </div>

                    <div>
                      <label className="label">Skill / Service Category *</label>
                      <select
                        className="input"
                        value={form.skill}
                        onChange={(e) => update('skill', e.target.value)}
                        required
                      >
                        <option value="">Select service...</option>
                        {SERVICE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">City *</label>
                        <select
                          className="input"
                          value={form.city}
                          onChange={(e) => update('city', e.target.value)}
                          required
                        >
                          <option value="">Select city...</option>
                          {PAKISTAN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Experience (years)</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="50"
                          placeholder="0"
                          value={form.experience}
                          onChange={(e) => update('experience', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Availability</label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABILITY_OPTIONS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleAvailability(slot)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                              form.availability.includes(slot)
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="label">Bio (optional)</label>
                      <textarea
                        className="input resize-none h-20 text-sm"
                        placeholder="Tell customers about your experience..."
                        value={form.bio}
                        onChange={(e) => update('bio', e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
            By continuing, you agree to our{' '}
            <span className="text-brand-600">Terms of Service</span> and{' '}
            <span className="text-brand-600">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    }>
      <AuthContent />
    </React.Suspense>
  );
}
