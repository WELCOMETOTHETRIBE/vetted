import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_bottom,rgba(29,78,216,0.20),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
        <section className="space-y-6 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6 backdrop-blur md:p-8">
          <div className="text-sm font-semibold tracking-wide text-cyan-300">
            MacTech Solutions
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
            Provision your suite access,
            <br />
            start in the right org context.
          </h1>
          <p className="text-base leading-relaxed text-slate-300">
            Create your account to use MacTech suite products through the shared
            identity command center and organization-aware access controls.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Shared suite identity
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Sign in once and access all approved MacTech applications.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Role and entitlement aware
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Grants are scoped to your organization and platform permissions.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Audit-ready by default
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Access events and admin operations are captured centrally.
              </div>
            </div>
          </div>

          <div className="pt-3 text-xs text-slate-400">
            mactechsolutionsllc.com · Veteran-owned · SDVOSB-certified
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 backdrop-blur md:p-6">
            <div className="mb-4">
              <div className="text-lg font-semibold text-slate-100">Create your MacTech account</div>
              <div className="mt-1 text-sm text-slate-400">
                Join the suite identity plane and continue onboarding.
              </div>
            </div>
            <SignUp
              path="/auth/signup"
              routing="path"
              signInUrl="/auth/signin"
              forceRedirectUrl="/onboarding"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

