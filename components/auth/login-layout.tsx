"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { MacTechFooter } from "@/components/layout/mactech-footer";

interface LoginLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

/**
 * Two-panel login surface — ported from MacTech Governance to keep clearD
 * visually consistent with the rest of the suite. Left brand panel uses warm
 * charcoal + grid + two off-axis copper glows; right form panel hosts the
 * Clerk widget. On mobile the brand collapses into a top strip with the
 * clearD eyebrow above the form.
 */
export function LoginLayout({ leftPanel, rightPanel }: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-gray-100">
      <div className="flex-1 flex">
        {/* Left brand panel — warm charcoal with grid + copper glows */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a0807] via-[#1a110b] to-[#251910] relative overflow-hidden border-r border-[#2a1d12]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(241,153,76,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(241,153,76,.07)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#F1994C]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full bg-[#F1994C]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between px-12 xl:px-16 py-16 w-full">
            {leftPanel}
          </div>
        </div>

        {/* Right form panel — dark, with mobile brand strip */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 -mx-4 sm:-mx-6 -mt-2 px-4 sm:px-6 pt-6 pb-8 rounded-b-xl bg-gradient-to-br from-[#0a0807] to-[#251910] border-b border-[#2a1d12]">
              <Image
                src="/cleard.png"
                alt="clearD"
                width={220}
                height={72}
                className="h-10 w-auto object-contain object-left"
                priority
              />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F1994C] mt-3">
                clearD
              </p>
            </div>
            {rightPanel}
          </div>
        </div>
      </div>
      <MacTechFooter />
    </div>
  );
}
