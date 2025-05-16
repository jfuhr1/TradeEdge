import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLISHABLE_KEY');
}

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Subscription tier IDs from Stripe
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PAID: import.meta.env.VITE_STRIPE_PAID_PRICE_ID,
  PREMIUM: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
  MENTORSHIP: import.meta.env.VITE_STRIPE_MENTORSHIP_PRICE_ID,
} as const; 