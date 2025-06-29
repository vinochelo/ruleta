
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/Header';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL('https://rupestre.vercel.app/'),
  title: 'Ruleta Pictionary | El Juego de Pictionary Online',
  description: 'Juega a Ruleta Pictionary, un divertido juego de Pictionary online para adivinar palabras con amigos y familia. ¡Gira la ruleta, dibuja y que comience la diversión!',
  openGraph: {
    title: 'Ruleta Pictionary | El Juego de Pictionary Online',
    description: '¡El Pictionary online más divertido! Gira la ruleta, dibuja la palabra secreta y que tu equipo adivine. Ideal para fiestas y reuniones familiares.',
    images: [
      {
        url: 'https://placehold.co/1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Una ruleta de colores para un juego de mesa, mostrando diferentes categorías.',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ruleta Pictionary | El Juego de Pictionary Online',
    description: '¡El Pictionary online más divertido! Gira la ruleta, dibuja la palabra secreta y que tu equipo adivine.',
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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4231719422597751"
          crossOrigin="anonymous"
        />
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
