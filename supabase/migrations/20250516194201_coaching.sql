-- Create coaching_products table
CREATE TABLE public.coaching_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create coaching_purchases table
CREATE TABLE public.coaching_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  coaching_product_id UUID REFERENCES public.coaching_products(id) NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_payment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.coaching_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for coaching_products
-- Everyone can view active coaching products
CREATE POLICY "Anyone can view active coaching products" ON public.coaching_products
  FOR SELECT USING (status = 'active');

-- Create policies for coaching_purchases
-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.coaching_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can create own purchases" ON public.coaching_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_coaching_products_stripe_product_id ON public.coaching_products(stripe_product_id);
CREATE INDEX idx_coaching_products_stripe_price_id ON public.coaching_products(stripe_price_id);
CREATE INDEX idx_coaching_products_status ON public.coaching_products(status);

CREATE INDEX idx_coaching_purchases_user_id ON public.coaching_purchases(user_id);
CREATE INDEX idx_coaching_purchases_coaching_product_id ON public.coaching_purchases(coaching_product_id);
CREATE INDEX idx_coaching_purchases_status ON public.coaching_purchases(status);

-- Grant necessary permissions
GRANT ALL ON public.coaching_products TO postgres;
GRANT ALL ON public.coaching_products TO service_role;

GRANT ALL ON public.coaching_purchases TO postgres;
GRANT ALL ON public.coaching_purchases TO service_role;
