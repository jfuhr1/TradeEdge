import { SUBSCRIPTION_TIERS } from './stripeClient';

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createSubscriptionCheckout({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerId,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function redirectToCheckout(sessionId: string) {
  const stripe = await import('./stripeClient').then(module => module.stripePromise);
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }
  
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) {
    throw error;
  }
} 