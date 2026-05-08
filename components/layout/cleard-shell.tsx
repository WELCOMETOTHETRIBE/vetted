import type { ReactNode } from "react";
import { ClearDSidebar } from "./cleard-sidebar";
import { ClearDTopbar } from "./cleard-topbar";
import { Toaster } from "@/components/ui/use-toast";

export interface ClearDShellViewer {
  name?: string | null;
  email: string;
  role: "USER" | "ADMIN" | string;
  accountType: "CANDIDATE" | "EMPLOYER" | string;
}

interface ClearDShellProps {
  viewer: ClearDShellViewer;
  children: ReactNode;
}

/**
 * The signed-in chrome for clearD: fixed sidebar (w-64) + sticky h-14 topbar,
 * mounting the toast viewport once. Replaces the legacy NavbarAdvanced /
 * NavbarClient on shell-migrated routes (currently /dashboard, /feed,
 * /onboarding, /admin). Other signed-in pages still render NavbarAdvanced
 * pending incremental migration.
 *
 * The viewer is passed in as a serializable prop so this component can be
 * used from server components without dragging Clerk client state.
 */
export function ClearDShell({ viewer, children }: ClearDShellProps) {
  const isAdmin = viewer.role === "ADMIN";
  const accountType =
    viewer.accountType === "EMPLOYER" || viewer.accountType === "CANDIDATE"
      ? viewer.accountType
      : undefined;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <ClearDSidebar accountType={accountType} isAdmin={isAdmin} />
      <div className="flex min-h-screen flex-1 flex-col">
        <ClearDTopbar viewer={viewer} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
