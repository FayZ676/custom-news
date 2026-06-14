import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { message: rawMessage, userEmail } = await req.json();
  const message = rawMessage?.trim() ?? "";

  const supabase = createServiceRoleClient();

  const [{ error: dbError }, settings] = await Promise.all([
    supabase
      .from("user_feedback" as never)
      .insert({ message: message, user_email: userEmail || null } as never),
    getGlobalSettings(supabase),
  ]);

  if (dbError) {
    console.error("Feedback DB insert failed:", dbError);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  const { error: emailError } = await resend.emails.send({
    from: "OpenFeed <onboarding@resend.dev>",
    to: settings.admin_email,
    subject: "New feedback on OpenFeed",
    text: `From: ${userEmail || "unknown"}\n\n${message}`,
  });

  if (emailError) {
    console.error("Feedback email failed:", emailError);
  }

  return NextResponse.json({ ok: true });
}
