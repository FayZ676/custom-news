"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";

function MarqueeRow({
  children,
  direction,
  duration,
}: {
  children: ReactNode;
  direction: "left" | "right";
  duration: number;
}) {
  const controls = useAnimationControls();
  const [hovered, setHovered] = useState(false);
  const xRef = useRef(0);

  useEffect(() => {
    if (hovered) {
      controls.stop();
    } else {
      controls.start({
        x: direction === "left" ? "-50%" : "0%",
        transition: {
          repeat: Infinity,
          repeatType: "loop",
          duration,
          ease: "linear",
        },
      });
    }
  }, [hovered, controls, direction, duration]);

  return (
    <motion.div
      className="flex gap-2 w-max"
      initial={{
        x: direction === "left" ? "0%" : "-50%",
      }}
      animate={controls}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {children}
      {children}
    </motion.div>
  );
}

export function Marquee<T>({
  items,
  renderItem,
  rows = 3,
  duration = 240,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  rows?: number;
  duration?: number;
}) {
  const itemsPerRow = Math.ceil(items.length / rows);
  const rowGroups = Array.from({ length: rows }, (_, i) =>
    items.slice(i * itemsPerRow, (i + 1) * itemsPerRow),
  ).filter((row) => row.length > 0);

  return (
    <div className="flex flex-col gap-2 overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      {rowGroups.map((row, rowIndex) => (
        <MarqueeRow
          key={rowIndex}
          direction={rowIndex % 2 === 0 ? "left" : "right"}
          duration={duration}
        >
          {row.map((item, i) => renderItem(item, i))}
        </MarqueeRow>
      ))}
    </div>
  );
}
