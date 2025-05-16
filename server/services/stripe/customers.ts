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

interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export async function createCustomer({ email, name, metadata }: CreateCustomerParams) {
  try {
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function getCustomer(userId: string) {
  try {
    // First try to find the customer ID in the Supabase profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !data?.stripe_customer_id) {
      return null; // Return null instead of throwing an error
    }

    // Now retrieve the customer using the Stripe customer ID
    return await stripe.customers.retrieve(data.stripe_customer_id);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null; // Return null instead of throwing an error
  }
}