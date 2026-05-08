import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignIn
        path="/auth/signin"
        routing="path"
        signUpUrl="/auth/signup"
        forceRedirectUrl="/feed"
      />
    </div>
  );
}

