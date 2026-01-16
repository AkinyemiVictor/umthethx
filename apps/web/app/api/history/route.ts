import { NextResponse } from "next/server";
import { getHistoryData } from "../../../src/lib/history";

export const runtime = "nodejs";

export async function GET() {
  try {
    const history = await getHistoryData();
    if (!history) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json(history);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
