import { stripe } from './client';
import type { Stripe } from 'stripe';
import * as coachingService from './coaching';
import * as subscriptionService from './subscriptions';

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing environment variable: STRIPE_WEBHOOK_SECRET');
}

// Trim the webhook secret to avoid whitespace issues
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET.trim();
console.log(`Using webhook secret with length: ${WEBHOOK_SECRET.length}`);

export function constructEvent(payload: string | Buffer, signature: string) {
  try {
    console.log(`[Webhook] Constructing event, signature starts with: ${signature.substring(0, 10)}...`);
    console.log(`[Webhook] Payload type: ${typeof payload}, is buffer: ${Buffer.isBuffer(payload)}`);
    
    if (Buffer.isBuffer(payload)) {
      console.log(`[Webhook] Payload buffer length: ${payload.length}`);
    }
    
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      WEBHOOK_SECRET
    );
    
    console.log(`[Webhook] Event constructed successfully: ${event.type} (${event.id})`);
    return event;
  } catch (error) {
    console.error('[Webhook] Error constructing webhook event:', error);
    throw error;
  }
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log(`[Webhook] Processing checkout session: ${session.id}`);
    console.log(`[Webhook] Session mode: ${session.mode}`);
    console.log(`[Webhook] Session customer: ${session.customer}`);
    console.log(`[Webhook] Session metadata:`, session.metadata);
    
    // Check if this is a coaching purchase
    if (session.mode === 'payment') {
      console.log(`[Webhook] Handling as coaching purchase`);
      await coachingService.handleCoachingPurchaseCompleted(session);
      console.log(`[Webhook] Coaching purchase processed successfully`);
      return;
    }
    
    // Handle subscription checkout
    console.log(`[Webhook] Handling as subscription checkout`);
    await subscriptionService.handleCheckoutSessionCompleted(session);
    console.log(`[Webhook] Subscription checkout processed successfully`);
  } catch (error) {
    console.error('[Webhook] Error handling checkout session completed:', error);
    throw error;
  }
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log(`[Webhook] Processing subscription created: ${subscription.id}`);
    console.log(`[Webhook] Subscription customer: ${subscription.customer}`);
    console.log(`[Webhook] Subscription metadata:`, subscription.metadata);
    
    await subscriptionService.handleCheckoutSessionCompleted(subscription);
    console.log(`[Webhook] Subscription created processed successfully`);
  } catch (error) {
    console.error('[Webhook] Error handling subscription created:', error);
    throw error;
  }
}