import { createClient } from '@supabase/supabase-js';

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (if needed)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database types (will be auto-generated later)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          invite_code: string | null;
          invited_by: string | null;
          invites_remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          invite_code?: string | null;
          invited_by?: string | null;
          invites_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          invite_code?: string | null;
          invited_by?: string | null;
          invites_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          code: string;
          created_by: string;
          used_by: string | null;
          status: 'pending' | 'used' | 'expired' | 'revoked';
          expires_at: string;
          created_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          created_by: string;
          used_by?: string | null;
          status?: 'pending' | 'used' | 'expired' | 'revoked';
          expires_at?: string;
          created_at?: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          created_by?: string;
          used_by?: string | null;
          status?: 'pending' | 'used' | 'expired' | 'revoked';
          expires_at?: string;
          created_at?: string;
          used_at?: string | null;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      boxes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          qr_code: string;
          image_url: string | null;
          location_id: string;
          user_id: string;
          ai_analysis: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          qr_code: string;
          image_url?: string | null;
          location_id: string;
          user_id: string;
          ai_analysis?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          qr_code?: string;
          image_url?: string | null;
          location_id?: string;
          user_id?: string;
          ai_analysis?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      box_contents: {
        Row: {
          id: string;
          box_id: string;
          content: string;
          category: string | null;
          quantity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          box_id: string;
          content: string;
          category?: string | null;
          quantity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          box_id?: string;
          content?: string;
          category?: string | null;
          quantity?: number | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      validate_invite_code: {
        Args: { invite_code: string };
        Returns: boolean;
      };
      use_invite_code: {
        Args: { invite_code: string; user_id: string };
        Returns: boolean;
      };
      create_invite: {
        Args: { creator_id: string };
        Returns: string;
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
} 