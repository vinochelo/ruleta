"use client";

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID, AD_SLOT_IDS } from '@/lib/ads';

interface AdBannerProps {
  slot: keyof typeof AD_SLOT_IDS;
}

const AdBanner = ({ slot }: AdBannerProps) => {
  const adSlotId = AD_SLOT_IDS[slot];
  const isConfigured = ADSENSE_CLIENT_ID.startsWith('ca-pub-') && adSlotId !== "0000000000";
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConfigured && adContainerRef.current) {
      const pushAd = () => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`AdSense push error for slot '${slot}':`, err);
          }
        }
      };

      // A more robust way to push ads:
      // Check the container's width before pushing. If it's 0, it means the
      // component (like a modal) is not yet visible or sized. We retry a few
      // times with a short delay.
      const checkAndPush = (retries = 5) => {
        if (adContainerRef.current && adContainerRef.current.offsetWidth > 0) {
          pushAd();
        } else if (retries > 0) {
          setTimeout(() => checkAndPush(retries - 1), 100);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error(`AdSense push failed for slot '${slot}': Container width is 0 after retries.`);
          }
        }
      };
      
      checkAndPush();
    }
  }, [isConfigured, slot]);

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
    <div ref={adContainerRef} className="w-full min-h-[100px] flex items-center justify-center my-4" key={`ad-slot-${slot}`}>
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
