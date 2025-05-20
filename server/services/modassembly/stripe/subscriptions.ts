import { stripe, SUBSCRIPTION_PRICES } from './client';
import type { Stripe } from 'stripe';
import { updateSubscriptionDetails } from '../supabase/profiles';

interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  metadata,
}: CreateCheckoutSessionParams) {
  try {
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: metadata,
      },
    };

    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function handleCheckoutSessionCompleted(event: Stripe.Checkout.Session | Stripe.Subscription) {
  try {
    console.log('[Webhook] Processing stripe event:', event.id);
    
    let customerId = '';
    let subscriptionId = '';
    
    // Handle different event types correctly
    if ('subscription' in event && typeof event.subscription === 'string') {
      // This is a Checkout.Session event
      console.log('[Webhook] Event is a Checkout.Session');
      customerId = typeof event.customer === 'string' ? event.customer : (event.customer as Stripe.Customer).id;
      subscriptionId = event.subscription;
    } else {
      // This is a Subscription event
      console.log('[Webhook] Event is a Subscription');
      customerId = typeof event.customer === 'string' ? event.customer : (event.customer as Stripe.Customer).id;
      subscriptionId = event.id;
    }
    
    console.log(`[Webhook] CustomerId: ${customerId}, SubscriptionId: ${subscriptionId}`);
    
    // Get the user ID from the customer metadata
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata.userId;
    
    if (!userId) {
      throw new Error('No userId found in customer metadata');
    }

    console.log(`[Webhook] Found userId in customer metadata: ${userId}`);

    // Get subscription details to determine the tier
    const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscriptionDetails.items.data[0]?.price.id;
    
    console.log(`[Webhook] Retrieved subscription, priceId: ${priceId}`);
    
    // Determine tier from price ID
    let tier = 'free';
    for (const [tierName, tierPriceId] of Object.entries(SUBSCRIPTION_PRICES)) {
      if (tierPriceId === priceId) {
        tier = tierName.toLowerCase();
        break;
      }
    }

    // Update the user's profile with Stripe info using the profiles service
    await updateSubscriptionDetails(userId, customerId, subscriptionId, tier);

    console.log(`[Webhook] Updated profile for user ${userId} with Stripe info and tier ${tier}`);
  } catch (error) {
    console.error('[Webhook] Error handling stripe event:', error);
    throw error;
  }
}