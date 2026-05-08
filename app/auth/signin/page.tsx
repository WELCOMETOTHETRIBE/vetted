import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_bottom,rgba(29,78,216,0.20),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-300/30 bg-slate-900/70 px-3 py-2 shadow-lg">
            <img src="/cleard.png" alt="clearD" className="h-8 w-auto" />
          </div>
          <div className="leading-tight">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-300">
              MacTech Solutions
            </div>
            <div className="text-sm font-semibold text-slate-100">
              clearD by MacTech Solutions
            </div>
          </div>
        </div>

        <SignIn
          path="/auth/signin"
          routing="path"
          signUpUrl="/auth/signup"
          forceRedirectUrl="/feed"
        />
      </div>
    </div>
  );
}

