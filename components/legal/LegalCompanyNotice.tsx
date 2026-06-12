import { COMPANY_INFO } from '@/lib/legal/company-info';

export function LegalCompanyNotice({ className = '' }: { className?: string }) {
  const { legalName, legalAddress, legalForm, vatNumber, rea, pec } = COMPANY_INFO;

  return (
    <div className={`text-xs leading-relaxed text-white/80 ${className}`}>
      <p className="font-semibold text-white">{legalName}</p>
      <p>{legalForm}</p>
      <p>Sede legale: {legalAddress}</p>
      <p>P.IVA/C.F.: {vatNumber}</p>
      <p>REA: {rea}</p>
      <p>PEC: {pec}</p>
    </div>
  );
}
