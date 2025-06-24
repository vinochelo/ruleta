"use client";

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// --- PASO 1: OBTÉN TUS CÓDIGOS DE ADSENSE ---
// 1. Ve a tu cuenta de Google AdSense.
// 2. Obtén tu ID de editor (empieza con "ca-pub-").
// 3. Crea un bloque de anuncios de display y obtén su ID de bloque (es un número).

// --- PASO 2: REEMPLAZA LOS VALORES DE EJEMPLO ---
// Reemplaza los siguientes valores con tus propios códigos.
const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX"; // <-- REEMPLAZA ESTO
const AD_SLOT_ID = "YYYYYYYYYY"; // <-- REEMPLAZA ESTO (es solo un número)

const AdBanner = () => {
  useEffect(() => {
    // Solo intenta cargar el anuncio si las credenciales parecen válidas
    if (ADSENSE_CLIENT_ID.startsWith('ca-pub-') && AD_SLOT_ID !== "YYYYYYYYYY") {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }
  }, []);

  // Muestra un mensaje de configuración si los IDs no están configurados correctamente
  if (!ADSENSE_CLIENT_ID.startsWith('ca-pub-') || AD_SLOT_ID === 'YYYYYYYYYY') {
      return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground space-y-1">
                    <span>Para mostrar publicidad, configura tus IDs de AdSense en estos archivos:</span>
                    <span className="block font-mono text-xs">1. src/app/layout.tsx (tu ID de editor)</span>
                    <span className="block font-mono text-xs">2. src/components/ads/AdBanner.tsx (ID de editor y ID de bloque)</span>
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
