import { stripe } from './stripeService';
import type { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface CreateCoachingCheckoutParams {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: {
    userId: string;
    coachingProductId: string;
  };
}

export async function createCoachingCheckout({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  metadata,
}: CreateCoachingCheckoutParams) {
  try {
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
    };

    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error) {
    console.error('Error creating coaching checkout session:', error);
    throw error;
  }
}

export async function handleCoachingPurchaseCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId, coachingProductId } = session.metadata || {};
    
    if (!userId || !coachingProductId) {
      throw new Error('Missing required metadata');
    }

    // Insert the purchase record
    const { error: insertError } = await supabase
      .from('coaching_purchases')
      .insert({
        user_id: userId,
        coaching_product_id: coachingProductId,
        stripe_price_id: session.line_items?.data[0]?.price?.id,
        stripe_payment_id: session.payment_intent as string,
        status: 'completed',
        purchase_date: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`Recorded coaching purchase for user ${userId}`);
  } catch (error) {
    console.error('Error handling coaching purchase completed:', error);
    throw error;
  }
} 