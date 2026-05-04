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
  /** Codice paese dell'utente (es. IT), se restituito dal backend */
  country?: string;
  /** Se true, il backend ha abilitato la visibilità degli scambi per questo utente */
  show_scambi?: boolean;
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

/** Login via email */
export interface EmailLoginCredentials {
  email: string;
  username?: never;
  password: string;
  website_url?: string; // Honeypot field
}

/** Login via username */
export interface UsernameLoginCredentials {
  email?: never;
  username: string;
  password: string;
  website_url?: string; // Honeypot field
}

/** Union type: email OR username login, never both */
export type LoginCredentials = EmailLoginCredentials | UsernameLoginCredentials;

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
  remember_device?: boolean;
}

export interface MFAEnableResponse {
  qr_code_url: string;
  secret: string;
}

export interface MFAVerifySetupData {
  mfa_code: string;
}

export interface MFADisableData {
  password: string;
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
  /** Se true, il backend ha abilitato la visibilità degli scambi per questo utente */
  show_scambi?: boolean;
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

// ==========================================
// PASSWORD RESET FLOW TYPES
// ==========================================

export type PasswordResetRequestPayload = { email: string };
export type PasswordResetVerifyCodePayload = { email: string; code: string };
export type PasswordResetConfirmInitPayload = { reset_token: string; new_password: string };
export type PasswordResetConfirmFinalPayload = { confirm_token: string; code: string };
export type PasswordResetTokenResponse = {
  token: string;
  token_type: "password_reset" | "password_reset_confirm";
  expires_in_seconds: number;
};
export type MessageResponse = { message: string };
