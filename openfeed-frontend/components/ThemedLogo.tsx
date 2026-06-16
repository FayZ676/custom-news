"use client";

import { useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const getLogoSrc = (theme: string) =>
  theme !== "dark" ? "/logo-light.svg" : "/logo-dark.svg";

const getCurrentTheme = () =>
  localStorage.getItem("color-theme") ??
  document.documentElement.dataset.theme ??
  "light";

export function ThemedLogo() {
  const [src, setSrc] = useState("/logo-light.svg");

  useLayoutEffect(() => {
    setSrc(getLogoSrc(getCurrentTheme()));

    const observer = new MutationObserver(() => {
      setSrc(getLogoSrc(getCurrentTheme()));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Link href="/" aria-label="Go to The Latest Times feed">
      <Image
        src={src}
        alt="The Latest Times"
        width={300}
        height={300}
        loading="eager"
        style={{ height: "auto" }}
        suppressHydrationWarning
      />
    </Link>
  );
}
