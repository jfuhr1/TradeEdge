import { supabase } from '@/lib/modassembly/supabase/client';

export interface CoachingProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stripe_product_id: string;
  stripe_price_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getCoachingProducts(): Promise<CoachingProduct[]> {
  const { data: products, error } = await supabase
    .from('coaching_products')
    .select('*')
    .eq('status', 'active')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching coaching products:', error);
    throw error;
  }

  return products || [];
} 