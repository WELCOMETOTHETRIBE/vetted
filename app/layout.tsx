import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "MacTech Identity Command Center",
  description:
    "Central identity, organization access, and audit-aware sign-in for the MacTech suite.",
  keywords: [
    "mactech identity",
    "command center",
    "organization access",
    "rbac",
    "suite authentication",
  ],
  authors: [{ name: "MacTech Solutions" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "MacTech Identity Command Center",
    description:
      "Central identity, organization access, and audit-aware sign-in for the MacTech suite.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MacTech Identity Command Center",
    description:
      "Central identity, organization access, and audit-aware sign-in for the MacTech suite.",
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
  const clerkPublishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          appearance={{
            variables: {
              colorPrimary: "#22d3ee",
              colorBackground: "#0b1220",
              colorText: "#f1f5f9",
              colorTextSecondary: "#cbd5e1",
              colorInputBackground: "#1e293b",
              colorInputText: "#f1f5f9",
              colorNeutral: "#cbd5e1",
              colorTextOnPrimaryBackground: "#0b1220",
              borderRadius: "0.75rem",
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, Segoe UI, Inter, sans-serif",
            },
            elements: {
              card: {
                backgroundColor: "#111827",
                border: "1px solid #334155",
                boxShadow:
                  "0 20px 45px rgba(2, 6, 23, 0.55), 0 0 0 1px rgba(51, 65, 85, 0.35)",
              },
              headerTitle: { display: "none" },
              headerSubtitle: { display: "none" },
              socialButtonsBlockButton: {
                backgroundColor: "#1e293b",
                borderColor: "#475569",
                color: "#f1f5f9",
                "&:hover": { backgroundColor: "#334155" },
              },
              socialButtonsBlockButtonText: { color: "#f1f5f9" },
              socialButtonsProviderIcon: { filter: "brightness(1.6) contrast(1.1)" },
              formFieldLabel: { color: "#e2e8f0" },
              formFieldHintText: { color: "#94a3b8" },
              formFieldInput: {
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                color: "#f1f5f9",
              },
              dividerLine: { backgroundColor: "#334155" },
              dividerText: { color: "#94a3b8" },
              footerActionText: { color: "#cbd5e1" },
              footerActionLink: {
                color: "#22d3ee",
                "&:hover": { color: "#67e8f9" },
              },
              identityPreviewText: { color: "#f1f5f9" },
              identityPreviewEditButton: { color: "#22d3ee" },
            },
          }}
          signInUrl="/auth/signin"
          signUpUrl="/auth/signup"
          afterSignOutUrl="/"
        >
          <Providers>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
