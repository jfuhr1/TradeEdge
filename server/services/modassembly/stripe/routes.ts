import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as checkoutService from './subscriptions';
import * as customerService from './customers';
import * as webhookService from './webhooks';
import * as coachingService from './coaching';
import { updateStripeCustomerId } from '../supabase/profiles';
import { requireAuth } from '../auth';

// Extend Express Request to include Supabase user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

const router = Router();

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
      
      // Update Supabase profile with Stripe customer ID using the profiles service
      await updateStripeCustomerId(user.id, customer.id);
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
    const { productId, priceId, successUrl, cancelUrl } = req.body;

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
      
      // Update Supabase profile with Stripe customer ID using the profiles service
      await updateStripeCustomerId(user.id, customer.id);
    }

    // Create coaching checkout session
    const session = await coachingService.createCoachingCheckout({
      priceId,
      customerId: customer.id,
      successUrl,
      cancelUrl,
      metadata: {
        userId: user.id,
        coachingProductId: productId,
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
    console.log('[Webhook] Received webhook event');
    console.log('[Webhook] Headers:', JSON.stringify(req.headers));
    console.log('[Webhook] Body type:', typeof req.body);
    console.log('[Webhook] Body is buffer:', Buffer.isBuffer(req.body));
    
    const signature = req.headers['stripe-signature'];
    
    if (!signature || typeof signature !== 'string') {
      console.error('[Webhook] Missing or invalid stripe-signature header:', signature);
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    try {
      const event = webhookService.constructEvent(req.body, signature);
      
      // Handle the event
      console.log(`[Webhook] Processing event type: ${event.type}`);
      
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('[Webhook] Starting checkout.session.completed handler');
          await webhookService.handleCheckoutSessionCompleted(event.data.object);
          console.log('[Webhook] Finished checkout.session.completed handler');
          break;
        case 'customer.subscription.created':
          console.log('[Webhook] Starting customer.subscription.created handler');
          await webhookService.handleSubscriptionCreated(event.data.object);
          console.log('[Webhook] Finished customer.subscription.created handler');
          break;
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      console.log('[Webhook] Sending success response');
      res.json({ received: true });
    } catch (eventError: any) {
      console.error('[Webhook] Error processing webhook event:', eventError);
      return res.status(400).json({ error: eventError.message });
    }
  } catch (error: any) {
    console.error('[Webhook] Error in webhook request handling:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router; 