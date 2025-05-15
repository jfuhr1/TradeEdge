import { stripe } from './stripeService';
import type { Stripe } from 'stripe';

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

export async function getCustomer(customerId: string) {
  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw error;
  }
}

export async function updateCustomer(customerId: string, params: Stripe.CustomerUpdateParams) {
  try {
    return await stripe.customers.update(customerId, params);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

export async function deleteCustomer(customerId: string) {
  try {
    return await stripe.customers.del(customerId);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}

export async function listCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw error;
  }
} 