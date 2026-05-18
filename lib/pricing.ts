import { PricingBreakdown } from '@/types';

// Base fees in PKR
const BASE_FEES: Record<string, number> = {
  'AC Repair': 1500,
  'Plumbing': 800,
  'Electrical': 1000,
  'Carpentry': 1200,
  'Painting': 2000,
  'Cleaning': 600,
  'Appliance Repair': 1000,
  'Pest Control': 1500,
  'Shifting/Moving': 3000,
  'CCTV Installation': 2500,
  'Internet/WiFi Setup': 800,
  'Generator Repair': 1500,
  'Water Tank Cleaning': 1200,
  'Solar Installation': 5000,
  'Welding': 1000,
  'General Service': 800,
};

const URGENCY_MULTIPLIERS: Record<string, number> = {
  emergency: 0.8,  // 80% surcharge
  high: 0.3,       // 30% surcharge
  medium: 0.0,     // No surcharge
  low: -0.1,       // 10% discount
};

const CITY_TIERS: Record<string, number> = {
  'Karachi': 200,
  'Lahore': 200,
  'Islamabad': 200,
  'Rawalpindi': 150,
  'Faisalabad': 150,
  'Multan': 100,
  'Peshawar': 100,
  'Quetta': 100,
  'Hyderabad': 100,
  'Nawabshah': 50,
  'Sukkur': 50,
  'Larkana': 50,
};

export function calculatePricing(
  serviceType: string,
  urgency: string,
  providerCity: string,
  customerCity?: string
): PricingBreakdown {
  // Base fee
  const baseFee = BASE_FEES[serviceType] || BASE_FEES['General Service'];
  
  // Urgency fee
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency] ?? 0;
  const urgencyFee = Math.round(baseFee * urgencyMultiplier);
  
  // Distance fee (if different cities)
  let distanceFee = 0;
  if (customerCity && providerCity.toLowerCase() !== customerCity.toLowerCase()) {
    distanceFee = 300; // Cross-city travel fee
  } else {
    distanceFee = CITY_TIERS[providerCity] || 100; // Local travel fee
  }
  
  const total = baseFee + urgencyFee + distanceFee;
  
  return {
    baseFee,
    urgencyFee,
    distanceFee,
    total: Math.max(total, 500), // Minimum PKR 500
    currency: 'PKR',
  };
}

export function formatPrice(amount: number, currency = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-PK')}`;
}

export function getPricingBreakdownLabel(pricing: PricingBreakdown): string {
  const parts = [`Base: ${formatPrice(pricing.baseFee)}`];
  if (pricing.urgencyFee > 0) parts.push(`Urgency: +${formatPrice(pricing.urgencyFee)}`);
  if (pricing.urgencyFee < 0) parts.push(`Discount: ${formatPrice(pricing.urgencyFee)}`);
  parts.push(`Travel: ${formatPrice(pricing.distanceFee)}`);
  return parts.join(' · ');
}

export function getUrgencyFeeLabel(fee: number): string {
  if (fee > 0) return `+${formatPrice(fee)} urgency surcharge`;
  if (fee < 0) return `${formatPrice(Math.abs(fee))} discount`;
  return 'Standard rate';
}
