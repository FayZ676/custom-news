import type { Metadata } from "next";
import { Suspense } from "react";

import { Analytics } from "@vercel/analytics/next";

import { Lora } from "next/font/google";

import "./globals.css";

import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/supabase/queries/user_settings";
import { ThemeApplier } from "@/components/ThemeApplier";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Latest Times - Your News, Your Interests, Zero Noise",
  description:
    "Describe what you care about. Get relevant news automatically ranked and delivered. No algorithmic manipulation. No ads. No noise. Just the news that matters to you.",
  keywords: [
    "news aggregator",
    "personalized news",
    "news feed",
    "AI news ranking",
    "custom news",
    "relevant news",
    "news reader",
  ],
  authors: [{ name: "The Latest Times" }],
  openGraph: {
    title: "The Latest Times - Your News, Your Interests, Zero Noise",
    description:
      "Get relevant news automatically ranked by your interests. No ads, no noise, just what matters to you.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Latest Times - Your News, Your Interests, Zero Noise",
    description:
      "Get relevant news automatically ranked by your interests. No ads, no noise, just what matters to you.",
  },
  icons: [
    {
      rel: "icon",
      url: "/favicon-light.ico",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      url: "/favicon-dark.ico",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="cupcake">
      <body
        className={`${lora.className} antialiased max-w-4xl mx-auto p-4 min-h-screen flex flex-col`}
      >
        <Suspense>
          <ThemeLoader />
        </Suspense>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

async function ThemeLoader() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) return null;
  const { color_theme } = await getUserSettings(
    supabase,
    claimsData.claims.sub,
  );
  return <ThemeApplier theme={color_theme} />;
}
