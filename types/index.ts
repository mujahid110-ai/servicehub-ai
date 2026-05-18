import { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'provider';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Timestamp;
  photoURL?: string;
}

export interface ProviderProfile extends UserProfile {
  role: 'provider';
  skill: string;
  city: string;
  availability: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  cancellationRate: number;
  reliability: number;
  bio?: string;
  isActive: boolean;
}

export interface CustomerProfile extends UserProfile {
  role: 'customer';
  address?: string;
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  providerSkill: string;
  serviceType: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  preferredTime: string;
  status: BookingStatus;
  pricing: PricingBreakdown;
  city: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rejectedProviders?: string[];
  completedAt?: Timestamp;
  notes?: string;
}

export interface PricingBreakdown {
  baseFee: number;
  urgencyFee: number;
  distanceFee: number;
  total: number;
  currency: string;
}

export interface ServiceRequest {
  rawMessage: string;
  serviceType: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  preferredTime: string;
  description: string;
  language: 'english' | 'urdu' | 'roman_urdu';
  city?: string;
}

export interface ProviderMatch {
  provider: ProviderProfile;
  matchScore: number;
  pricing: PricingBreakdown;
  estimatedArrival: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export const SERVICE_CATEGORIES = [
  'AC Repair',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Cleaning',
  'Appliance Repair',
  'Pest Control',
  'Shifting/Moving',
  'CCTV Installation',
  'Internet/WiFi Setup',
  'Generator Repair',
  'Water Tank Cleaning',
  'Solar Installation',
  'Welding',
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export const AVAILABILITY_OPTIONS = [
  'Morning (8AM-12PM)',
  'Afternoon (12PM-4PM)',
  'Evening (4PM-8PM)',
  'Night (8PM-12AM)',
  'Available 24/7',
];

export const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Hyderabad',
  'Nawabshah',
  'Sukkur',
  'Larkana',
];
