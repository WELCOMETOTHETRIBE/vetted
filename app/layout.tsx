import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "clearD — The Cleared Talent Network for Mission-Ready Defense Work",
  description:
    "clearD is a clearance-first professional identity and sourcing platform for mission-ready defense work.",
  keywords: [
    "cleared talent network",
    "security clearance",
    "defense contractors",
    "govcon",
    "cleared roles",
    "DoD career skills program",
    "CSP",
  ],
  authors: [{ name: "clearD (operated by MacTech Solutions)" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "clearD — The Cleared Talent Network for Mission-Ready Defense Work",
    description:
      "clearD is a clearance-first professional identity and sourcing platform for mission-ready defense work.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "clearD — The Cleared Talent Network for Mission-Ready Defense Work",
    description:
      "clearD is a clearance-first professional identity and sourcing platform for mission-ready defense work.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
