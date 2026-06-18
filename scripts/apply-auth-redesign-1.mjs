import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = process.cwd();
const write = (rel, content) => {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
  console.log('wrote', rel);
};

write('components/auth/ui/AuthCard.tsx', "'use client';\n\nimport type { ReactNode } from 'react';\nimport { cn } from '@/lib/utils';\nimport { AUTH_CARD_CLASS, AUTH_CARD_INNER_CLASS } from './auth-styles';\n\ninterface AuthCardProps {\n  children: ReactNode;\n  className?: string;\n  innerClassName?: string;\n}\n\nexport function AuthCard({ children, className, innerClassName }: AuthCardProps) {\n  return (\n    <div className={cn(AUTH_CARD_CLASS, className)}>\n      <div className={cn(AUTH_CARD_INNER_CLASS, innerClassName)}>{children}</div>\n    </div>\n  );\n}\n");

write('components/auth/ui/index.ts', "export * from './auth-styles';\nexport { AuthCard } from './AuthCard';\nexport { AuthPageHeader } from './AuthPageHeader';\nexport { AuthBackLink } from './AuthBackLink';\nexport { AuthField } from './AuthField';\nexport { AuthSubmitButton } from './AuthSubmitButton';\nexport { AuthSecondaryButton } from './AuthSecondaryButton';\nexport { AuthFooterLinks } from './AuthFooterLinks';\nexport { AuthRequiredLegend } from './AuthRequiredLegend';\nexport { AuthStepIndicator } from './AuthStepIndicator';\n");

console.log('part1 ok');
