import { stripe, SubscriptionTier, tierToPriceId } from './stripeService';
import type { Stripe } from 'stripe';

interface CreateSubscriptionParams {
  customerId: string;
  tier: Exclude<SubscriptionTier, 'free'>;
}

interface UpdateSubscriptionParams {
  subscriptionId: string;
  newTier: Exclude<SubscriptionTier, 'free'>;
}

export async function createSubscription({ customerId, tier }: CreateSubscriptionParams) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: tierToPriceId[tier] }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tier,
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function updateSubscription({ subscriptionId, newTier }: UpdateSubscriptionParams) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItem = subscription.items.data[0];

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptionItem.id,
        price: tierToPriceId[newTier],
      }],
      metadata: {
        tier: newTier,
      },
      proration_behavior: 'create_prorations',
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status !== 'canceled') {
      throw new Error('Subscription is not canceled');
    }

    // Create a new subscription with the same parameters
    const newSubscription = await stripe.subscriptions.create({
      customer: subscription.customer as string,
      items: subscription.items.data.map(item => ({
        price: item.price.id,
        quantity: item.quantity,
      })),
      metadata: subscription.metadata,
    });

    return newSubscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

export async function listCustomerSubscriptions(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.latest_invoice', 'data.items.data.price.product'],
    });

    return subscriptions.data;
  } catch (error) {
    console.error('Error listing customer subscriptions:', error);
    throw error;
  }
} 