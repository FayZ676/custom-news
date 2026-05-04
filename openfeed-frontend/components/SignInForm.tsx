"use client";

import { useState } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { signIn } from "@/lib/supabase/auth";

export default function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password, timezone);
    } catch (error) {
      if (isRedirectError(error)) throw error;
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }}
    >
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        disabled={loading}
        className="input input-bordered rounded-none w-full focus:outline-none disabled:opacity-50"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        disabled={loading}
        className="input input-bordered w-full rounded-none focus:outline-none disabled:opacity-50"
      />
      {error && <p className="text-error text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-neutral rounded-none w-full mt-2"
      >
        {loading ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
