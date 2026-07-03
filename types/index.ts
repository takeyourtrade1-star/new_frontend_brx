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

/** @deprecated Legacy mock cart line — migrated to MarketplaceCartLine on persist v1. */
export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export type CartSellerAccountType = 'personal' | 'business';

export interface MarketplaceCartLine {
  lineId: string;
  source: 'sync' | 'marketplace';
  listingId: string | number;
  sellerId: string;
  /** Display name captured at add-to-cart time; enriched on cart page if missing. */
  sellerDisplayName?: string;
  /** Seller account type (personal / business). */
  sellerAccountType?: CartSellerAccountType | null;
  blueprintId?: number;
  title: string;
  imageUrl: string;
  priceCents: number;
  quantity: number;
  maxQuantity: number;
  condition?: string | null;
  language?: string | null;
}

export interface User {
  id: string;
  email: string;
  /** Username pubblico scelto in registrazione (se restituito dal backend) */
  username?: string | null;
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

export type PublicAccountType = 'personal' | 'business';

export interface PublicUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  country_code: string | null;
  account_type: PublicAccountType;
  bio?: string | null;
  member_since?: string | null;
  is_verified_seller?: boolean;
  feedback_score_pct?: number | null;
  feedback_count?: number;
}

export interface PublicUserProfileResponse {
  success: boolean;
  data: PublicUserProfile;
}

export interface PublicUsersSearchResponse {
  success: boolean;
  data: {
    items: PublicUserProfile[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PublicInventoryItem {
  id: number;
  blueprint_id: number;
  quantity: number;
  price_cents: number;
  properties?: Record<string, unknown> | null;
  description?: string | null;
  graded?: boolean;
  updated_at?: string | null;
}

export interface PublicUserCollectionResponse {
  success: boolean;
  data: {
    items: PublicInventoryItem[];
    total: number;
    limit: number;
    offset: number;
  };
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
  /** Approvazione specifica clausole vessatorie ex artt. 1341-1342 c.c. — tracciata separatamente da termsAccepted */
  specificClausesAccepted: boolean;
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

/** User data as returned by GET /api/auth/me (may include extra display fields). */
export type AuthMeUser = UserResponse & {
  name?: string | null;
  username?: string | null;
  image?: string | null;
  country?: string;
};

/** Response shape for GET /api/auth/me: flat, wrapped in user, or wrapped in data. */
export type AuthMeResponse =
  | AuthMeUser
  | { user: AuthMeUser }
  | { data: AuthMeUser | { user: AuthMeUser } };

/** Generic auth API response that may be flat or wrapped in data. */
export type AuthApiResponse<T> = T | { data: T };

/** Login response: direct tokens, pre-auth MFA, or wrapped in data. */
export type LoginResponse =
  | TokenResponse
  | PreAuthTokenResponse
  | { data: TokenResponse | PreAuthTokenResponse };

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
