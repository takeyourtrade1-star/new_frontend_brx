import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  parsePrivateCashInput,
  PrivateCashControls,
  privateCashCoinCount,
} from '@/components/feature/scambi/TradeProposalPage';

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/i18n/useIntlLocale', () => ({
  useIntlLocale: () => 'it-IT',
}));

afterEach(() => {
  vi.restoreAllMocks();
});

function CashHarness() {
  const [side, setSide] = useState<'none' | 'offered' | 'requested'>('none');
  const [amountCents, setAmountCents] = useState(0);

  return (
    <>
      <PrivateCashControls
        side={side}
        amountCents={amountCents}
        onSideChange={setSide}
        onAmountChange={setAmountCents}
      />
      <output data-testid="cash-cents">{amountCents}</output>
    </>
  );
}

describe('PrivateCashControls', () => {
  it('permette di comporre una cifra decimale senza riscrivere il valore a ogni tasto', () => {
    render(<CashHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'trades.privateCash.offer' }));

    const input = screen.getByRole('textbox', { name: 'trades.privateCash.amount' });
    fireEvent.change(input, { target: { value: '1' } });
    expect(input).toHaveValue('1');
    expect(screen.getByTestId('cash-cents')).toHaveTextContent('100');

    fireEvent.change(input, { target: { value: '12,' } });
    expect(input).toHaveValue('12,');
    fireEvent.change(input, { target: { value: '12,34' } });
    expect(input).toHaveValue('12,34');
    expect(screen.getByTestId('cash-cents')).toHaveTextContent('1234');

    fireEvent.blur(input);
    expect(input).toHaveValue('12.34');
  });

  it('accetta punto o virgola, rifiuta più di due decimali e non ha limite a 10k', () => {
    expect(parsePrivateCashInput('9.50')).toBe(950);
    expect(parsePrivateCashInput('9,50')).toBe(950);
    expect(parsePrivateCashInput('9,')).toBe(900);
    expect(parsePrivateCashInput(',50')).toBe(50);
    expect(parsePrivateCashInput('9,999')).toBeNull();
    expect(parsePrivateCashInput('oltre')).toBeNull();
    expect(parsePrivateCashInput('20000')).toBe(2_000_000);
  });

  it('aumenta e diminuisce il numero di monete in base al compenso', () => {
    expect(privateCashCoinCount(0)).toBe(0);
    expect(privateCashCoinCount(500)).toBe(1);
    expect(privateCashCoinCount(501)).toBe(2);
    expect(privateCashCoinCount(2_500)).toBe(5);
    expect(privateCashCoinCount(4_000)).toBe(8);
    expect(privateCashCoinCount(100_000)).toBe(8);
  });
});
