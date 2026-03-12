import type { Metadata } from 'next';
import './globals.css';
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'GlamGestão - Controle de Vendas',
  description: 'Aplicativo profissional para revendedoras Avon e Natura',
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
      </head>
      <body className="font-body antialiased bg-background">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
