/**
 * Antigravity — Zero-dependency intent parser
 * Handles English, Urdu, Roman Urdu service requests
 * Works as fallback when Gemini is unavailable
 */

import { ServiceRequest } from '@/types';

interface IntentMap {
  keywords: string[];
  service: string;
}

const SERVICE_INTENTS: IntentMap[] = [
  { keywords: ['ac', 'air condition', 'cooling', 'thanda', 'air con', 'aircondition'], service: 'AC Repair' },
  { keywords: ['plumb', 'pipe', 'nal', 'water leak', 'pani', 'drain', 'sewage', 'nali'], service: 'Plumbing' },
  { keywords: ['electric', 'bijli', 'light', 'wiring', 'socket', 'switch', 'mcb', 'fuse', 'fan'], service: 'Electrical' },
  { keywords: ['paint', 'rang', 'wall', 'deewar'], service: 'Painting' },
  { keywords: ['clean', 'safai', 'sweep', 'mop', 'washing', 'dusting'], service: 'Cleaning' },
  { keywords: ['carpenter', 'wood', 'lakri', 'furniture', 'door', 'darwaza', 'window'], service: 'Carpentry' },
  { keywords: ['generator', 'genny', 'genset', 'ups'], service: 'Generator Repair' },
  { keywords: ['pest', 'cockroach', 'mice', 'rat', 'ants', 'spray', 'keeray', 'chahe'], service: 'Pest Control' },
  { keywords: ['shift', 'moving', 'move', 'transport', 'pack', 'samaan'], service: 'Shifting/Moving' },
  { keywords: ['cctv', 'camera', 'security', 'alarm'], service: 'CCTV Installation' },
  { keywords: ['wifi', 'internet', 'router', 'network', 'broadband'], service: 'Internet/WiFi Setup' },
  { keywords: ['tank', 'pani ki tank', 'water tank'], service: 'Water Tank Cleaning' },
  { keywords: ['solar', 'panel', 'battery'], service: 'Solar Installation' },
  { keywords: ['weld', 'iron', 'gate', 'railing', 'grill'], service: 'Welding' },
  { keywords: ['appliance', 'fridge', 'washing machine', 'microwave', 'oven', 'repair'], service: 'Appliance Repair' },
];

const URGENCY_SIGNALS = {
  emergency: ['abhi', 'now', 'urgent', 'emergency', 'turant', 'immediately', 'asap', 'help', '!'],
  high: ['aaj', 'today', 'ajj', 'same day', 'jaldi'],
  medium: ['kal', 'tomorrow', 'kal tak', 'next day', 'kl'],
  low: ['week', 'hafte', 'weekend', 'mahine', 'month', 'whenever', 'kisi din'],
};

const TIME_SIGNALS = {
  'Morning (8AM-12PM)': ['morning', 'subah', 'am', '8am', '9am', '10am', '11am', 'sawere'],
  'Afternoon (12PM-4PM)': ['afternoon', 'dopahar', 'pm', '12pm', '1pm', '2pm', '3pm'],
  'Evening (4PM-8PM)': ['evening', 'shaam', '4pm', '5pm', '6pm', '7pm'],
  'Night (8PM-12AM)': ['night', 'raat', '8pm', '9pm', '10pm', '11pm'],
};

export interface ParsedIntent {
  serviceType: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  preferredTime: string;
  description: string;
  confidence: number; // 0-1
  detectedLanguage: 'english' | 'urdu' | 'roman_urdu';
}

export function parseIntent(message: string): ParsedIntent {
  const lower = message.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // ── Service Type ──
  let serviceType = '';
  let serviceConfidence = 0;

  for (const intent of SERVICE_INTENTS) {
    for (const keyword of intent.keywords) {
      if (lower.includes(keyword)) {
        serviceType = intent.service;
        serviceConfidence = keyword.length > 4 ? 0.9 : 0.7;
        break;
      }
    }
    if (serviceType) break;
  }

  if (!serviceType) serviceType = 'General Service';

  // ── Urgency ──
  let urgency: ParsedIntent['urgency'] = 'medium';

  for (const [level, signals] of Object.entries(URGENCY_SIGNALS)) {
    if (signals.some((s) => lower.includes(s))) {
      urgency = level as ParsedIntent['urgency'];
      break;
    }
  }

  // ── Preferred Time ──
  let preferredTime = 'Flexible';

  for (const [slot, signals] of Object.entries(TIME_SIGNALS)) {
    if (signals.some((s) => lower.includes(s))) {
      preferredTime = slot;
      break;
    }
  }

  // ── Language Detection ──
  const urduChars = /[\u0600-\u06FF]/;
  const romanUrduWords = ['kal', 'aaj', 'abhi', 'chahiye', 'hai', 'mujhe', 'karo', 'please', 'yahan', 'wahan'];
  
  let detectedLanguage: ParsedIntent['detectedLanguage'] = 'english';
  if (urduChars.test(message)) {
    detectedLanguage = 'urdu';
  } else if (romanUrduWords.some((w) => lower.includes(w))) {
    detectedLanguage = 'roman_urdu';
  }

  // ── Confidence ──
  const confidence = serviceType !== 'General Service' ? serviceConfidence : 0.4;

  return {
    serviceType,
    urgency,
    preferredTime,
    description: message,
    confidence,
    detectedLanguage,
  };
}

export function buildServiceRequest(
  message: string,
  parsed: ParsedIntent,
  city?: string
): ServiceRequest {
  return {
    rawMessage: message,
    serviceType: parsed.serviceType,
    urgency: parsed.urgency,
    preferredTime: parsed.preferredTime,
    description: parsed.description,
    language: parsed.detectedLanguage,
    city,
  };
}

export function getUrgencyLabel(urgency: string): string {
  const labels: Record<string, string> = {
    emergency: '🚨 Emergency',
    high: '⚡ High',
    medium: '📅 Medium',
    low: '🕐 Low',
  };
  return labels[urgency] || urgency;
}

export function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    emergency: 'text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200',
    high: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200',
    medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200',
    low: 'text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200',
  };
  return colors[urgency] || colors.medium;
}
