import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { tryDeleteOriginalBlob } from "@/lib/blob-cleanup";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_LIMIT = 50;

export async function GET(req: Request) {
  // Vercel Cron 또는 동일 secret 을 가진 호출만 허용.
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("jobs")
    .select("id")
    .eq("deletion_pending", true)
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("[cron/cleanup-blobs] supabase select failed:", error);
    return NextResponse.json({ error: "select_failed" }, { status: 500 });
  }

  for (const row of rows ?? []) {
    await tryDeleteOriginalBlob(row.id);
  }

  return NextResponse.json({ processed: rows?.length ?? 0 });
}
