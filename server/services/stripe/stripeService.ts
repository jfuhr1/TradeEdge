import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing environment variable: STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use the latest stable API version
});

export const SUBSCRIPTION_PRICES = {
  PAID: process.env.STRIPE_PAID_PRICE_ID,
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
  MENTORSHIP: process.env.STRIPE_MENTORSHIP_PRICE_ID,
} as const;

export type SubscriptionTier = 'free' | 'paid' | 'premium' | 'mentorship';

export const tierToPriceId: Record<Exclude<SubscriptionTier, 'free'>, string> = {
  paid: SUBSCRIPTION_PRICES.PAID!,
  premium: SUBSCRIPTION_PRICES.PREMIUM!,
  mentorship: SUBSCRIPTION_PRICES.MENTORSHIP!,
};

// Add coaching product price IDs
export const COACHING_PRICES = {
  SINGLE_SESSION: process.env.STRIPE_COACHING_SINGLE_PRICE_ID,
  FIVE_SESSIONS: process.env.STRIPE_COACHING_FIVE_PRICE_ID,
  TEN_SESSIONS: process.env.STRIPE_COACHING_TEN_PRICE_ID,
} as const; 