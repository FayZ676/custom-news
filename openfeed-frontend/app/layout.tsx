import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";

import { Geist, Lora } from "next/font/google";
import { SplashScreen } from "@/components/SplashScreen";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

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
    <html lang="en" data-theme="cupcake" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('color-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geist.variable} ${lora.variable} antialiased max-w-4xl mx-auto p-4 min-h-screen flex flex-col`}
        style={{ fontFamily: "var(--font-geist)" }}
      >
        <SplashScreen />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
