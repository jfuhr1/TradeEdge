import { supabase } from './client';

/**
 * Fetch a user's profile from the profiles table
 * @param userId The user's ID to fetch the profile for
 * @returns The profile data or null if not found
 */
export async function getProfile(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return profile;
}

/**
 * Get a user's subscription tier
 * @param userId The user's ID
 * @returns The tier information or null if not found
 */
export async function getUserTier(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_tier')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user tier:', error);
    return null;
  }
  
  return data;
}

/**
 * Update a user's profile in the profiles table
 * @param userId The user's ID
 * @param profileData The profile data to update
 * @returns Success status and any error
 */
export async function updateProfile(userId: string, profileData: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId);
  
  return { data, error };
}

/**
 * Update a user's profile with signup information
 * @param userId The user's ID
 * @param signupData Object containing signup information
 * @returns Success status and any error
 */
export async function updateSignupInfo(userId: string, signupData: {
  phone_number?: string | null;
  financial_disclaimer_accepted?: boolean;
  terms_accepted?: boolean;
  privacy_accepted?: boolean;
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      phone_number: signupData.phone_number,
      financial_disclaimer_accepted: signupData.financial_disclaimer_accepted,
      terms_accepted: signupData.terms_accepted,
      privacy_accepted: signupData.privacy_accepted
    })
    .eq('id', userId);
  
  return { data, error };
}

/**
 * Update a user's subscription tier
 * @param userId The user's ID
 * @param tier The subscription tier to set
 * @returns Success status and any error
 */
export async function updateUserTier(userId: string, tier: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      stripe_tier: tier
    })
    .eq('id', userId);
  
  return { data, error };
}

/**
 * Get a user's role
 * @param userId The user's ID
 * @returns The role information or null if not found
 */
export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
  
  return data;
}
