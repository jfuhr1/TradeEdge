import { stripe, SUBSCRIPTION_PRICES } from './stripeService';
import type { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    console.log('Processing stripe event:', event.id);
    
    let customerId = event.customer as string;
    let subscriptionId = event.id as string;
    
    // Get the user ID from the customer metadata
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    const userId = customer.metadata.userId;
    
    if (!userId) {
      throw new Error('No userId found in customer metadata');
    }

    // Get subscription details to determine the tier
    const subscriptionDetails = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscriptionDetails.items.data[0]?.price.id;
    
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
    console.error('Error handling stripe event:', error);
    throw error;
  }
}