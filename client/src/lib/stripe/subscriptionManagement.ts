import { SubscriptionTier } from './subscriptionCheckout';

interface SubscriptionDetails {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  tier: SubscriptionTier;
}

export async function getCurrentSubscription(): Promise<SubscriptionDetails | null> {
  try {
    const response = await fetch('/api/stripe/current-subscription');
    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  try {
    const response = await fetch(`/api/stripe/update-subscription/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPriceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const response = await fetch(`/api/stripe/cancel-subscription/${subscriptionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    const response = await fetch(`/api/stripe/reactivate-subscription/${subscriptionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to reactivate subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
} 