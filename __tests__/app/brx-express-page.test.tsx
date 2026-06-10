import { createElement, forwardRef, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BrxExpressPage, { metadata } from '@/app/brx-express/page';

vi.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="brx-express-header" />,
}));

const motionProps = new Set([
  'animate',
  'custom',
  'exit',
  'initial',
  'layout',
  'transition',
  'variants',
  'viewport',
  'whileHover',
  'whileInView',
  'whileTap',
]);

function stripMotionProps(props: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !motionProps.has(key)));
}

function createMotionComponent(tag: string) {
  return forwardRef<HTMLElement, Record<string, unknown> & { children?: ReactNode }>(
    ({ children, ...props }, ref) => createElement(tag, { ...stripMotionProps(props), ref }, children),
  );
}

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => createMotionComponent(tag),
    },
  ),
}));

describe('BrxExpressPage', () => {
  it('renders the BRX Express landing content', () => {
    render(<BrxExpressPage />);

    expect(screen.getByTestId('brx-express-header')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /BRX Express: La Rivoluzione della\s*Spedizione Carte 24h/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Logistica Decentralizzata')).toBeInTheDocument();
    expect(screen.getByText('Esplora la Control Tower')).toBeInTheDocument();
    expect(screen.getAllByText('Consegna in 24h').length).toBeGreaterThan(0);
  });

  it('keeps descriptive BRX Express metadata on the route', () => {
    expect(metadata.title).toBe('BRX Express | Spedizione Carte in 24h');
    expect(metadata.description).toContain('logistica decentralizzata');
    expect(metadata.openGraph).toMatchObject({
      title: 'BRX Express | Spedizione Carte in 24h',
    });
  });
});
