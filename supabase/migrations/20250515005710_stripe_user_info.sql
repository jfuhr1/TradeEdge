-- Add Stripe-related fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN stripe_customer_id TEXT DEFAULT NULL,
ADD COLUMN stripe_subscription_id TEXT DEFAULT NULL,
ADD COLUMN stripe_tier TEXT DEFAULT NULL;

-- Create indexes for Stripe IDs to improve query performance
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    stripe_customer_id,
    stripe_subscription_id,
    stripe_tier,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
