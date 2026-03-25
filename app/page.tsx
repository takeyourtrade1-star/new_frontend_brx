import { Header } from '@/components/layout/Header';
import { LandingWelcome } from '@/components/feature/LandingWelcome';

export const metadata = {
  title: 'Ebartex | Compra, Vendi e Scambia',
  description:
    'Scopri le migliori opportunità del mercato di carte collezionabili.',
};

export default function LandingPage() {
  return (
    <>
      <Header />
      <LandingWelcome />
    </>
  );
}
