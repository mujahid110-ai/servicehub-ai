'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Send,
  Sparkles,
  Loader2,
  MapPin,
  LogOut,
  User,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { parseServiceRequest } from '@/lib/gemini';
import { parseIntent } from '@/lib/antigravity';
import { signOut } from '@/lib/firebase';

import {
  ChatMessage,
  ServiceRequest,
  PAKISTAN_CITIES,
} from '@/types';

const QUICK_PROMPTS = [
  'AC repair kal morning chahiye',
  'Plumber abhi chahiye, pipe leak',
  'Electrician today afternoon',
  'House cleaning this weekend',
];

type GeminiHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export default function AiChatPage() {
  const { user, profile, loading } = useAuth();

  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [parsedRequest, setParsedRequest] =
    useState<ServiceRequest | null>(null);

  const [geminiHistory, setGeminiHistory] = useState<GeminiHistoryItem[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // Initial greeting
  useEffect(() => {
    if (user && profile && messages.length === 0) {
      const greeting =
        profile.role === 'provider'
          ? `Welcome back, ${profile.name}! 👋 As a provider, you can view your bookings in real-time. Customers will contact you for your ${(profile as any).skill || 'services'}.`
          : `Hello ${profile.name}! 👋

Main ServiceHub AI hun. Aapko kya service chahiye?

You can type in English, Urdu, or Roman Urdu.

Example:
• AC repair kal morning
• Plumber abhi chahiye`;

      setMessages([
        {
          id: 'welcome-message',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [user, profile, messages.length]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();

    if (!msg || isTyping) return;

    setInput('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);

    try {
      // Timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 15000);
      });

      const newHistory: GeminiHistoryItem[] = [
        ...geminiHistory,
        {
          role: 'user',
          parts: [{ text: msg }],
        },
      ];

      // Gemini request
      const geminiPromise = parseServiceRequest(msg, newHistory);

      const result = (await Promise.race([
        geminiPromise,
        timeoutPromise,
      ])) as {
        request: ServiceRequest;
        confirmationMessage: string;
      };

      let finalRequest: ServiceRequest = {
        ...result.request,
        city: selectedCity || undefined,
      };

      // If the user already asked for a specific service and the new message is conversational 
      // (resulting in General Service), keep the previous specific service type.
      setParsedRequest((prevReq) => {
        if (
          prevReq &&
          prevReq.serviceType !== 'General Service' &&
          finalRequest.serviceType === 'General Service'
        ) {
          finalRequest = {
            ...finalRequest,
            serviceType: prevReq.serviceType,
            urgency: prevReq.urgency !== 'medium' ? prevReq.urgency : finalRequest.urgency,
          };
        }
        return finalRequest;
      });

      // Save Gemini history
      setGeminiHistory([
        ...newHistory,
        {
          role: 'model',
          parts: [
            {
              text: result.confirmationMessage,
            },
          ],
        },
      ]);

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: result.confirmationMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setParsedRequest(finalRequest);
    } catch (error) {
      console.error('AI Chat Error:', error);

      // Local fallback
      const parsed = parseIntent(msg);

      const fallbackRequest: ServiceRequest = {
        rawMessage: msg,
        serviceType: parsed.serviceType,
        urgency: parsed.urgency,
        preferredTime: parsed.preferredTime,
        description: msg,
        language: parsed.detectedLanguage,
        city: selectedCity || undefined,
      };

      setParsedRequest(fallbackRequest);

      const fallbackMessage: ChatMessage = {
        id: `${Date.now()}-fallback`,
        role: 'assistant',
        content: `Got it! Looking for ${fallbackRequest.serviceType} providers${selectedCity ? ` in ${selectedCity}` : ''
          }.

Preferred time: ${fallbackRequest.preferredTime}.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);

      toast.success('Using offline AI fallback');
    } finally {
      setIsTyping(false);
    }
  };

  const proceedToProviders = () => {
    if (!parsedRequest) {
      toast.error('Please describe your service need first');
      return;
    }

    if (!selectedCity) {
      toast.error('Please select your city');
      return;
    }

    sessionStorage.setItem(
      'serviceRequest',
      JSON.stringify({
        ...parsedRequest,
        city: selectedCity,
      })
    );

    router.push('/providers');
  };

  // Main loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="glass border-b border-slate-200/50 dark:border-slate-800/50 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">
            ServiceHub AI
          </p>

          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Always online
          </p>
        </div>

        {profile && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:block">
                {profile.name}
              </span>
            </div>

            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="btn-ghost p-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* City Selector */}
      <div className="px-4 py-2 bg-white dark:bg-surface-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />

          <select
            className="flex-1 text-sm bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">Select your city...</option>

            {PAKISTAN_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user'
                ? 'justify-end'
                : 'justify-start'
                }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div
                className={
                  msg.role === 'user'
                    ? 'chat-bubble-user'
                    : 'chat-bubble-ai'
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {msg.content}
                </p>

                <p
                  className={`text-[10px] mt-1 ${msg.role === 'user'
                    ? 'text-blue-200'
                    : 'text-slate-400'
                    }`}
                >
                  {msg.timestamp.toLocaleTimeString('en-PK', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>

              <div className="chat-bubble-ai">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 &&
        (!profile || profile.role !== 'provider') && (
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-400 mb-2">
              Quick prompts:
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Parsed Request */}
      <AnimatePresence>
        {parsedRequest &&
          (!profile || profile.role !== 'provider') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-4 mb-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    ✓ Request Ready
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      {parsedRequest.serviceType}
                    </span>

                    <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      {parsedRequest.urgency}
                    </span>

                    <span className="badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      {parsedRequest.preferredTime}
                    </span>
                  </div>
                </div>

                <button
                  onClick={proceedToProviders}
                  className="btn-primary text-xs py-2 px-3 flex-shrink-0"
                >
                  Find Providers
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 pb-safe pb-4 pt-2 bg-white dark:bg-surface-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="input flex-1 pr-4"
            placeholder="Describe your service need..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={
              isTyping || profile?.role === 'provider'
            }
          />

          <button
            onClick={() => sendMessage()}
            disabled={
              !input.trim() ||
              isTyping ||
              profile?.role === 'provider'
            }
            className="btn-primary p-3 flex-shrink-0 disabled:opacity-50"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {profile?.role === 'provider' && (
          <p className="text-xs text-slate-400 text-center mt-2">
            Provider mode — customers will book your services
          </p>
        )}
      </div>
    </div>
  );
}