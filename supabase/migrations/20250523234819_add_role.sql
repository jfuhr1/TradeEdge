-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

-- Add check constraint for valid roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Create index for role lookups
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Update the handle_new_user function to include role (defaults to 'user')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies for profiles table
-- Admins can view any profile
CREATE POLICY "Admins can view any profile" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Admins can delete any profile
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Add admin policies for coaching_products table
-- Admins can create coaching products
CREATE POLICY "Admins can create coaching products" ON public.coaching_products
  FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update coaching products
CREATE POLICY "Admins can update coaching products" ON public.coaching_products
  FOR UPDATE USING (public.is_admin());

-- Admins can delete coaching products
CREATE POLICY "Admins can delete coaching products" ON public.coaching_products
  FOR DELETE USING (public.is_admin());

-- Add admin policies for coaching_purchases table
-- Admins can view any purchase
CREATE POLICY "Admins can view any purchase" ON public.coaching_purchases
  FOR SELECT USING (public.is_admin());

-- Admins can create purchases for any user
CREATE POLICY "Admins can create any purchase" ON public.coaching_purchases
  FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update any purchase
CREATE POLICY "Admins can update any purchase" ON public.coaching_purchases
  FOR UPDATE USING (public.is_admin());

-- Admins can delete any purchase
CREATE POLICY "Admins can delete any purchase" ON public.coaching_purchases
  FOR DELETE USING (public.is_admin());
