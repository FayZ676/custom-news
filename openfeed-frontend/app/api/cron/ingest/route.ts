import { NextResponse } from "next/server";

import { ingestArticlesForInterests } from "@/lib/articles/ingest";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAllInterestsByUser } from "@/lib/supabase/queries/user_interests";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const users = await getAllInterestsByUser(supabase);

  let succeeded = 0;
  let failed = 0;
  for (const { userId, interestTexts } of users) {
    try {
      await ingestArticlesForInterests(userId, interestTexts);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      console.error(`ingest failed for user ${userId}:`, error);
    }
  }

  return NextResponse.json({ users: users.length, succeeded, failed });
}
