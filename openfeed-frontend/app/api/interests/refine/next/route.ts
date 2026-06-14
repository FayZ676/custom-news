import { NextResponse } from "next/server";

import { generateNextQuestion } from "@/lib/interests/generate";
import type { RefineAnswer } from "@/lib/interests/refine";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const interest = typeof body?.interest === "string" ? body.interest.trim() : "";
  if (!interest) {
    return NextResponse.json({ error: "interest is required" }, { status: 400 });
  }

  const history: RefineAnswer[] = Array.isArray(body?.history) ? body.history : [];

  const result = await generateNextQuestion(interest, history);
  return NextResponse.json(result);
}
