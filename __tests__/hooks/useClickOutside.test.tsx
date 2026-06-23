import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useRef } from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';

function Probe({ onClose, enabled }: { onClose: () => void; enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, enabled);
  return (
    <div>
      <div ref={ref} data-testid="inside">dentro</div>
      <div data-testid="outside">fuori</div>
    </div>
  );
}

describe('useClickOutside', () => {
  it('chiama onClose al click esterno quando abilitato', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<Probe onClose={onClose} enabled />);
    getByTestId('outside').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('NON chiama onClose al click interno', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<Probe onClose={onClose} enabled />);
    getByTestId('inside').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('NON sottoscrive quando disabilitato', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<Probe onClose={onClose} enabled={false} />);
    getByTestId('outside').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
