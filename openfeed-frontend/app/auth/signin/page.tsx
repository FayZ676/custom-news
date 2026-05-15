import SignInForm from "@/components/SignInForm";
import { ThemedLogo } from "@/components/ThemedLogo";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <hr className="border-t w-full" />
          <ThemedLogo />
          <hr className="border-t-2 w-full" />
          <p className="text-sm italic text-base-content/60 text-center">
            Sign in to read your personalised newspaper.
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}
