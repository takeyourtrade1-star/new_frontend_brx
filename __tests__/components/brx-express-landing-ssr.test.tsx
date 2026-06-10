import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrxExpressLandingPage } from '@/components/feature/brx-express/BrxExpressLandingPage';

describe('BrxExpressLandingPage SSR markup', () => {
  it('does not server-render the landing content in a hidden animation state', () => {
    const markup = renderToStaticMarkup(<BrxExpressLandingPage />);

    expect(markup).toContain('BRX Express: La Rivoluzione della');
    expect(markup).not.toContain('opacity:0;transform:translateY(24px)');
  });
});
