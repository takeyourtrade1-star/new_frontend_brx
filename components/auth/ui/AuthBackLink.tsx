'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AuthBackLinkProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export function AuthBackLink({ href, label, onClick }: AuthBackLinkProps) {
  const { t } = useTranslation();
  const text = label ?? t('auth.back');
  const className =
    'self-start text-[#86868b] hover:text-[#1d1d1f] mb-4 flex items-center gap-1 text-[14px] font-medium transition-colors';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <ArrowLeft className="w-4 h-4" /> {text}
      </button>
    );
  }

  return (
    <Link href={href ?? '/login'} className={className}>
      <ArrowLeft className="w-4 h-4" /> {text}
    </Link>
  );
}
