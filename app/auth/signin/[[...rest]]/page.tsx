import { SignIn } from "@clerk/nextjs";
import { LoginLayout } from "@/components/auth/login-layout";
import { BrandMark } from "@/components/auth/brand-mark";
import { TrustCues } from "@/components/auth/trust-cues";

export const dynamic = "force-dynamic";

const ACCENT = "#F1994C";
const ACCENT_HOVER = "#D87E36";
const ACCENT_ACTIVE = "#B0651B";
const FOOTER_LINK_HOVER = "#FFB078";

const clerkAppearance = {
  variables: {
    colorPrimary: ACCENT,
    colorTextOnPrimaryBackground: "#0A0A0A",
    colorBackground: "#121212",
    colorText: "#f3f4f6",
    colorTextSecondary: "#9ca3af",
    colorInputBackground: "#0A0A0A",
    colorInputText: "#f3f4f6",
    colorNeutral: "#ffffff",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "w-full bg-[#141414] border border-[#2A2A2A] rounded-xl shadow-lg shadow-black/40 p-7",
    card: "shadow-none border-0 bg-transparent p-0 w-full",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton: `h-12 rounded-lg border border-[#3A3A3A] bg-[#0A0A0A] hover:bg-[#141414] hover:border-[${ACCENT}] text-gray-100 font-medium normal-case text-sm transition-colors`,
    socialButtonsBlockButtonText: "text-gray-100 font-medium text-sm",
    socialButtonsBlockButtonArrow: "hidden",
    socialButtonsProviderIcon: "h-5 w-5",
    dividerRow: "my-5",
    dividerLine: "bg-[#2A2A2A]",
    dividerText:
      "text-gray-500 text-[11px] uppercase tracking-[0.18em] font-medium px-3",
    formFieldLabel: "text-gray-300 font-medium text-sm mb-1.5",
    formFieldInput: `h-12 rounded-lg border border-[#3A3A3A] bg-[#0A0A0A] text-gray-100 placeholder:text-gray-500 hover:border-[#4A4A4A] focus:border-[${ACCENT}] focus:ring-2 focus:ring-[${ACCENT}]/30 transition-colors`,
    formButtonPrimary: `h-12 rounded-lg bg-[${ACCENT}] hover:bg-[${ACCENT_HOVER}] active:bg-[${ACCENT_ACTIVE}] text-[#0A0A0A] font-semibold normal-case text-sm shadow-sm transition-colors`,
    footerActionText: "text-gray-400 text-sm",
    footerActionLink: `text-[${ACCENT}] hover:text-[${FOOTER_LINK_HOVER}] font-semibold`,
    identityPreviewText: "text-gray-300",
    identityPreviewEditButton: `text-[${ACCENT}] font-medium`,
    formResendCodeLink: `text-[${ACCENT}] font-medium`,
    formFieldAction: `text-[${ACCENT}] font-medium`,
    footer: "hidden",
  },
} as const;

export default function SignInPage() {
  return (
    <LoginLayout
      leftPanel={
        <>
          <BrandMark />
          <TrustCues />
          <p className="text-xs text-gray-500">
            mactechsolutionsllc.com · Veteran-owned · SDVOSB-certified · clearD is a MacTech Suite product
          </p>
        </>
      }
      rightPanel={
        <div className="w-full">
          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F1994C] mb-2">
              Sign in
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              clearD by MacTech
            </h1>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Use your clearD account to access the cleared talent network and
              your mission-fit feed.
            </p>
          </div>
          <SignIn appearance={clerkAppearance} signUpUrl="/auth/signup" />
        </div>
      }
    />
  );
}
