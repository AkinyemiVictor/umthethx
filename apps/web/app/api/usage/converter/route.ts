import { NextResponse } from "next/server";
import { getUsageStatus } from "../../../../src/lib/usage-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const usage = await getUsageStatus(request, "converter");
    return NextResponse.json(usage, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load usage status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
