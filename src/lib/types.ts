// Authentication and User Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  invite_code?: string;
  invited_by?: string;
  invites_remaining: number;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  invite_code?: string;
  invited_by?: string;
  invites_remaining: number;
  created_at: Date;
  updated_at: Date;
}

// Invite System Types
export type InviteStatus = 'pending' | 'used' | 'expired' | 'revoked';

export interface Invite {
  id: string;
  code: string;
  created_by: string;
  used_by?: string;
  status: InviteStatus;
  expires_at: Date;
  created_at: Date;
  used_at?: Date;
}

// Updated Box interface with user association
export interface Box {
  id: string;
  name: string;
  description?: string;
  qrCode: string;
  imageUrl?: string;
  locationId: string;
  user_id: string;
  contents: string[];
  aiAnalysis?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Updated Location interface with user association
export interface Location {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  createdAt: Date;
}

export interface BoxContent {
  id: string;
  boxId: string;
  description: string;
  category?: string;
  quantity?: number;
  addedAt: Date;
}

// Auth-related utility types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// API Response types
export interface InviteValidationResponse {
  valid: boolean;
  message?: string;
}

export interface CreateInviteResponse {
  success: boolean;
  invite_code?: string;
  error?: string;
}

// Form validation types
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

// Profile update types
export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
} 