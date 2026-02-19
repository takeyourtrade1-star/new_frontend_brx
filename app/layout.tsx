import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Ebartex | Enterprise E-Commerce',
  description: 'Enterprise-level e-commerce platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
