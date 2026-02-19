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
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          'linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url("/brx_bg.png"), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundSize: 'cover, auto, cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header />
      <AccountShell>{children}</AccountShell>
    </div>
  );
}
