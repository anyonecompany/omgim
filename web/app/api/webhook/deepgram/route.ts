import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { tryDeleteOriginalBlob } from "@/lib/blob-cleanup";
import {
  DEEPGRAM_COST_PER_MIN,
  buildSrt,
  buildTxt,
  buildVtt,
  extractTranscript,
} from "@/lib/deepgram";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "missing jobId" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    const { text, utterances, duration } = extractTranscript(payload);
    const txt = buildTxt(utterances, text);
    const srt = buildSrt(utterances);
    const vtt = buildVtt(utterances);

    const blobOpts = {
      access: "public" as const,
      addRandomSuffix: false,
      allowOverwrite: true,
    };

    const [txtBlob, srtBlob, vttBlob] = await Promise.all([
      put(`jobs/${jobId}/transcript.txt`, txt, {
        ...blobOpts,
        contentType: "text/plain; charset=utf-8",
      }),
      put(`jobs/${jobId}/transcript.srt`, srt, {
        ...blobOpts,
        contentType: "application/x-subrip; charset=utf-8",
      }),
      put(`jobs/${jobId}/transcript.vtt`, vtt, {
        ...blobOpts,
        contentType: "text/vtt; charset=utf-8",
      }),
    ]);

    const cost = (duration / 60) * DEEPGRAM_COST_PER_MIN;

    await supabaseAdmin
      .from("jobs")
      .update({
        status: "completed",
        duration_sec: duration,
        cost_usd: Math.round(cost * 10000) / 10000,
        result_txt_url: txtBlob.url,
        result_srt_url: srtBlob.url,
        result_vtt_url: vttBlob.url,
        result_json: payload as object,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await tryDeleteOriginalBlob(jobId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    await supabaseAdmin
      .from("jobs")
      .update({
        status: "failed",
        error: (e as Error).message?.slice(0, 500) ?? "webhook failed",
      })
      .eq("id", jobId);
    // 전사 실패 시에도 원본 영상은 즉시 삭제 (프라이버시 우선).
    await tryDeleteOriginalBlob(jobId).catch(() => {});
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
