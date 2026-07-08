import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';
import { AssoGate } from '@/components/mascotte/AssoGate';
import { BuildInfoBadge } from '@/components/dev/BuildInfoBadge';
import { IOSInstallPromptGate } from '@/components/pwa/IOSInstallPromptGate';
import { SITE_URL } from '@/lib/config';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ebartex | Marketplace di Carte Collezionabili',
    template: '%s | Ebartex',
  },
  description:
    'Compra e vendi carte collezionabili di Magic: The Gathering, Pokémon, One Piece e altri giochi. Aste, trattative e boutique ufficiale Ebartex.',
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
  icons: { icon: '/logo-pwa.svg' },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://ebartex.com',
    siteName: 'Ebartex',
    title: 'Ebartex | Marketplace di Carte Collezionabili',
    description:
      'Compra e vendi carte collezionabili. Aste, trattative e boutique ufficiale.',
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
    description: 'Compra e vendi carte collezionabili.',
    images: ['/brx_bg.png'],
  },
};

/** URL sfondo BRX per CSS (da CDN se configurato). Sanitizza l'env con una
 *  whitelist di caratteri URL per evitare injection nel blocco <style> inline. */
function getBrxBgCssUrl(): string {
  const cdn = (process.env.NEXT_PUBLIC_CDN_URL || '')
    .replace(/\/+$/, '')
    .replace(/[^a-zA-Z0-9.:/-]/g, '');
  return cdn ? `${cdn}/images/brx_bg.png` : '/brx_bg.png';
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Escape backslash/apici prima dell'iniezione in url("...") dentro <style>.
  const brxBgUrl = getBrxBgCssUrl().replace(/[\\"']/g, '\\$&');

  return (
    <html lang="it" suppressHydrationWarning className={nunito.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo-pwa.svg" />
        <meta name="theme-color" content="#FF7300" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EbarteX" />

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black focus:shadow-lg focus:ring-2 focus:ring-[#FF7300]"
        >
          Vai al contenuto principale
        </a>
        <IOSInstallPromptGate />
        <Providers>
          <div className="flex-1 flex flex-col" id="main-content" tabIndex={-1}>
            {children}
            <ConditionalFooter />
          </div>
          <AssoGate />
          <BuildInfoBadge />
        </Providers>
      </body>
    </html>
  );
}
