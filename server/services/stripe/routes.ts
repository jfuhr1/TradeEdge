import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { json, raw } from 'express';
import { stripe } from './stripeService';
import * as checkoutService from './checkoutSessions';
import * as subscriptionService from './subscriptions';
import * as customerService from './customers';
import * as webhookService from './webhooks';
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
    const { priceId, successUrl, cancelUrl } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get or create customer
    let customer = await customerService.getCustomer(user.id);
    if (!customer) {
      customer = await customerService.createCustomer({
        email: user.email ?? '',
        name: user.user_metadata?.full_name,
        metadata: {
          userId: user.id,
        },
      });
    }

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

// Subscription management routes
router.get('/current-subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const customer = await customerService.getCustomer(user.id.toString());
    
    if (!customer) {
      return res.json(null);
    }

    const subscriptions = await subscriptionService.listCustomerSubscriptions(customer.id);
    const activeSubscription = subscriptions.find(sub => sub.status === 'active');

    if (!activeSubscription) {
      return res.json(null);
    }

    const subscriptionItem = activeSubscription.items.data[0];

    res.json({
      id: activeSubscription.id,
      status: activeSubscription.status,
      currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      tier: activeSubscription.metadata?.tier || 'free',
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/update-subscription/:subscriptionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { newTier } = req.body;

    const subscription = await subscriptionService.updateSubscription({
      subscriptionId,
      newTier,
    });

    res.json(subscription);
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/cancel-subscription/:subscriptionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await subscriptionService.cancelSubscription(subscriptionId);
    res.json(subscription);
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/reactivate-subscription/:subscriptionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await subscriptionService.reactivateSubscription(subscriptionId);
    res.json(subscription);
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
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
      case 'customer.subscription.updated':
        await webhookService.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await webhookService.handleSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        await webhookService.handleSubscriptionTrialEnding(event.data.object);
        break;
      case 'invoice.paid':
        await webhookService.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await webhookService.handleInvoicePaymentFailed(event.data.object);
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