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
  source: "innertube" | "library";
}

const ID_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:m\.youtube\.com\/watch\?(?:[^&]*&)*v=)([\w-]{11})/,
];

const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
} as const;

const INNERTUBE_CLIENT_VERSION = "2.20240110.00.00";

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

// ---- Primary: Innertube /youtubei/v1/player ----

interface InnertubeCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" for auto-generated
  name?: { simpleText?: string; runs?: { text: string }[] };
  vssId?: string;
}

interface InnertubePlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: InnertubeCaptionTrack[];
    };
  };
  playabilityStatus?: {
    status?: string; // "OK" | "ERROR" | "UNPLAYABLE" | "LOGIN_REQUIRED"
    reason?: string;
  };
  videoDetails?: {
    videoId?: string;
    title?: string;
    lengthSeconds?: string;
  };
}

async function fetchInnertubePlayer(
  videoId: string,
): Promise<InnertubePlayerResponse> {
  const url =
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
  const body = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: INNERTUBE_CLIENT_VERSION,
        hl: "ko",
        gl: "KR",
      },
    },
    videoId,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...HTTP_HEADERS,
      "Content-Type": "application/json",
      Origin: "https://www.youtube.com",
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": INNERTUBE_CLIENT_VERSION,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`innertube status ${res.status}`);
  }
  return (await res.json()) as InnertubePlayerResponse;
}

function selectTrack(
  tracks: InnertubeCaptionTrack[],
): InnertubeCaptionTrack | null {
  if (tracks.length === 0) return null;
  const prefs: Array<(t: InnertubeCaptionTrack) => boolean> = [
    (t) => t.languageCode === "ko" && t.kind !== "asr",
    (t) => t.languageCode.startsWith("ko") && t.kind !== "asr",
    (t) => t.languageCode === "en" && t.kind !== "asr",
    (t) => t.languageCode.startsWith("en") && t.kind !== "asr",
    (t) => t.languageCode === "ko" && t.kind === "asr",
    (t) => t.languageCode.startsWith("ko") && t.kind === "asr",
    (t) => t.languageCode === "en" && t.kind === "asr",
    (t) => t.languageCode.startsWith("en") && t.kind === "asr",
    (t) => t.kind !== "asr",
    () => true,
  ];
  for (const pred of prefs) {
    const found = tracks.find(pred);
    if (found) return found;
  }
  return tracks[0];
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: { utf8?: string }[];
}
interface Json3Response {
  events?: Json3Event[];
}

async function fetchJson3(baseUrl: string): Promise<Json3Response> {
  const sep = baseUrl.includes("?") ? "&" : "?";
  const url = `${baseUrl}${sep}fmt=json3`;
  const res = await fetch(url, { headers: HTTP_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`json3 status ${res.status}`);
  }
  const text = await res.text();
  if (!text.trim()) throw new Error("empty json3");
  return JSON.parse(text) as Json3Response;
}

function parseJson3(
  data: Json3Response,
): { utterances: DeepgramUtterance[]; plainText: string; durationSec: number } {
  const events = data.events ?? [];
  const utterances: DeepgramUtterance[] = [];
  let lastEnd = 0;

  for (const e of events) {
    const segs = e.segs ?? [];
    if (segs.length === 0) continue;
    const text = segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;

    const start = (e.tStartMs ?? 0) / 1000;
    const end = ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000;
    utterances.push({ start, end, transcript: text, words: [] });
    if (end > lastEnd) lastEnd = end;
  }
  const plainText = utterances.map((u) => u.transcript).join(" ");
  return { utterances, plainText, durationSec: lastEnd };
}

async function fetchViaInnertube(videoId: string): Promise<YoutubeFetchResult> {
  const player = await fetchInnertubePlayer(videoId);

  const status = player.playabilityStatus?.status ?? "OK";
  if (status === "ERROR" || status === "UNPLAYABLE") {
    throw new YoutubeVideoNotFoundError(videoId);
  }
  if (status === "LOGIN_REQUIRED") {
    throw new YoutubeRegionBlockedError(videoId);
  }

  const tracks =
    player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (tracks.length === 0) {
    throw new YoutubeNoCaptionsError(videoId);
  }
  const track = selectTrack(tracks);
  if (!track) throw new YoutubeNoCaptionsError(videoId);

  const json3 = await fetchJson3(track.baseUrl);
  const parsed = parseJson3(json3);
  if (parsed.utterances.length === 0) {
    throw new YoutubeNoCaptionsError(videoId);
  }

  return {
    utterances: parsed.utterances,
    plainText: parsed.plainText,
    durationSec: parsed.durationSec,
    language: track.languageCode,
    videoId,
    source: "innertube",
  };
}

// ---- Fallback: youtube-transcript 라이브러리 ----

async function fetchViaLibrary(videoId: string): Promise<YoutubeFetchResult> {
  const candidates: Array<string | undefined> = ["ko", "en", undefined];
  let lastErr: unknown;

  for (const lang of candidates) {
    try {
      const entries = (await YoutubeTranscript.fetchTranscript(
        videoId,
        lang ? { lang } : undefined,
      )) as YoutubeTranscriptEntry[];

      if (entries.length === 0) continue;

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

      return {
        utterances,
        plainText,
        durationSec,
        language: lang ?? "auto",
        videoId,
        source: "library",
      };
    } catch (e) {
      lastErr = e;
    }
  }

  const msg = (lastErr as Error)?.message ?? "";
  if (/transcript|caption|disabled|unavailable/i.test(msg)) {
    throw new YoutubeNoCaptionsError(videoId);
  }
  throw new YoutubeFetchError(videoId, msg || "unknown library error");
}

// ---- Public entry ----

export async function fetchYoutubeTranscript(
  videoId: string,
): Promise<YoutubeFetchResult> {
  // 1차: Innertube API. Vercel 서버 IP 가 봇으로 차단돼 LOGIN_REQUIRED/ERROR 받는 경우가
  // 빈번하므로, Innertube 의 어떤 에러든 일단 라이브러리 fallback 으로 한 번 더 시도.
  let innertubeError: unknown = null;
  try {
    return await fetchViaInnertube(videoId);
  } catch (e) {
    innertubeError = e;
  }

  // 2차: youtube-transcript 라이브러리 (Rick Astley 등 일부 영상 동작 확인됨)
  try {
    return await fetchViaLibrary(videoId);
  } catch (libError) {
    // 둘 다 실패. 의미 있는 에러를 우선 노출.
    if (
      innertubeError instanceof YoutubeNoCaptionsError ||
      libError instanceof YoutubeNoCaptionsError
    ) {
      throw new YoutubeNoCaptionsError(videoId);
    }
    if (innertubeError instanceof YoutubeVideoNotFoundError) {
      throw innertubeError;
    }
    throw libError;
  }
}

// ---- Misc utilities ----

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

// ---- Errors ----

export class YoutubeNoCaptionsError extends Error {
  code = "no_captions";
  constructor(public videoId: string) {
    super(`No captions available for video ${videoId}`);
  }
}

export class YoutubeVideoNotFoundError extends Error {
  code = "video_not_found";
  constructor(public videoId: string) {
    super(`YouTube video not found: ${videoId}`);
  }
}

export class YoutubeRegionBlockedError extends Error {
  code = "region_blocked";
  constructor(public videoId: string) {
    super(`YouTube video is region-blocked: ${videoId}`);
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
