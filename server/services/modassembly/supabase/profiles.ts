import { supabase } from '@/lib/modassembly/supabase/client';

/**
 * Get the Stripe customer ID for a user
 */
export async function getStripeCustomerId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data?.stripe_customer_id;
}

/**
 * Update a user's Stripe customer ID in their profile
 */
export async function updateStripeCustomerId(userId: string, stripeCustomerId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
    })
    .eq('id', userId);
    
  if (error) {
    throw error;
  }
  
  return { success: true };
}

/**
 * Update a user's subscription details in their profile
 */
export async function updateSubscriptionDetails(
  userId: string, 
  customerId: string, 
  subscriptionId: string, 
  tier: string
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_tier: tier
    })
    .eq('id', userId);
    
  if (error) {
    throw error;
  }
  
  return { success: true };
}
