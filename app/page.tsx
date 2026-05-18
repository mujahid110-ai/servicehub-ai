'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Star, ArrowRight, MessageSquare,
  Wrench, Droplets, Bolt, Paintbrush, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const SERVICES = [
  { icon: '❄️', name: 'AC Repair', time: '30 min' },
  { icon: '🔧', name: 'Plumbing', time: '45 min' },
  { icon: '⚡', name: 'Electrical', time: '20 min' },
  { icon: '🪣', name: 'Cleaning', time: '1 hr' },
  { icon: '🪚', name: 'Carpentry', time: '1 hr' },
  { icon: '🎨', name: 'Painting', time: '2 hr' },
];

const FEATURES = [
  { icon: <MessageSquare className="w-5 h-5" />, title: 'AI Chat Booking', desc: 'Describe your problem in English, Urdu, or Roman Urdu' },
  { icon: <Zap className="w-5 h-5" />, title: 'Instant Matching', desc: 'Real-time provider matching based on skill, rating & location' },
  { icon: <Shield className="w-5 h-5" />, title: 'Verified Providers', desc: 'All technicians are verified, rated, and background checked' },
];

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      router.push('/ai-chat');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">ServiceHub AI</span>
          </div>
          <Link href="/auth" className="btn-primary text-xs px-4 py-2">
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-hero">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 text-xs font-medium border border-brand-200/50 dark:border-brand-800/50 mb-6">
              <Sparkles className="w-3 h-3" /> Powered by Gemini AI
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
              Book Any Service,{' '}
              <span className="text-gradient">Just Describe It</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8">
              AI-powered platform connects you to trusted technicians in Pakistan.
              Type in Urdu, Roman Urdu, or English — we understand it all.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth" className="btn-primary px-6 py-3 text-base">
                Book a Service <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth?role=provider" className="btn-secondary px-6 py-3 text-base">
                Join as Provider
              </Link>
            </div>
          </motion.div>

          {/* AI Chat Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 card p-4 max-w-sm mx-auto text-left shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">ServiceHub AI</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </span>
            </div>
            <div className="space-y-2.5">
              <div className="chat-bubble-ai text-sm">
                Aapko kya service chahiye? 👋
              </div>
              <div className="chat-bubble-user text-sm">
                AC repair kal morning chahiye
              </div>
              <div className="chat-bubble-ai text-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium text-xs">Request parsed!</span>
                </div>
                AC Repair · Tomorrow · Morning · 3 providers found ✨
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-6">
            Popular Services
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="card p-3 text-center hover:shadow-md transition-all cursor-pointer hover:border-brand-200 dark:hover:border-brand-700"
              >
                <div className="text-2xl mb-1.5">{s.icon}</div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{s.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">~{s.time}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 bg-white dark:bg-surface-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-8">
            Why ServiceHub AI?
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="card p-5"
              >
                <div className="w-9 h-9 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: '500+', label: 'Providers' },
            { value: '10K+', label: 'Bookings' },
            { value: '4.8★', label: 'Rating' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Join thousands of customers booking services through AI.
          </p>
          <Link href="/auth" className="btn-primary px-8 py-3 text-base">
            Start Booking Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center">
        <p className="text-xs text-slate-400">
          © 2024 ServiceHub AI · Built with Next.js, Firebase & Gemini AI
        </p>
      </footer>
    </div>
  );
}
