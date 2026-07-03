import type { AuthMeUser, User, UserPreferences, UserResponse } from '@/types';

/** Default preferences when backend does not return them */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'it',
  is_onboarding_completed: false,
};

/** Normalize user so preferences always has shape */
export function normalizeUser(
  user: UserResponse | User | AuthMeUser | null
): User | null {
  if (!user) return null;

  const prefs = user.preferences;
  const preferences: UserPreferences = {
    theme: (prefs?.theme ?? DEFAULT_PREFERENCES.theme) as
      | 'light'
      | 'dark'
      | 'system',
    language: prefs?.language ?? DEFAULT_PREFERENCES.language,
    is_onboarding_completed:
      prefs?.is_onboarding_completed ??
      DEFAULT_PREFERENCES.is_onboarding_completed,
  };

  const u = user as UserResponse & {
    name?: string | null;
    username?: string | null;
    image?: string | null;
    country?: string;
  };

  return {
    id: user.id,
    email: user.email,
    username: u.username ?? null,
    /** Backend può esporre `username` senza `name`: usiamolo come display name */
    name: u.name ?? u.username ?? null,
    image: u.image ?? null,
    account_status: user.account_status,
    mfa_enabled: user.mfa_enabled,
    created_at: user.created_at,
    preferences,
    country: u.country ?? undefined,
    show_scambi: u.show_scambi ?? false,
  };
}
