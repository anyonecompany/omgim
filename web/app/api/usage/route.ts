import { NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/quota";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientKey = searchParams.get("clientKey");
  if (!clientKey) {
    return NextResponse.json({ error: "missing_clientKey" }, { status: 400 });
  }
  try {
    const status = await getQuotaStatus(clientKey);
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "usage_fetch_failed" },
      { status: 500 },
    );
  }
}
