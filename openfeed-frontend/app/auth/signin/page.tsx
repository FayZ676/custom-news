import SignInForm from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-base-content/50 mt-1">
            Sign in to your account.
          </p>
        </div>

        <SignInForm />

        {/* <p className="text-sm text-center text-base-content/50">
          Don't have an account?{" "}
          <a href="/auth/signup" className="link link-hover font-medium text-base-content">
            Sign up
          </a>
        </p> */}
      </div>
    </div>
  );
}
