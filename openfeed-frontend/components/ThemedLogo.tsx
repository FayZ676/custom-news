"use client";

import { useState, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export function ThemedLogo() {
  const [src, setSrc] = useState("/logo-light.svg");

  useLayoutEffect(() => {
    const theme =
      localStorage.getItem("color-theme") ??
      document.documentElement.dataset.theme ??
      "cupcake";
    setSrc(theme === "cupcake" ? "/logo-light.svg" : "/logo-dark.svg");
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
