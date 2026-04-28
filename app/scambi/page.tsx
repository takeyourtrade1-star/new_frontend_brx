import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'TCG Express | Ebartex',
  robots: { index: false, follow: false },
};

export default function ScambiPage() {
  permanentRedirect('/tcg-express');
}
