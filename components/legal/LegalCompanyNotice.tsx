import { COMPANY_INFO } from '@/lib/legal/company-info';
import { LegalCompanyCard } from '@/components/legal/LegalTypography';
import { LegalInlineLink } from '@/components/legal/LegalTypography';

export function LegalCompanyNotice({ className = '' }: { className?: string }) {
  const { legalName, legalAddress, legalForm, vatNumber, rea, pec } = COMPANY_INFO;

  return (
    <LegalCompanyCard>
      <div className={className}>
        <p className="font-display text-base font-bold text-[#1D3160]">{legalName}</p>
        <p className="mt-1 text-slate-600">{legalForm}</p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-500">Sede legale:</dt>
            <dd>{legalAddress}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-500">P.IVA/C.F.:</dt>
            <dd>{vatNumber}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-500">REA:</dt>
            <dd>{rea}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-500">PEC:</dt>
            <dd>
              <LegalInlineLink href={`mailto:${pec}`}>{pec}</LegalInlineLink>
            </dd>
          </div>
        </dl>
      </div>
    </LegalCompanyCard>
  );
}
