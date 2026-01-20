import { NextResponse } from "next/server";

export const runtime = "nodejs";

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL?.trim() || "http://localhost:5000";
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY?.trim();

type TranslateRequest = {
  q?: string;
  source?: string;
  target?: string;
  format?: "text" | "html";
};

export async function GET() {
  try {
    const response = await fetch(`${LIBRETRANSLATE_URL}/languages`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: message || "Failed to load languages." },
        { status: 502 },
      );
    }
    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load languages.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  let body: TranslateRequest;
  try {
    body = (await request.json()) as TranslateRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const text = body.q?.trim() ?? "";
  const source = body.source?.trim() || "auto";
  const target = body.target?.trim();
  const format = body.format === "html" ? "html" : "text";

  if (!text) {
    return NextResponse.json(
      { error: "Text is required." },
      { status: 400 },
    );
  }

  if (!target) {
    return NextResponse.json(
      { error: "Target language is required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format,
        ...(LIBRETRANSLATE_API_KEY ? { api_key: LIBRETRANSLATE_API_KEY } : {}),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        { error: message || "Translation failed." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as { translatedText?: string };
    return NextResponse.json({ translatedText: payload.translatedText ?? "" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Translation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
