import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'LilianPro - Controle de Vendas',
  description: 'Aplicativo profissional para revendedoras Avon e Natura',
  applicationName: 'LilianPro',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LilianPro',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#C2185B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
