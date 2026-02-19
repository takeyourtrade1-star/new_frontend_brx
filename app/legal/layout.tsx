import { Header } from '@/components/layout/Header';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
      <Header />
      <main className="w-full flex-1">{children}</main>
    </div>
  );
}
