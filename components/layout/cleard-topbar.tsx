"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initialsFor } from "@/lib/utils";

interface ClearDTopbarProps {
  viewer: {
    name?: string | null;
    email: string;
    role: "USER" | "ADMIN" | string;
    accountType: "CANDIDATE" | "EMPLOYER" | string;
  };
}

function audienceLabel(role: string, accountType: string): string {
  if (role === "ADMIN") return "Admin";
  if (accountType === "EMPLOYER") return "Employer";
  return "Candidate";
}

/**
 * Sticky h-14 topbar — role badge on the left, avatar chip + sign-out on the
 * right. Mirrors Governance's Topbar but tuned to clearD's three-audience
 * model (CANDIDATE / EMPLOYER / ADMIN).
 */
export function ClearDTopbar({ viewer }: ClearDTopbarProps) {
  const fullName = viewer.name?.trim() || viewer.email;
  const audience = audienceLabel(viewer.role, viewer.accountType);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden md:inline-flex gap-1.5">
          <ShieldCheck className="h-3 w-3 text-primary" aria-hidden />
          {audience}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-2 py-1">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold"
            aria-hidden
          >
            {initialsFor(fullName, viewer.email)}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-medium">{fullName}</div>
            <div className="text-[10px] text-muted-foreground">{viewer.email}</div>
          </div>
        </div>

        <SignOutButton redirectUrl="/">
          <Button variant="ghost" size="icon" aria-label="Sign out">
            <LogOut className="h-4 w-4" aria-hidden />
          </Button>
        </SignOutButton>
      </div>
    </header>
  );
}
