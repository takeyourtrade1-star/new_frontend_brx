import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenVideoIntro, markVideoIntroSeen } from '@/lib/utils/video-intro-tracker';

describe('video-intro-tracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when intro has never been seen by guest or user', () => {
    expect(hasSeenVideoIntro('scambi')).toBe(false);
    expect(hasSeenVideoIntro('aste', 'user_123')).toBe(false);
    expect(hasSeenVideoIntro('tornei', 456)).toBe(false);
  });

  it('marks and checks intro seen for guest', () => {
    markVideoIntroSeen('scambi');
    expect(hasSeenVideoIntro('scambi')).toBe(true);
    expect(hasSeenVideoIntro('aste')).toBe(false);
  });

  it('marks and checks intro seen for specific user account', () => {
    markVideoIntroSeen('aste', 'user_abc');
    expect(hasSeenVideoIntro('aste', 'user_abc')).toBe(true);
    expect(hasSeenVideoIntro('aste', 'user_xyz')).toBe(true); // guest fallback is also set
    expect(hasSeenVideoIntro('tornei', 'user_abc')).toBe(false);
  });

  it('handles multiple features independently', () => {
    markVideoIntroSeen('tornei', 10);
    expect(hasSeenVideoIntro('tornei', 10)).toBe(true);
    expect(hasSeenVideoIntro('scambi', 10)).toBe(false);
    expect(hasSeenVideoIntro('aste', 10)).toBe(false);
  });
});
