import { signIn } from "@/actions/auth";

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

        <form
          className="space-y-3"
          action={async (formData: FormData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            await signIn(email, password);
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="input input-bordered w-full focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="input input-bordered w-full focus:outline-none"
          />
          <button type="submit" className="btn btn-neutral w-full mt-2">
            Sign in
          </button>
        </form>

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
