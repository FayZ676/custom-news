"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const getLogoSrc = (theme: string) =>
  theme === "cupcake" ? "/logo-light.svg" : "/logo-dark.svg";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("splash-shown")) return;
    sessionStorage.setItem("splash-shown", "1");

    const theme =
      localStorage.getItem("color-theme") ??
      document.documentElement.dataset.theme ??
      "cupcake";

    const img = new window.Image();
    img.src = getLogoSrc(theme);

    setVisible(true);

    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const removeTimer = setTimeout(() => setVisible(false), 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  const theme =
    typeof window !== "undefined"
      ? (localStorage.getItem("color-theme") ??
        document.documentElement.dataset.theme ??
        "cupcake")
      : "cupcake";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-base-100"
      style={{
        transition: "opacity 700ms ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <Image
        src={getLogoSrc(theme)}
        alt="The Latest Times"
        width={280}
        height={280}
        priority
        style={{ height: "auto" }}
      />
    </div>
  );
}
