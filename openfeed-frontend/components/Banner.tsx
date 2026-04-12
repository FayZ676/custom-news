"use client";

import { useState, useEffect } from "react";
import { getUserWeatherForecast, WeatherForecast } from "@/lib/weather";
import { getEdition, getUserLocation, UserLocation } from "@/lib/utils";
import { Database } from "@/lib/supabase/supabase.types";
import { useTickerScroll } from "@/hooks/useTickerScroll";

export interface BannerProps {
  date: string;
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
}

export function Banner({ date, feeds }: BannerProps) {
  const edition = getEdition();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const { tickerRef, pause, resume, handleWheel } = useTickerScroll();

  useEffect(() => {
    getUserLocation().then(async (loc) => {
      if (!loc) return;
      setLocation(loc);
      setForecast(await getUserWeatherForecast(loc.lat, loc.lon));
    });
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <hr className="border-t" />
      <div className="grid grid-cols-[1fr_3fr_1fr] items-center">
        <span className="text-left text-sm">
          VOL. {edition.volume}, No. {edition.edition}
        </span>
        <span className="text-center font-semibold">
          {location?.city ?? "Location N/A"}, {date}
        </span>
        <span className="text-sm text-right self-center">
          {forecast
            ? `${forecast.temperature} °F, ${forecast.description}`
            : "Weather N/A"}
        </span>
      </div>
      <hr className="border-t-2" />
      <div
        ref={tickerRef}
        className="overflow-x-hidden whitespace-nowrap text-sm cursor-ew-resize"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onWheel={handleWheel}
      >
        <div className="inline-flex">
          {[...feeds, ...feeds].map((feed, i) => (
            <a key={`${feed.id}-${i}`} href={feed.url} className="px-2 italic">
              {feed.title}
            </a>
          ))}
        </div>
      </div>
      <hr className="border-t" />
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <hr className="border-neutral-300 border-t" />
      <div className="grid grid-cols-[1fr_3fr_1fr] items-center">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-4 w-48 rounded mx-auto" />
        <div className="skeleton h-4 w-24 rounded ml-auto" />
      </div>
      <hr className="border-neutral-300 border-t-2" />
      <div className="skeleton h-5 w-full rounded" />
      <hr className="border-neutral-300 border-t" />
    </div>
  );
}
