import { ProviderProfile, ServiceRequest, ProviderMatch } from '@/types';
import { calculatePricing } from './pricing';

interface MatchWeights {
  skillMatch: number;
  rating: number;
  availability: number;
  reliability: number;
  experience: number;
  cancellationRate: number;
  distance: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  skillMatch: 0.35,
  rating: 0.25,
  availability: 0.15,
  reliability: 0.10,
  experience: 0.08,
  cancellationRate: 0.05,
  distance: 0.02,
};

export function scoreProvider(
  provider: ProviderProfile,
  request: ServiceRequest,
  weights: MatchWeights = DEFAULT_WEIGHTS
): number {
  const scores: Record<keyof MatchWeights, number> = {
    skillMatch: calcSkillMatch(provider.skill, request.serviceType),
    rating: (provider.rating / 5) * 100,
    availability: calcAvailability(provider.availability, request.preferredTime),
    reliability: provider.reliability || 90,
    experience: Math.min((provider.experience / 10) * 100, 100),
    cancellationRate: Math.max(0, 100 - (provider.cancellationRate * 5)),
    distance: calcDistance(provider.city, request.city),
  };

  const total = Object.keys(weights).reduce((sum, key) => {
    const k = key as keyof MatchWeights;
    return sum + scores[k] * weights[k];
  }, 0);

  return Math.round(total * 100) / 100;
}

function calcSkillMatch(providerSkill: string, requestedService: string): number {
  if (!providerSkill || !requestedService) return 0;
  
  const pSkill = providerSkill.toLowerCase();
  const rService = requestedService.toLowerCase();
  
  // Exact match
  if (pSkill === rService) return 100;
  
  // Contains match
  if (pSkill.includes(rService) || rService.includes(pSkill)) return 85;
  
  // Word overlap
  const pWords = pSkill.split(/\s+/);
  const rWords = rService.split(/\s+/);
  const overlap = pWords.filter(w => rWords.includes(w) || rWords.some(r => r.includes(w)));
  if (overlap.length > 0) return 60;
  
  // Category match (e.g., "AC Repair" and "Air Conditioning")
  const CATEGORY_MAP: Record<string, string[]> = {
    'electrical': ['electric', 'bijli', 'wiring', 'electrician'],
    'plumbing': ['plumber', 'pipe', 'water'],
    'ac repair': ['air conditioning', 'air condition', 'cooling'],
  };
  
  for (const [cat, alts] of Object.entries(CATEGORY_MAP)) {
    if ((pSkill.includes(cat) || alts.some(a => pSkill.includes(a))) &&
        (rService.includes(cat) || alts.some(a => rService.includes(a)))) {
      return 75;
    }
  }
  
  return 20; // Different service but still active provider
}

function calcAvailability(
  availability: string[],
  preferredTime: string
): number {
  if (!availability || availability.length === 0) return 50;
  if (availability.includes('Available 24/7')) return 100;
  
  const preferred = preferredTime.toLowerCase();
  const hasMatch = availability.some((slot) => {
    const slotLower = slot.toLowerCase();
    return (
      slotLower.includes(preferred) ||
      (preferred.includes('morning') && slotLower.includes('morning')) ||
      (preferred.includes('afternoon') && slotLower.includes('afternoon')) ||
      (preferred.includes('evening') && slotLower.includes('evening'))
    );
  });
  
  return hasMatch ? 90 : 40;
}

function calcDistance(providerCity: string, requestCity?: string): number {
  if (!requestCity || !providerCity) return 70;
  if (providerCity.toLowerCase() === requestCity.toLowerCase()) return 100;
  return 50; // Different city
}

export function matchProviders(
  providers: ProviderProfile[],
  request: ServiceRequest,
  excludeIds: string[] = []
): ProviderMatch[] {
  const eligible = providers.filter(
    (p) => !excludeIds.includes(p.uid)
  );

  const matches: ProviderMatch[] = eligible.map((provider) => {
    const matchScore = scoreProvider(provider, request);
    const pricing = calculatePricing(
      provider.skill,
      request.urgency,
      provider.city,
      request.city
    );

    return {
      provider,
      matchScore,
      pricing,
      estimatedArrival: getEstimatedArrival(request.urgency, request.preferredTime),
    };
  });

  // Sort by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

function getEstimatedArrival(urgency: string, preferredTime: string): string {
  const now = new Date();
  
  if (urgency === 'emergency') {
    const eta = new Date(now.getTime() + 30 * 60 * 1000);
    return `~30 mins (by ${eta.getHours()}:${String(eta.getMinutes()).padStart(2, '0')})`;
  }
  
  if (urgency === 'high') return 'Today, ' + preferredTime;
  if (urgency === 'medium') return 'Tomorrow, ' + preferredTime;
  return 'Scheduled: ' + preferredTime;
}

export function getMatchLabel(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 65) return 'Good Match';
  if (score >= 50) return 'Fair Match';
  return 'Available';
}

export function getMatchColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
  if (score >= 65) return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30';
  return 'text-gray-600 bg-gray-50 dark:bg-gray-800/50';
}
