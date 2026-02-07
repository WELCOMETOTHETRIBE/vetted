import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Career Skills Program (CSP) | clearD",
  description:
    "How clearD supports Career Skills Program (CSP) participants and cleared hiring teams with clearance-continuity and mission-ready sourcing.",
}

export default function CspPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
      <header className="glass-elevated sticky top-0 z-40 border-b border-surface-tertiary/50">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="text-xl font-bold text-gradient hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1"
              aria-label="Go to homepage"
            >
              clearD
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-modern btn-primary-modern px-5 py-2 rounded-xl text-sm font-semibold"
              >
                Get started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container-fluid py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 mb-10">
            <h1 className="text-fluid-4xl md:text-fluid-5xl font-bold text-balance leading-tight">
              Career Skills Program (CSP)
            </h1>
            <p className="text-fluid-lg text-content-secondary leading-relaxed text-balance">
              clearD supports Career Skills Program participants by maintaining clearance continuity and immediate
              employability in defense contracting roles.
            </p>
            <div className="card-modern p-4 border border-surface-tertiary/60">
              <p className="text-sm text-content-secondary leading-relaxed">
                clearD is aligned with defense hiring and transition workflows, but does not claim official DoD
                endorsement or certification. All hiring decisions are made by humans; AI outputs are advisory only and
                require human review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section className="card-modern p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-2">For transitioning service members</h2>
              <ul className="text-sm text-content-secondary space-y-2 leading-relaxed">
                <li>
                  Build a <strong>Cleared Mission Profile</strong> that emphasizes clearance status, mission readiness,
                  and continuity into defense work.
                </li>
                <li>Capture mission &amp; program experience in a professional, security-conscious format.</li>
                <li>Stay discoverable for clearance-compatible roles without “social media” style engagement.</li>
              </ul>
            </section>

            <section className="card-modern p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-2">For defense contractors</h2>
              <ul className="text-sm text-content-secondary space-y-2 leading-relaxed">
                <li>Engage CSP talent through a private, invitation-only sourcing workflow.</li>
                <li>Use mission-fit evaluation and audit-friendly notes/status tracking for human review.</li>
                <li>Get decision support summaries and review flags—advisory only.</li>
              </ul>
            </section>

            <section className="card-modern p-6">
              <h2 className="text-lg font-semibold text-content-primary mb-2">For program operators</h2>
              <ul className="text-sm text-content-secondary space-y-2 leading-relaxed">
                <li>
                  clearD is operated and supported by <strong>MacTech Solutions</strong>, a defense-focused systems and
                  workforce enablement firm.
                </li>
                <li>MacTech onboards contractors, operates CSP pilots, and ensures compliance awareness.</li>
                <li>clearD remains the neutral platform for cleared talent identity and sourcing.</li>
              </ul>
            </section>
          </div>

          <section className="mt-10 card-modern p-8">
            <h2 className="text-xl font-semibold text-content-primary mb-3">How CSP use works in clearD</h2>
            <div className="space-y-3 text-sm text-content-secondary leading-relaxed">
              <p>
                During TAP/CSP, participants can create and maintain a Cleared Mission Profile that highlights clearance
                status (active, transitioning, or eligible), mission &amp; program experience, and validated capabilities.
              </p>
              <p>
                Contractors engage through the clearD Contractor Console to review mission alignment summaries, identify
                clearance-compatible roles, and document human decisions in an audit-friendly way.
              </p>
            </div>
          </section>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-modern btn-primary-modern px-8 py-3 rounded-2xl font-semibold">
              Create your mission profile
            </Link>
            <Link href="/auth/signin" className="btn-modern btn-ghost px-8 py-3 rounded-2xl font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

