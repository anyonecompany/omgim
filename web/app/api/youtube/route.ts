import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildSrt, buildTxt, buildVtt } from "@/lib/deepgram";
import {
  YoutubeFetchError,
  YoutubeNoCaptionsError,
  fetchOembedMeta,
  fetchYoutubeTranscript,
  parseVideoId,
} from "@/lib/youtube";

export const runtime = "nodejs";
export const maxDuration = 30;

// 단순 in-memory rate limit (서버리스 instance 단위라 엄격 제한은 아님 — DMCA 예방용)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", message: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let body: { url?: string; clientKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { url, clientKey } = body;
  if (!url || !clientKey) {
    return NextResponse.json(
      { error: "missing_fields", message: "url과 clientKey가 필요합니다." },
      { status: 400 },
    );
  }

  const videoId = parseVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      {
        error: "invalid_url",
        message: "유효한 YouTube URL이 아닙니다.",
      },
      { status: 400 },
    );
  }

  const jobId = makeJobId();

  try {
    const [result, meta] = await Promise.all([
      fetchYoutubeTranscript(videoId),
      fetchOembedMeta(videoId),
    ]);

    const filename = meta?.title
      ? sanitizeFilename(meta.title)
      : `youtube-${videoId}`;

    const txt = buildTxt(result.utterances, result.plainText);
    const srt = buildSrt(result.utterances);
    const vtt = buildVtt(result.utterances);

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

    await supabaseAdmin.from("jobs").insert({
      id: jobId,
      client_key: clientKey,
      status: "completed",
      filename: `${filename}.youtube`,
      size_bytes: 0,
      duration_sec: result.durationSec,
      blob_url: null,
      result_txt_url: txtBlob.url,
      result_srt_url: srtBlob.url,
      result_vtt_url: vttBlob.url,
      cost_usd: 0,
      engine: "youtube-captions",
      source: "youtube",
      source_url: `https://www.youtube.com/watch?v=${videoId}`,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      jobId,
      language: result.language,
      durationSec: result.durationSec,
      title: meta?.title ?? null,
      thumbnailUrl: meta?.thumbnailUrl ?? null,
      author: meta?.author ?? null,
      result: {
        txtUrl: txtBlob.url,
        srtUrl: srtBlob.url,
        vttUrl: vttBlob.url,
      },
    });
  } catch (e) {
    if (e instanceof YoutubeNoCaptionsError) {
      return NextResponse.json(
        {
          error: "no_captions",
          message:
            "이 영상에는 공개 자막이 없어요. 본인 영상이면 YouTube Studio에서 원본을 받아 파일 업로드로 전사해주세요.",
        },
        { status: 404 },
      );
    }
    if (e instanceof YoutubeFetchError) {
      return NextResponse.json(
        {
          error: "fetch_failed",
          message:
            "YouTube에서 자막을 가져오지 못했어요. 잠시 후 다시 시도해주세요.",
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        error: "server_error",
        message: (e as Error).message?.slice(0, 200) ?? "unknown",
      },
      { status: 500 },
    );
  }
}

function makeJobId(): string {
  const raw = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return raw.replaceAll("-", "").slice(0, 24);
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "youtube";
}
