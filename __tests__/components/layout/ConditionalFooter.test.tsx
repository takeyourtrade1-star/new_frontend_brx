import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}));

vi.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe('ConditionalFooter', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    '/c/asta-foto',
    '/c/asta-foto/sessione',
    '/c/vendi-foto',
    '/c/vendi-foto/sessione',
    '/tornei',
    '/tornei/calendario',
  ])('nasconde il footer su %s', (pathname) => {
    usePathnameMock.mockReturnValue(pathname);

    render(<ConditionalFooter />);

    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it.each([
    '/',
    '/products/boutique',
    '/c/vendi-fotografia',
    '/c/asta-fotografia',
  ])('mostra il footer su %s', (pathname) => {
    usePathnameMock.mockReturnValue(pathname);

    render(<ConditionalFooter />);

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
