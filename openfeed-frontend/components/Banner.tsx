import { motion } from "motion/react";

import { Database } from "@/lib/supabase/supabase.types";

export interface BannerProps {
  location: string;
  date: string;
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
}

export default function Banner(props: BannerProps) {
  return (
    <div className="flex flex-col gap-1">
      <hr className="border-t" />
      <div className="mx-auto">
        {props.location}, {props.date}
      </div>
      <hr className="border-t-2" />
      <div className="overflow-hidden whitespace-nowrap">
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
