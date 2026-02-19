/**
 * Shared domain types for Ebartex e-commerce.
 * Add product, cart, user, order types here.
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  categoryId: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  account_status?: string;
  mfa_enabled?: boolean;
  created_at?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  is_onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// ==========================================
// AUTHENTICATION TYPES
// ==========================================

export interface LoginCredentials {
  email: string;
  password: string;
  website_url?: string; // Honeypot field
}

export interface RegisterData {
  website_url?: string; // Honeypot field (must be empty)
  username: string;
  email: string;
  password: string;
  account_type: 'personal' | 'business';
  country: string;
  phone_prefix: string;
  phone: string;
  vat_prefix?: string;
  first_name?: string; // Required for personal
  last_name?: string; // Required for personal
  ragione_sociale?: string; // Required for business
  piva?: string; // Required for business
  termsAccepted: boolean;
  privacyAccepted: boolean;
  cancellationAccepted: boolean;
  adultConfirmed: boolean;
}

export interface VerifyMFAData {
  pre_auth_token: string;
  mfa_code: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PreAuthTokenResponse {
  pre_auth_token: string;
  mfa_required: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  account_status: string;
  mfa_enabled: boolean;
  created_at: string;
  preferences?: UserPreferences;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface Address {
  id: string;
  label: string;
  nome: string;
  via: string;
  cap: string;
  citta: string;
  paese: string;
}
