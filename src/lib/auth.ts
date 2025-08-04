import { supabase } from './supabase';
import type { 
  SignUpData, 
  SignInData, 
  Profile 
} from './types';

// Authentication functions
export const signUp = async (userData: SignUpData) => {
  try {
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      },
    });

    if (authError) throw authError;

    return { data: authData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async (userData: SignInData) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Profile functions
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Invite functions
export const validateInviteCode = async (code: string): Promise<InviteValidationResponse> => {
  try {
    const { data, error } = await supabase.rpc('validate_invite_code', {
      invite_code: code,
    });

    if (error) throw error;

    return {
      valid: data,
      message: data ? 'Valid invite code' : 'Invalid or expired invite code',
    };
  } catch {
    return {
      valid: false,
      message: 'Error validating invite code',
    };
  }
};

export const createInvite = async (): Promise<CreateInviteResponse> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Must be authenticated to create invites');
    }

    const { data, error } = await supabase.rpc('create_invite', {
      creator_id: user.id,
    });

    if (error) throw error;

    return {
      success: true,
      invite_code: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invite',
    };
  }
};

export const getUserInvites = async (userId: string): Promise<Invite[]> => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(invite => ({
      ...invite,
      expires_at: new Date(invite.expires_at),
      created_at: new Date(invite.created_at),
      used_at: invite.used_at ? new Date(invite.used_at) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching user invites:', error);
    return [];
  }
};

export const revokeInvite = async (inviteId: string) => {
  try {
    const { data, error } = await supabase
      .from('invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: unknown) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

// Password reset
export const resetPassword = async (email: string) => {
  try {
    // Ensure no double slashes in the redirect URL
    const origin = window.location.origin.endsWith('/') 
      ? window.location.origin.slice(0, -1) 
      : window.location.origin;
    
    const redirectUrl = `${origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Update password
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}; 