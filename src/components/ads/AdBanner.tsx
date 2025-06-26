
"use client";

import { useEffect } from 'react';
import { ADSENSE_CLIENT_ID, AD_SLOT_IDS } from '@/lib/ads';

interface AdBannerProps {
  slot: keyof typeof AD_SLOT_IDS;
}

const AdBanner = ({ slot }: AdBannerProps) => {
  const adSlotId = AD_SLOT_IDS[slot];
  const isConfigured = ADSENSE_CLIENT_ID.startsWith('ca-pub-') && adSlotId !== "0000000000";
  
  // Slots inside modals might need a delay for the container to get its width.
  const isModalSlot = slot === 'results' || slot === 'winner';

  useEffect(() => {
    if (isConfigured) {
      const pushAd = () => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          // In development, it's useful to see these errors.
          if (process.env.NODE_ENV === 'development') {
            console.error(`AdSense push error for slot '${slot}':`, err);
          }
        }
      };
      
      // If it's a modal slot, wait a bit for the modal to animate and get its dimensions.
      if (isModalSlot) {
        const timer = setTimeout(pushAd, 300); // 300ms should be enough for animations
        return () => clearTimeout(timer);
      } else {
        pushAd();
      }
    }
  }, [isConfigured, slot, isModalSlot]);

  if (!isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="w-full min-h-[100px] flex items-center justify-center my-4 bg-muted/50 border-2 border-dashed rounded-lg text-center p-4">
          <p className="text-muted-foreground text-sm">
            <strong>Ad Slot: '{slot}'</strong><br/>
            To enable ads, edit <code>src/lib/ads.ts</code> with your AdSense codes.
          </p>
        </div>
      );
    }
    return null;
  }

  // Using a key forces React to re-mount the component when the slot changes,
  // which helps ensure the ad script runs correctly for each unique ad placement.
  return (
    <div className="w-full min-h-[100px] flex items-center justify-center my-4" key={`ad-slot-${slot}`}>
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
