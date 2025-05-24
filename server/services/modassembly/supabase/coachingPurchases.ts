import { supabase } from "./client";

interface InsertCoachingPurchaseParams {
  userId: string;
  coachingProductId: string;
  stripePaymentId: string;
  stripePriceId: string;
}

export async function insertCoachingPurchase({
  userId,
  coachingProductId,
  stripePaymentId,
  stripePriceId,
}: InsertCoachingPurchaseParams) {
  const { error } = await supabase
    .from('coaching_purchases')
    .insert({
      user_id: userId,
      coaching_product_id: coachingProductId,
      stripe_price_id: stripePriceId,
      stripe_payment_id: stripePaymentId,
      status: 'completed',
      purchase_date: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }

  return { success: true };
}
