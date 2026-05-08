"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ShieldCheck, BadgeCheck, Briefcase, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [accountType, setAccountType] = useState<"CANDIDATE" | "EMPLOYER">(
    "CANDIDATE",
  );
  const [formData, setFormData] = useState({
    headline: "",
    location: "",
    about: "",
  });
  const [submitting, setSubmitting] = useState(false);

  /**
   * Persist the audience selection first (it changes server-side authz),
   * then the profile fields, then route the user to /feed via the Next
   * router (no full-page reload). All failures surface as toast — never
   * `alert()` — so the modal stays in the dark copper world.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const acctRes = await fetch("/api/account-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType }),
      });
      if (!acctRes.ok) {
        const acctErr = await acctRes.json().catch(() => ({}));
        throw new Error(acctErr.error || "Failed to set account type.");
      }

      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!profileRes.ok) {
        const profileErr = await profileRes.json().catch(() => ({}));
        throw new Error(profileErr.error || "Failed to save profile.");
      }

      toast({
        title: "Profile saved",
        description: "Welcome to clearD. Routing you to your feed.",
        variant: "success",
      });
      router.push("/feed");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast({
        title: "Couldn't save your profile",
        description: message,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  // Lightweight viewer info for the page header. We don't render the full
  // ClearDShell here because the user has not yet picked an audience and the
  // sidebar's role/audience-gated nav would mislead them.
  const displayName = isLoaded
    ? user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md brand-mark-chip">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              MacTech Suite
            </div>
            <div className="text-sm font-semibold leading-snug">clearD</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          {displayName ? `Signed in as ${displayName}` : ""}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
            Step 1 of 1
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Set up your Cleared Mission Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Pick how you&apos;ll use clearD and add a few profile basics.
            You&apos;ll be able to refine everything later from your profile
            page.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>I&apos;m using clearD as</CardTitle>
              <CardDescription>
                You can change this later. Admin accounts can manage both
                experiences.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AudienceOption
                value="CANDIDATE"
                title="Cleared Professional"
                description="Build a cleared mission profile and discover aligned roles."
                Icon={BadgeCheck}
                checked={accountType === "CANDIDATE"}
                onChange={() => setAccountType("CANDIDATE")}
              />
              <AudienceOption
                value="EMPLOYER"
                title="Hiring Team"
                description="Review cleared talent pools and engage mission-ready candidates."
                Icon={Briefcase}
                checked={accountType === "EMPLOYER"}
                onChange={() => setAccountType("EMPLOYER")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile basics</CardTitle>
              <CardDescription>
                Keep details professional and security-conscious. Do not enter
                classified or CUI material.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  placeholder="Systems Engineer · Active Secret · Transitioning 2026"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="San Antonio, TX"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                  rows={6}
                  placeholder="Mission summary: programs / mission areas you've supported, validated capabilities, and clearance status. Avoid classified detail."
                />
              </div>

              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Clearance hygiene reminder.
                </span>{" "}
                Don&apos;t enter program names, codeword identifiers, or
                anything you wouldn&apos;t put on an unclassified slide.
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/feed")}
              disabled={submitting}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Complete Mission Profile"
              )}
            </Button>
          </div>
        </form>
      </main>

      <Toaster />
    </div>
  );
}

interface AudienceOptionProps {
  value: "CANDIDATE" | "EMPLOYER";
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: () => void;
}

function AudienceOption({
  value,
  title,
  description,
  Icon,
  checked,
  onChange,
}: AudienceOptionProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors",
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-border/80 hover:bg-secondary/40",
      )}
    >
      <input
        type="radio"
        name="accountType"
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          checked
            ? "bg-primary/15 text-primary"
            : "bg-secondary text-foreground",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
}
