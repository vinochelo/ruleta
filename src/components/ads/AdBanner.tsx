
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
  const adPushedRef = useRef(false); // Ref to track if the ad has been pushed

  useEffect(() => {
    // Only proceed if the ad is configured and hasn't been pushed yet.
    if (isConfigured && adContainerRef.current && !adPushedRef.current) {
      const pushAd = () => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adPushedRef.current = true; // Mark as pushed to prevent duplicates
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`AdSense push error for slot '${slot}':`, err);
          }
        }
      };

      // Retry mechanism to wait for the container to become visible.
      // Increased retries and delay for more robustness, especially with animations.
      const checkAndPush = (retries = 15, delay = 150) => {
        // If the container is visible and has a width, push the ad.
        if (adContainerRef.current && adContainerRef.current.offsetWidth > 0) {
          pushAd();
        } 
        // If we still have retries left, wait and try again.
        else if (retries > 0) {
          setTimeout(() => checkAndPush(retries - 1, delay), delay);
        } 
        // If we're out of retries, log an error in development.
        else {
          if (process.env.NODE_ENV === 'development') {
            console.error(`AdSense push failed for slot '${slot}': Container width is 0 after all retries.`);
          }
        }
      };
      
      checkAndPush();
    }
  }, [isConfigured, slot]);

  // Reset the pushed status if the slot changes, allowing a new ad to be pushed.
  useEffect(() => {
    adPushedRef.current = false;
  }, [slot]);

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
