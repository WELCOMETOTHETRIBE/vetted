import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MacTechFooter } from "@/components/layout/mactech-footer"

export const metadata: Metadata = {
  title: "Career Skills Program (CSP) | clearD",
  description:
    "How clearD supports Career Skills Program (CSP) participants and cleared hiring teams with clearance-continuity and mission-ready sourcing.",
}

export default function CspPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-1"
              aria-label="Go to homepage"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md brand-mark-chip">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              </div>
              <span className="text-sm font-semibold tracking-tight">clearD</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">Get started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 cleard-hero-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="space-y-4 mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              clearD
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground text-balance leading-tight">
              Career Skills Program (CSP)
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
              clearD supports Career Skills Program participants by maintaining
              clearance continuity and immediate employability in defense
              contracting roles.
            </p>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  clearD is aligned with defense hiring and transition workflows
                  but does not claim official DoD endorsement or certification.
                  All hiring decisions are made by humans; AI outputs are
                  advisory only and require human review.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">
                  For transitioning service members
                </h2>
                <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed list-disc list-outside ml-5">
                  <li>
                    Build a <strong className="text-foreground">Cleared Mission Profile</strong>{" "}
                    that emphasizes clearance status, mission readiness, and
                    continuity into defense work.
                  </li>
                  <li>
                    Capture mission &amp; program experience in a professional,
                    security-conscious format.
                  </li>
                  <li>
                    Stay discoverable for clearance-compatible roles without
                    “social media” style engagement.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">
                  For defense contractors
                </h2>
                <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed list-disc list-outside ml-5">
                  <li>
                    Engage CSP talent through a private, invitation-only
                    sourcing workflow.
                  </li>
                  <li>
                    Use mission-fit evaluation and audit-friendly notes/status
                    tracking for human review.
                  </li>
                  <li>
                    Get decision support summaries and review flags — advisory
                    only.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-foreground mb-3">
                  For program operators
                </h2>
                <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed list-disc list-outside ml-5">
                  <li>
                    clearD is operated and supported by{" "}
                    <strong className="text-foreground">MacTech Solutions</strong>, a
                    defense-focused systems and workforce enablement firm.
                  </li>
                  <li>
                    MacTech onboards contractors, operates CSP pilots, and
                    ensures compliance awareness.
                  </li>
                  <li>
                    clearD remains the neutral platform for cleared talent
                    identity and sourcing.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-10">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                How CSP use works in clearD
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  During TAP/CSP, participants can create and maintain a Cleared
                  Mission Profile that highlights clearance status (active,
                  transitioning, or eligible), mission &amp; program
                  experience, and validated capabilities.
                </p>
                <p>
                  Contractors engage through the clearD Contractor Console to
                  review mission alignment summaries, identify
                  clearance-compatible roles, and document human decisions in
                  an audit-friendly way.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">Create your mission profile</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>

      <MacTechFooter />
    </div>
  )
}
