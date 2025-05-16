-- Revert Stripe-related changes

-- Drop the indexes first
DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;
DROP INDEX IF EXISTS idx_profiles_stripe_subscription_id;

-- Remove the Stripe-related columns from profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS stripe_tier;

-- Revert the handle_new_user function to its previous state
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (keeping these the same)
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role; 