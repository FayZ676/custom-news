"use client";

import { signIn } from "@/lib/supabase/auth";

export default function SignInForm() {
  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    await signIn(email, password, timezone);
  }

  return (
    <form className="space-y-3" action={handleSubmit}>
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="input input-bordered rounded-none w-full focus:outline-none"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        className="input input-bordered w-full rounded-none focus:outline-none"
      />
      <button
        type="submit"
        className="btn btn-neutral rounded-none w-full mt-2"
      >
        Sign in
      </button>
    </form>
  );
}
