import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";

import { Lora } from "next/font/google";

import "./globals.css";

import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/supabase/queries/user_settings";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Latest Times",
  description: "The latest and most relevant news from across with web.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  const colorTheme = claimsData
    ? (await getUserSettings(supabase, claimsData.claims.sub)).color_theme
    : "cupcake";

  return (
    <html lang="en" data-theme={colorTheme}>
      <body
        className={`${lora.className} antialiased max-w-4xl mx-auto p-4 min-h-screen flex flex-col`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
