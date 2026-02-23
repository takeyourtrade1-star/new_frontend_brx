import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Ebartex | Enterprise E-Commerce',
  description: 'Enterprise-level e-commerce platform',
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
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <Providers>
          <div className="flex-1 flex flex-col">
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
