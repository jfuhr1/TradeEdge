import { stripe, SUBSCRIPTION_PRICES } from './stripeService';
import type { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing environment variable: STRIPE_WEBHOOK_SECRET');
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    
    // Get the customer and subscription details
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    
    // Get the user ID from the customer metadata
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata.userId;
    
    if (!userId) {
      throw new Error('No userId found in customer metadata');
    }

    // Get subscription details to determine the tier
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    
    // Determine tier from price ID
    let tier = 'free';
    for (const [tierName, tierPriceId] of Object.entries(SUBSCRIPTION_PRICES)) {
      if (tierPriceId === priceId) {
        tier = tierName.toLowerCase();
        break;
      }
    }

    // Update the user's profile with Stripe info
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_tier: tier
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Updated profile for user ${userId} with Stripe info and tier ${tier}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('Processing subscription created:', subscription.id);
    
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata.userId;

    if (!userId) {
      throw new Error('No userId found in customer metadata');
    }

    // Get the price ID from subscription
    const priceId = subscription.items.data[0]?.price.id;
    
    // Determine tier from price ID
    let tier = 'free';
    for (const [tierName, tierPriceId] of Object.entries(SUBSCRIPTION_PRICES)) {
      if (tierPriceId === priceId) {
        tier = tierName.toLowerCase();
        break;
      }
    }

    // Update the user's profile with subscription info and tier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_tier: tier
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Updated subscription for user ${userId} with tier ${tier}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}