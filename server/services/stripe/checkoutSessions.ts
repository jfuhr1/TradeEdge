import { stripe } from './stripeService';
import type { Stripe } from 'stripe';

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

    // If customer ID is provided, associate the checkout session with the customer
    if (customerId) {
      params.customer = customerId;
    } else {
      params.customer_creation = 'always';
    }

    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}