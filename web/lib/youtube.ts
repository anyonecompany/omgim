import { YoutubeTranscript } from "youtube-transcript";
import type { DeepgramUtterance } from "./deepgram";

export interface YoutubeTranscriptEntry {
  text: string;
  duration: number;
  offset: number;
}

export interface YoutubeFetchResult {
  utterances: DeepgramUtterance[];
  plainText: string;
  durationSec: number;
  language: string;
  videoId: string;
}

const ID_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:m\.youtube\.com\/watch\?(?:[^&]*&)*v=)([\w-]{11})/,
];

export function parseVideoId(raw: string): string | null {
  if (!raw) return null;
  const input = raw.trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  for (const re of ID_PATTERNS) {
    const m = input.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export async function fetchYoutubeTranscript(
  videoId: string,
): Promise<YoutubeFetchResult> {
  const candidates: Array<string | undefined> = ["ko", "en", undefined];
  let lastErr: unknown;

  for (const lang of candidates) {
    try {
      const entries = (await YoutubeTranscript.fetchTranscript(
        videoId,
        lang ? { lang } : undefined,
      )) as YoutubeTranscriptEntry[];

      if (entries.length === 0) continue;

      return buildResult(videoId, entries, lang ?? "auto");
    } catch (e) {
      lastErr = e;
    }
  }

  const msg = (lastErr as Error)?.message ?? "";
  if (/transcript|caption|disabled|unavailable/i.test(msg)) {
    throw new YoutubeNoCaptionsError(videoId);
  }
  throw new YoutubeFetchError(videoId, msg || "unknown youtube error");
}

function buildResult(
  videoId: string,
  entries: YoutubeTranscriptEntry[],
  language: string,
): YoutubeFetchResult {
  // youtube-transcript v1.2+ 는 offset/duration 을 ms 단위로 반환. 초로 변환.
  const toSec = (ms: number) => ms / 1000;

  const utterances: DeepgramUtterance[] = entries.map((e) => ({
    start: toSec(e.offset),
    end: toSec(e.offset + e.duration),
    transcript: decodeEntities(e.text),
    words: [],
  }));

  const last = entries[entries.length - 1];
  const durationSec = last ? toSec(last.offset + last.duration) : 0;

  const plainText = utterances
    .map((u) => (u.transcript ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return { utterances, plainText, durationSec, language, videoId };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export async function fetchOembedMeta(videoId: string): Promise<{
  title: string;
  thumbnailUrl: string;
  author: string;
} | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? "",
      thumbnailUrl: data.thumbnail_url ?? "",
      author: data.author_name ?? "",
    };
  } catch {
    return null;
  }
}

export class YoutubeNoCaptionsError extends Error {
  code = "no_captions";
  constructor(public videoId: string) {
    super(`No captions available for video ${videoId}`);
  }
}

export class YoutubeFetchError extends Error {
  code = "youtube_fetch_failed";
  constructor(
    public videoId: string,
    reason: string,
  ) {
    super(`YouTube transcript fetch failed for ${videoId}: ${reason}`);
  }
}
