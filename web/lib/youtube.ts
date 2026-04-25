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
  source: "worker" | "innertube" | "library";
  client?: string;
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

// ---- Innertube clients ----
//
// Vercel 서버 IP 가 WEB 클라이언트로는 봇 감지에 걸려 LOGIN_REQUIRED/ERROR 응답을 받기 때문에
// 모바일 앱 흉내(ANDROID/iOS) 와 임베디드 TV 클라이언트를 차례로 시도해 우회를 노린다.

interface InnertubeClient {
  name: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

const CLIENT_WEB: InnertubeClient = {
  name: "WEB",
  body: {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240110.00.00",
        hl: "ko",
        gl: "KR",
      },
    },
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": "2.20240110.00.00",
  },
};

const CLIENT_ANDROID: InnertubeClient = {
  name: "ANDROID",
  body: {
    context: {
      client: {
        clientName: "ANDROID",
        clientVersion: "19.09.37",
        androidSdkVersion: 34,
        userAgent:
          "com.google.android.youtube/19.09.37 (Linux; U; Android 14; ko_KR)",
        hl: "ko",
        gl: "KR",
      },
    },
  },
  headers: {
    "User-Agent":
      "com.google.android.youtube/19.09.37 (Linux; U; Android 14; ko_KR)",
    "X-YouTube-Client-Name": "3",
    "X-YouTube-Client-Version": "19.09.37",
  },
};

const CLIENT_TV_EMBEDDED: InnertubeClient = {
  name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
  body: {
    context: {
      client: {
        clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        clientVersion: "2.0",
        clientScreen: "EMBED",
        hl: "ko",
        gl: "KR",
      },
      thirdParty: { embedUrl: "https://www.youtube.com" },
    },
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (PlayStation; PlayStation 4/12.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    "X-YouTube-Client-Name": "85",
    "X-YouTube-Client-Version": "2.0",
  },
};

const CLIENT_IOS: InnertubeClient = {
  name: "IOS",
  body: {
    context: {
      client: {
        clientName: "IOS",
        clientVersion: "19.09.3",
        deviceModel: "iPhone14,3",
        userAgent:
          "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 17_2 like Mac OS X; ko_KR)",
        hl: "ko",
        gl: "KR",
      },
    },
  },
  headers: {
    "User-Agent":
      "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 17_2 like Mac OS X; ko_KR)",
    "X-YouTube-Client-Name": "5",
    "X-YouTube-Client-Version": "19.09.3",
  },
};

const CLIENT_CHAIN: InnertubeClient[] = [
  CLIENT_ANDROID,
  CLIENT_TV_EMBEDDED,
  CLIENT_IOS,
  CLIENT_WEB,
];

// ---- Innertube response types ----

interface InnertubeCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
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
    status?: string;
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
  client: InnertubeClient,
): Promise<InnertubePlayerResponse> {
  const url = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
  const body = { ...client.body, videoId };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...client.headers,
      "Content-Type": "application/json",
      Origin: "https://www.youtube.com",
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`innertube[${client.name}] status ${res.status}`);
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
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    cache: "no-store",
  });
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

interface InnertubeAttempt {
  client: string;
  ok: boolean;
  status?: string;
  reason?: string;
  trackCount?: number;
  error?: string;
}

async function tryInnertubeClient(
  videoId: string,
  client: InnertubeClient,
): Promise<{ result?: YoutubeFetchResult; attempt: InnertubeAttempt }> {
  try {
    const player = await fetchInnertubePlayer(videoId, client);
    const status = player.playabilityStatus?.status ?? "OK";
    const reason = player.playabilityStatus?.reason;

    if (status === "ERROR" || status === "UNPLAYABLE") {
      return {
        attempt: { client: client.name, ok: false, status, reason },
      };
    }
    if (status === "LOGIN_REQUIRED") {
      return {
        attempt: { client: client.name, ok: false, status, reason },
      };
    }

    const tracks =
      player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (tracks.length === 0) {
      return {
        attempt: {
          client: client.name,
          ok: false,
          status,
          reason: "no caption tracks",
          trackCount: 0,
        },
      };
    }

    const track = selectTrack(tracks);
    if (!track) {
      return {
        attempt: {
          client: client.name,
          ok: false,
          status,
          reason: "track selection failed",
          trackCount: tracks.length,
        },
      };
    }

    const json3 = await fetchJson3(track.baseUrl);
    const parsed = parseJson3(json3);
    if (parsed.utterances.length === 0) {
      return {
        attempt: {
          client: client.name,
          ok: false,
          status,
          reason: "empty json3 events",
          trackCount: tracks.length,
        },
      };
    }

    return {
      result: {
        utterances: parsed.utterances,
        plainText: parsed.plainText,
        durationSec: parsed.durationSec,
        language: track.languageCode,
        videoId,
        source: "innertube",
        client: client.name,
      },
      attempt: {
        client: client.name,
        ok: true,
        status,
        trackCount: tracks.length,
      },
    };
  } catch (e) {
    return {
      attempt: {
        client: client.name,
        ok: false,
        error: (e as Error).message,
      },
    };
  }
}

async function fetchViaInnertube(
  videoId: string,
): Promise<{ result?: YoutubeFetchResult; attempts: InnertubeAttempt[] }> {
  const attempts: InnertubeAttempt[] = [];

  for (const client of CLIENT_CHAIN) {
    const { result, attempt } = await tryInnertubeClient(videoId, client);
    attempts.push(attempt);
    if (result) return { result, attempts };
  }

  return { attempts };
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

// ---- Worker (Fly.io omgim-yt) ----
//
// Vercel IP 가 봇 감지 시스템에 등록돼 captionTracks 가 비워진 응답을 받기 때문에,
// nrt 리전 Fly.io worker 가 youtube_transcript_api 로 직접 추출한 결과를 반환받는다.
// 환경변수 미설정이거나 worker 가 응답 못하면 Innertube → library fallback 으로 폴백.

interface WorkerSegment {
  start: number;
  end: number;
  text: string;
}
interface WorkerResponse {
  videoId: string;
  language: string;
  kind: "manual" | "asr";
  segments: WorkerSegment[];
  plainText: string;
  durationSec: number;
}
interface WorkerError {
  detail?: {
    error?: string;
    message?: string;
  };
}

async function fetchViaWorker(
  videoId: string,
): Promise<{ result?: YoutubeFetchResult; error?: string; status?: number }> {
  const baseUrl = process.env.YT_WORKER_URL;
  const apiKey = process.env.YT_WORKER_API_KEY;
  if (!baseUrl) return { error: "no_worker_url" };

  const url = `${baseUrl.replace(/\/$/, "")}/transcript?video_id=${encodeURIComponent(videoId)}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    return { error: `network: ${(e as Error).message}` };
  }

  const status = res.status;
  if (!res.ok) {
    let parsed: WorkerError = {};
    try {
      parsed = (await res.json()) as WorkerError;
    } catch {
      // ignore
    }
    return {
      status,
      error: parsed.detail?.error ?? `http_${status}`,
    };
  }

  const data = (await res.json()) as WorkerResponse;
  if (!data.segments || data.segments.length === 0) {
    return { status, error: "no_captions" };
  }

  const utterances: DeepgramUtterance[] = data.segments.map((s) => ({
    start: s.start,
    end: s.end,
    transcript: s.text,
    words: [],
  }));

  return {
    result: {
      utterances,
      plainText: data.plainText,
      durationSec: data.durationSec,
      language: data.language,
      videoId: data.videoId,
      source: "worker",
      client: data.kind,
    },
  };
}

// ---- Public entry ----

export async function fetchYoutubeTranscript(
  videoId: string,
): Promise<YoutubeFetchResult> {
  // 1차: Fly.io worker (가장 안정적)
  const worker = await fetchViaWorker(videoId);
  if (worker.result) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[youtube] worker success: ${worker.result.client}`);
    }
    return worker.result;
  }

  // worker 가 명시적으로 영상 자체 문제를 보고했으면 즉시 노출 (Innertube 가 우회 못함)
  if (worker.error === "video_not_found" || worker.error === "video_private") {
    throw new YoutubeVideoNotFoundError(videoId);
  }
  if (worker.error === "region_blocked") {
    throw new YoutubeRegionBlockedError(videoId);
  }
  // worker 가 자막 부재라고 응답한 경우, Innertube 도 어차피 못 찾을 가능성 크지만 안전장치로 시도

  if (process.env.NODE_ENV !== "production") {
    console.log(`[youtube] worker miss: ${worker.error}`);
  }

  // 2차: Vercel IP 에서 Innertube 다중 client (대부분 빈 응답이지만 worker 다운/미설정 대비)
  const { result, attempts } = await fetchViaInnertube(videoId);

  if (result) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[youtube] innertube success via ${result.client}`,
        JSON.stringify(attempts),
      );
    }
    return result;
  }

  // 모든 Innertube client 실패 → 라이브러리 폴백
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[youtube] all innertube clients failed",
      JSON.stringify(attempts),
    );
  }

  try {
    return await fetchViaLibrary(videoId);
  } catch (libError) {
    // attempts 분석으로 의미 있는 에러 노출
    const allError = attempts.every(
      (a) => a.status === "ERROR" || a.status === "UNPLAYABLE",
    );
    if (allError) {
      throw new YoutubeVideoNotFoundError(videoId);
    }

    const noCaptionsAcrossAll = attempts.every(
      (a) =>
        a.reason === "no caption tracks" ||
        a.reason === "empty json3 events" ||
        a.reason === "track selection failed",
    );
    if (
      noCaptionsAcrossAll ||
      libError instanceof YoutubeNoCaptionsError
    ) {
      throw new YoutubeNoCaptionsError(videoId);
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
