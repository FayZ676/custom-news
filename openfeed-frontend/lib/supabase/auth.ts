"use server";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the authenticated user for the current request.
 * Wrapped in React.cache so multiple server components calling this
 * within the same render share a single getClaims() call.
 * Redirects to sign-in if unauthenticated.
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData) redirect("/auth/signin");
  return {
    userId: claimsData.claims.sub as string,
    email: (claimsData.claims.email ?? "") as string,
  };
});

export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) throw new Error(error.message);

  redirect("/feed");
}

export async function signIn(
  email: string,
  password: string,
  timezone: string | null = null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  if (data.user && timezone) {
    const { data: settings } = await supabase
      .from("user_settings")
      .select("timezone")
      .eq("user_id", data.user.id)
      .single();

    if (settings?.timezone !== timezone) {
      await supabase
        .from("user_settings")
        .update({ timezone })
        .eq("user_id", data.user.id);
    }
  }

  redirect("/feed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/signin");
}
