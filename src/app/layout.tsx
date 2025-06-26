
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/Header';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: 'Ruleta Rupestre',
  description: 'Una experiencia con amigos o familia',
  openGraph: {
    title: 'Ruleta Rupestre',
    description: 'Una experiencia con amigos o familia',
    images: [
      {
        url: 'https://placehold.co/1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Imagen de la Ruleta del juego Ruleta Rupestre',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ruleta Rupestre',
    description: 'Una experiencia con amigos o familia',
    images: ['https://placehold.co/1200x630.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster />
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
