"use client";

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// IMPORTANTE: Reemplaza estos valores con tus propios IDs de AdSense
const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX";
const AD_SLOT_ID = "YYYYYYYYYY";

const AdBanner = () => {
  useEffect(() => {
    // Solo intenta cargar el anuncio si las credenciales son válidas
    if (ADSENSE_CLIENT_ID.startsWith('ca-pub-') && AD_SLOT_ID.length > 5) {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }
  }, []);

  // Muestra un mensaje de configuración si los IDs no están configurados
  if (!ADSENSE_CLIENT_ID.startsWith('ca-pub-') || AD_SLOT_ID === 'YYYYYYYYYY') {
      return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                    Anuncio: Para mostrar publicidad, configura tu ID de cliente y de bloque de anuncios en el archivo: <br/>
                    <strong className="font-mono text-xs">src/components/ads/AdBanner.tsx</strong>
                </p>
            </CardContent>
        </Card>
      )
  }

  // Renderiza el bloque de anuncios si los IDs están configurados
  return (
    <div className="w-full min-h-[100px] flex items-center justify-center bg-muted/30 rounded-md my-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={AD_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
