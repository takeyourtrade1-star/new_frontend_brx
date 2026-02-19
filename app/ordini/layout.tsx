import { Header } from '@/components/layout/Header';

export default function OrdiniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
