
"use client";

import { useEffect, useRef, useState } from 'react';
import { ADSENSE_CLIENT_ID, AD_SLOT_IDS } from '@/lib/ads';

interface AdBannerProps {
  slot: keyof typeof AD_SLOT_IDS;
}

const AdBanner = ({ slot }: AdBannerProps) => {
  const adSlotId = AD_SLOT_IDS[slot];
  const isConfigured = ADSENSE_CLIENT_ID.startsWith('ca-pub-') && adSlotId !== "0000000000";
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adPushedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isConfigured || adPushedRef.current) {
      return;
    }
    
    // Check if the container is visible and has a width
    if (adContainerRef.current && adContainerRef.current.offsetWidth > 0) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`AdSense push error for slot '${slot}':`, err);
        }
      }
    }
  }, [isMounted, isConfigured, slot]);

  if (!isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="w-full min-h-[100px] flex flex-col items-center justify-center my-4 bg-yellow-100 border-2 border-dashed border-yellow-400 rounded-lg text-center p-4">
          <p className="font-bold text-yellow-800">ESPACIO PUBLICITARIO</p>
          <p className="text-yellow-700 text-sm">
            <strong>Slot de anuncio: '{slot}'</strong>
          </p>
           <p className="text-yellow-600 text-xs mt-1">
            (Este recuadro solo es visible en desarrollo. Se reemplazará por un anuncio real en producción si AdSense está configurado).
          </p>
        </div>
      );
    }
    return null;
  }

  // Using a key forces React to re-mount the component when the slot changes,
  // which helps ensure the ad script runs correctly for each unique ad placement.
  return (
    <div className="w-full min-h-[100px] flex items-center justify-center my-4" ref={adContainerRef} key={`ad-slot-${slot}`}>
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
