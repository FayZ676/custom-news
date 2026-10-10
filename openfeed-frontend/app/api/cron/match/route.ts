import { NextResponse } from "next/server";

import { matchAllInterests } from "@/lib/pipeline/match";

export const maxDuration = 300;

// Called by pg_cron (see openfeed-database migrations/*_schedule_pipeline.sql).
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await matchAllInterests());
}
