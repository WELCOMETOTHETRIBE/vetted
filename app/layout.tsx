import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "clearD — Cleared Talent Network",
  description:
    "clearD by MacTech — the clearance-first professional network for transitioning service members, defense contractors, and federal program staff.",
  keywords: [
    "cleard",
    "cleared talent network",
    "defense contracting",
    "security clearance",
    "veteran careers",
    "mactech solutions",
  ],
  authors: [{ name: "MacTech Solutions" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "clearD by MacTech — Cleared Talent Network",
    description:
      "Cleared Mission Profiles, mission-fit sourcing, and audit-aware AI decision support for defense and federal contracting.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "clearD by MacTech — Cleared Talent Network",
    description:
      "Cleared Mission Profiles, mission-fit sourcing, and audit-aware AI decision support for defense and federal contracting.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0807" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0807" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * Defensive Clerk publishable key resolution: Railway has historically been
   * inconsistent about exposing NEXT_PUBLIC_* at build time vs runtime. Read
   * from both env names so the build never produces an unstyled widget. See
   * commit 1c20f6b for the production incident this exists to prevent.
   */
  const clerkPublishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          signInUrl="/auth/signin"
          signUpUrl="/auth/signup"
          signInFallbackRedirectUrl="/feed"
          signUpFallbackRedirectUrl="/onboarding"
          afterSignOutUrl="/"
        >
          {/*
            Note: per-page Clerk <SignIn> / <SignUp> appearance overrides
            (in app/auth/[signin|signup]/[[...rest]]/page.tsx) own all
            theming. We deliberately do NOT pass an `appearance` prop here
            so per-page copper styling wins deterministically across every
            Clerk subflow (verify-email, factor-2, magic link, OAuth bounce).
          */}
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
