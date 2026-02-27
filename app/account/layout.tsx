import { Header } from '@/components/layout/Header';
import { AccountShell } from '@/components/feature/account/AccountShell';

export const metadata = {
  title: 'Account | Ebartex',
  description: 'Area personale e impostazioni account',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F0' }}>
      <Header />
      <AccountShell>{children}</AccountShell>
    </div>
  );
}
