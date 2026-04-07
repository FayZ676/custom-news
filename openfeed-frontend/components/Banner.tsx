"use client";

import { useState, useEffect } from "react";

import { motion } from "motion/react";

import { getUserWeatherForecast, WeatherForecast } from "@/lib/weather";
import { getEdition, getUserLocation, UserLocation } from "@/lib/utils";

import { Database } from "@/lib/supabase/supabase.types";

export interface BannerProps {
  date: string;
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
}

export function Banner(props: BannerProps) {
  const edition = getEdition();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);

  useEffect(() => {
    getUserLocation().then(async (loc) => {
      if (!loc) return;
      setLocation(loc);
      const weather = await getUserWeatherForecast(loc.lat, loc.lon);
      setForecast(weather);
    });
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <hr className="border-t" />
      <div className="grid grid-cols-[1fr_3fr_1fr] items-center">
        <span className="text-left text-sm">
          VOL. {edition.volume}, No. {edition.edition}
        </span>
        <span className="text-center">
          {location ? location.city : "Location N/A"}, {props.date}
        </span>
        <span className="text-sm text-right self-center">
          {forecast
            ? `${forecast.temperature} °F, ${forecast.description}`
            : "Weather N/A"}
        </span>
      </div>
      <hr className="border-t-2" />
      <div className="overflow-hidden whitespace-nowrap text-sm">
        <motion.div
          className="inline-flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 500, ease: "linear", repeat: Infinity }}
        >
          {[...props.feeds, ...props.feeds].map((feed, i) => (
            <a
              key={`${feed.id}-${i}`}
              href={feed.url}
              className="px-2 border-r italic"
            >
              {feed.title}
            </a>
          ))}
        </motion.div>
      </div>
      <hr className="border-t" />
    </div>
  );
}
