import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json, raw } from 'express';
import { stripe } from './stripeService';
import * as checkoutService from './checkoutSessions';
import * as subscriptionService from './subscriptions';
import * as customerService from './customers';
import * as webhookService from './webhooks';
import * as coachingService from './coachingCheckout';
import type { User } from '@supabase/supabase-js';
import type { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request to include Supabase user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = Router();

// Middleware to ensure user is authenticated with Supabase
async function requireAuth(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Add the user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Checkout session routes
router.post('/create-checkout-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let customer = await customerService.getCustomer(user.id);
    if (!customer) {
      customer = await customerService.createCustomer({
        email: user.email ?? '',
        name: user.user_metadata?.full_name,
        metadata: {
          userId: user.id,
        },
      });
      
      // Update Supabase profile with Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customer.id,
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
    }

    // Create checkout session with the Stripe customer ID
    const session = await checkoutService.createCheckoutSession({
      priceId,
      customerId: customer.id,
      successUrl,
      cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Coaching checkout session route
router.post('/create-coaching-checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { priceId, coachingProductId, successUrl, cancelUrl } = req.body;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let customer = await customerService.getCustomer(user.id);
    if (!customer) {
      customer = await customerService.createCustomer({
        email: user.email ?? '',
        name: user.user_metadata?.full_name,
        metadata: {
          userId: user.id,
        },
      });
      
      // Update Supabase profile with Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customer.id,
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
    }

    // Create coaching checkout session
    const session = await coachingService.createCoachingCheckout({
      priceId,
      customerId: customer.id,
      successUrl,
      cancelUrl,
      metadata: {
        userId: user.id,
        coachingProductId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating coaching checkout session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const event = webhookService.constructEvent(req.body, signature);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await webhookService.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await webhookService.handleSubscriptionCreated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router; 