import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';

describe('TournamentVideoOverlay', () => {
  it('finishes on video load failure and ignores duplicate media events', () => {
    const onEnded = vi.fn();
    const { container } = render(
      <TournamentVideoOverlay redirectImmediately onEnded={onEnded} />
    );
    const video = container.querySelector('video');

    expect(video).toBeTruthy();

    fireEvent.error(video as HTMLVideoElement);
    fireEvent.ended(video as HTMLVideoElement);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});
