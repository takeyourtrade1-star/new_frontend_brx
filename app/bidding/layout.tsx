import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offerte | Ebartex',
  description: 'Gestisci le tue offerte sulle aste Ebartex.',
};

export default function BiddingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
