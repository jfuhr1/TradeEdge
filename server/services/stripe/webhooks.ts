import { stripe } from './stripeService';
import type { Stripe } from 'stripe';

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing environment variable: STRIPE_WEBHOOK_SECRET');
}

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

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Implement your subscription created logic here
    // Example: Update user's subscription status in your database
    console.log('Subscription created:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
    throw error;
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Implement your subscription updated logic here
    // Example: Update user's subscription details in your database
    console.log('Subscription updated:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Implement your subscription deleted logic here
    // Example: Update user's subscription status to inactive
    console.log('Subscription deleted:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
    throw error;
  }
}

export async function handleSubscriptionTrialEnding(subscription: Stripe.Subscription) {
  try {
    // Implement your trial ending logic here
    // Example: Send notification to user about trial ending
    console.log('Subscription trial ending:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription trial ending:', error);
    throw error;
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    // Implement your invoice paid logic here
    // Example: Update payment status in your database
    console.log('Invoice paid:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
    throw error;
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Implement your payment failed logic here
    // Example: Notify user of failed payment and retry options
    console.log('Invoice payment failed:', invoice.id);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
    throw error;
  }
}

export async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Implement your customer subscription deleted logic here
    // Example: Update user to free tier in your database
    console.log('Customer subscription deleted:', subscription.id);
  } catch (error) {
    console.error('Error handling customer subscription deleted:', error);
    throw error;
  }
} 