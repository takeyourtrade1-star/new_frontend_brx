import type { HTMLAttributes, ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TournamentVideoOverlay } from '@/components/feature/tournaments/TournamentVideoOverlay';

vi.mock('framer-motion', () => {
  type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    transition?: unknown;
  };

  const MockMotionDiv = ({
    children,
    animate,
    exit,
    initial,
    transition,
    ...props
  }: MotionDivProps) => <div {...props}>{children}</div>;

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: {
      div: MockMotionDiv,
    },
  };
});

describe('TournamentVideoOverlay', () => {
  it('completes the redirect transition when the video cannot play', () => {
    const onEnded = vi.fn();
    const { container } = render(
      <TournamentVideoOverlay redirectImmediately onEnded={onEnded} />
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    fireEvent.error(video as HTMLVideoElement);
    fireEvent.ended(video as HTMLVideoElement);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('handles source load errors as a transition completion', () => {
    const onEnded = vi.fn();
    const { container } = render(
      <TournamentVideoOverlay redirectImmediately onEnded={onEnded} />
    );

    const source = container.querySelector('source');
    expect(source).not.toBeNull();

    fireEvent.error(source as HTMLSourceElement);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});
