import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/Header';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Ruleta Rupestre',
  description: 'A fun Pictionary-style roulette game',
};

// IMPORTANTE: Reemplaza este valor con tu propio ID de cliente de AdSense
const ADSENSE_CLIENT_ID = "ca-pub-4231719422597751";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        {ADSENSE_CLIENT_ID.startsWith('ca-pub-') && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="font-body antialiased">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
