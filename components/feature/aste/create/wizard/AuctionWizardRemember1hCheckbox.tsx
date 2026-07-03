'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

export type AuctionWizardRemember1hCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function AuctionWizardRemember1hCheckbox({
  checked,
  onCheckedChange,
  className,
}: AuctionWizardRemember1hCheckboxProps) {
  const { t } = useTranslation();

  return (
    <label
      className={cn(
        'mt-2 flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-zinc-600',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-3 w-3 rounded border-zinc-300 text-primary focus:ring-primary/25"
      />
      {t('auctions.createRemember1h')}
    </label>
  );
}
