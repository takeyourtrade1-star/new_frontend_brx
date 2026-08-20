import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhotoPairingSession } from '@/lib/hooks/use-photo-pairing-session';

const mocks = vi.hoisted(() => ({
  createListingSession: vi.fn(),
  listSessionPhotos: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('@/lib/api/auction-photo-client', () => ({
  createPhotoPairingSession: vi.fn(),
  listPairingSessionPhotos: mocks.listSessionPhotos,
}));

vi.mock('@/lib/api/listing-photo-client', () => ({
  createListingPhotoPairingSession: mocks.createListingSession,
}));

vi.mock('@/lib/pairing-session-revoke', () => ({
  revokePairingSessionSafe: mocks.revokeSession,
}));

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderPairingHook() {
  return renderHook(() =>
    usePhotoPairingSession({
      stepId: 'confirm',
      photoStepId: 'confirm',
      contextType: 'listing',
      qrBasePath: '/c/vendi-foto',
      maxPhotos: 8,
      listingPhotos: [],
      setListingPhotos: vi.fn(),
      toastMessageKey: 'vendi.sell.photoReceivedFromPhone',
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listSessionPhotos.mockResolvedValue([]);
  mocks.revokeSession.mockResolvedValue(undefined);
});

describe('usePhotoPairingSession', () => {
  it('revoca la sessione QR quando il wizard Vendi viene smontato', async () => {
    mocks.createListingSession.mockResolvedValue({
      session_id: '5a8a649d-d591-48ab-adbe-4fd851b30d11',
      upload_token: 'pairing-token',
      expires_at: '2026-08-20T15:00:00Z',
      context_type: 'listing',
    });
    const hook = renderPairingHook();

    await act(async () => {
      await hook.result.current.openPhoneUploadModal();
    });
    await waitFor(() => expect(hook.result.current.hasActiveSession).toBe(true));

    hook.unmount();

    expect(mocks.revokeSession).toHaveBeenCalledWith(
      '5a8a649d-d591-48ab-adbe-4fd851b30d11',
      { keepalive: true },
    );
  });

  it('revoca anche una sessione creata senza token utilizzabile', async () => {
    mocks.createListingSession.mockResolvedValue({
      session_id: '15ee385e-d3c0-40da-a1d9-39ad2d69c71f',
      upload_token: '',
      expires_at: '2026-08-20T15:00:00Z',
      context_type: 'listing',
    });
    const hook = renderPairingHook();

    await act(async () => {
      await hook.result.current.openPhoneUploadModal();
    });

    expect(mocks.revokeSession).toHaveBeenCalledWith(
      '15ee385e-d3c0-40da-a1d9-39ad2d69c71f',
    );
    expect(hook.result.current.hasActiveSession).toBe(false);
  });
});
