import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Footer } from '@/components/layout/Footer';
import { CardMascotteGate } from '@/components/dev/CardMascotteGate';
import { IOSInstallPrompt } from '@/components/pwa/IOSInstallPrompt';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Ebartex | Marketplace di Carte Collezionabili',
    template: '%s | Ebartex',
  },
  description:
    'Compra, vendi e scambia carte collezionabili di Magic: The Gathering, Pokémon, One Piece e altri giochi. Aste, trattative e boutique ufficiale Ebartex.',
  keywords: [
    'carte collezionabili',
    'Magic The Gathering',
    'Pokémon TCG',
    'One Piece Card Game',
    'aste carte',
    'marketplace carte',
    'Ebartex',
  ],
  authors: [{ name: 'Ebartex', url: 'https://ebartex.com' }],
  creator: 'Ebartex',
  publisher: 'Ebartex',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://ebartex.com',
    siteName: 'Ebartex',
    title: 'Ebartex | Marketplace di Carte Collezionabili',
    description:
      'Compra, vendi e scambia carte collezionabili. Aste, trattative e boutique ufficiale.',
    images: [
      {
        url: '/brx_bg.png',
        width: 1200,
        height: 630,
        alt: 'Ebartex - Marketplace di Carte Collezionabili',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ebartex | Marketplace di Carte Collezionabili',
    description: 'Compra, vendi e scambia carte collezionabili.',
    images: ['/brx_bg.png'],
  },
};

/** URL sfondo BRX per CSS (da CDN se configurato). */
function getBrxBgCssUrl(): string {
  const cdn = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');
  if (cdn) return `${cdn}/images/brx_bg.png`;
  return '/brx_bg.png';
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brxBgUrl = getBrxBgCssUrl();
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF7300" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EbarteX" />
        {/* Preload font principale SF Compact (tutti i pesi) per evitare FOUT */}
        <link
          rel="preload"
          href="/fonts/SF-Compact-Rounded-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SF-Compact-Rounded-Medium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SF-Compact-Rounded-Heavy.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* Display font - using existing .otf and .ttf files */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--brx-bg-url:url("${brxBgUrl}");}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t!=='light');})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <IOSInstallPrompt />
        <Providers>
          <div className="flex-1 flex flex-col" id="main-content">
            {children}
            <Footer />
          </div>
          <CardMascotteGate />
        </Providers>
      </body>
    </html>
  );
}
