import { stripe } from './stripeService';
import type { Stripe } from 'stripe';
import * as coachingService from './coaching';
import * as subscriptionService from './subscriptions';

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing environment variable: STRIPE_WEBHOOK_SECRET');
}

export function constructEvent(payload: string | Buffer, signature: string) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    throw error;
  }
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session:', session.id);
    
    // Check if this is a coaching purchase
    if (session.mode === 'payment') {
      await coachingService.handleCoachingPurchaseCompleted(session);
      return;
    }
    
    // Handle subscription checkout
    await subscriptionService.handleCheckoutSessionCompleted(session);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    await subscriptionService.handleCheckoutSessionCompleted(subscription);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}