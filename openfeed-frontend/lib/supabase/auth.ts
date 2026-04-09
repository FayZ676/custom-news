"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
