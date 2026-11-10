import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/context';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { PWAInstaller } from '@/components/PWAInstaller';

export const metadata: Metadata = {
  title: 'Circle Fund | Fællesskabspulje Danmark',
  description: 'Gennemskuelig fællesskabsopsparing, månedlig indsamling på 50 DKK via MobilePay og gensidig støtte.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Circle Fund',
  },
};

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <I18nProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 pb-20 lg:pb-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </main>
              <MobileNav />
              <PWAInstaller />
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
