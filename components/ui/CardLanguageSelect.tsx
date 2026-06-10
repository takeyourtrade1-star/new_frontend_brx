'use client';

import type { CardLanguageOption } from '@/lib/card-languages';
import { CardLanguageFlag } from '@/components/ui/CardLanguageFlag';
import { CustomSelect } from '@/components/ui/CustomSelect';

type CardLanguageSelectProps = {
  options: CardLanguageOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function CardLanguageSelect({
  options,
  value,
  onChange,
  className,
  disabled = false,
}: CardLanguageSelectProps) {
  const customOptions = options.map((o) => ({
    value: o.code,
    label: o.label,
    icon: <CardLanguageFlag code={o.code} size="xs" />,
  }));

  return (
    <CustomSelect
      options={customOptions}
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled}
    />
  );
}
