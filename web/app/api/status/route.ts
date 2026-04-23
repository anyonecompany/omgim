import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "missing jobId" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, status, filename, size_bytes, duration_sec, cost_usd, result_txt_url, result_srt_url, result_vtt_url, error, created_at, completed_at",
    )
    .eq("id", jobId)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}
