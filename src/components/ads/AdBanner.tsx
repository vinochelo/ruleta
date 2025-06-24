"use client";

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// --- PASO 1: OBTÉN TUS CÓDIGOS DE ADSENSE ---
// 1. Ve a tu cuenta de Google AdSense.
// 2. Obtén tu ID de editor (empieza con "ca-pub-").
// 3. Crea BLOQUES DE ANUNCIOS de display para cada lugar donde quieras mostrar publicidad.
//    - Uno para el banner principal (slot "main").
//    - Uno para el modal de resultados (slot "results").
//    - Uno para el modal de ganador (slot "winner").
// 4. Cada bloque de anuncios te dará su propio ID numérico.

// --- PASO 2: REEMPLAZA LOS VALORES DE EJEMPLO ---
// Este es tu ID de editor global. Reemplázalo también en `src/app/layout.tsx`.
const ADSENSE_CLIENT_ID = "ca-pub-4231719422597751"; 

// Reemplaza estos IDs de bloque de anuncios con los tuyos.
const AD_SLOT_IDS = {
  main: 7120343438,     // Para el banner en la página principal
  results: 9519276066,   // Para el banner en el modal de resultados/timer
  winner: 9519276066,    // Para el banner en el modal de ganador
};

interface AdBannerProps {
  slot: keyof typeof AD_SLOT_IDS;
}

// Función para verificar si un ID es un placeholder (contiene letras o no es un número)
const isPlaceholder = (id: string) => !/^\d+$/.test(id);

const AdBanner = ({ slot }: AdBannerProps) => {
  const adSlotId = AD_SLOT_IDS[slot];

  useEffect(() => {
    // Solo intenta cargar el anuncio si las credenciales parecen válidas (no son placeholders)
    if (ADSENSE_CLIENT_ID.startsWith('ca-pub-') && !isPlaceholder(adSlotId.toString())) {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }
  }, [adSlotId]);

  // Muestra un mensaje de configuración si los IDs no están configurados correctamente
  if (!ADSENSE_CLIENT_ID.startsWith('ca-pub-') || isPlaceholder(adSlotId.toString())) {
      return (
        <Card className="bg-muted/50 border-dashed w-full my-4">
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground space-y-1">
                    <span>Para mostrar publicidad aquí, configura tus IDs de AdSense.</span>
                    <span className="block font-mono text-xs">Tu ID de Editor: <b>src/app/layout.tsx</b></span>
                    <span className="block font-mono text-xs">ID del bloque '{slot}': <b>src/components/ads/AdBanner.tsx</b></span>
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
        data-ad-slot={adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
