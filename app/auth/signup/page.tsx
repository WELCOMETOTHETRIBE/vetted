import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUp
        path="/auth/signup"
        routing="path"
        signInUrl="/auth/signin"
        forceRedirectUrl="/onboarding"
      />
    </div>
  );
}

