import type { DeepgramUtterance } from "./deepgram";

export interface YoutubeFetchResult {
  utterances: DeepgramUtterance[];
  plainText: string;
  durationSec: number;
  language: string;
  videoId: string;
  captionKind: "manual" | "asr";
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

interface RawCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // "asr" 또는 undefined (수동)
  name?: { simpleText?: string; runs?: { text: string }[] };
}

/**
 * YouTube watch 페이지 HTML 을 받아 ytInitialPlayerResponse 안의
 * captionTracks 배열을 추출. 각 트랙은 서명된 baseUrl 포함.
 */
async function fetchCaptionTracks(videoId: string): Promise<RawCaptionTrack[]> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url, { headers: HTTP_HEADERS, cache: "no-store" });

  if (res.status === 404) throw new YoutubeVideoNotFoundError(videoId);
  if (res.status === 403) throw new YoutubeRegionBlockedError(videoId);
  if (!res.ok) {
    throw new YoutubeFetchError(videoId, `watch status ${res.status}`);
  }

  const html = await res.text();

  // 영상이 삭제·비공개 인 경우 시그널
  if (
    html.includes("Video unavailable") &&
    !html.includes('"captionTracks"')
  ) {
    throw new YoutubeVideoNotFoundError(videoId);
  }

  // "captionTracks":[...] 를 게으르게 매칭 — 다음 주요 키 직전까지
  const match = html.match(
    /"captionTracks":(\[.*?\])(?=,"(?:audioTracks|translationLanguages|defaultAudioTrackIndex))/,
  );
  if (!match) {
    // captionTracks 필드 자체가 없으면 이 영상에 자막 없음
    return [];
  }

  let parsed: RawCaptionTrack[];
  try {
    parsed = JSON.parse(match[1]) as RawCaptionTrack[];
  } catch {
    throw new YoutubeFetchError(videoId, "captionTracks parse failed");
  }

  // baseUrl 안의 & 같은 이스케이프는 JSON.parse 가 이미 처리함
  return parsed.filter((t) => t.baseUrl && t.languageCode);
}

function selectBestTrack(
  tracks: RawCaptionTrack[],
): RawCaptionTrack | null {
  if (tracks.length === 0) return null;
  const prefs: Array<(t: RawCaptionTrack) => boolean> = [
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

async function fetchJson3(
  videoId: string,
  baseUrl: string,
): Promise<Json3Response> {
  const sep = baseUrl.includes("?") ? "&" : "?";
  const url = `${baseUrl}${sep}fmt=json3`;
  const res = await fetch(url, { headers: HTTP_HEADERS, cache: "no-store" });
  if (!res.ok) {
    throw new YoutubeFetchError(videoId, `json3 status ${res.status}`);
  }
  const text = await res.text();
  if (!text.trim()) {
    throw new YoutubeFetchError(videoId, "empty json3 body");
  }
  try {
    return JSON.parse(text) as Json3Response;
  } catch {
    throw new YoutubeFetchError(videoId, "json3 parse failed");
  }
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

export async function fetchYoutubeTranscript(
  videoId: string,
): Promise<YoutubeFetchResult> {
  const tracks = await fetchCaptionTracks(videoId);
  if (tracks.length === 0) {
    throw new YoutubeNoCaptionsError(videoId);
  }

  const track = selectBestTrack(tracks);
  if (!track) {
    throw new YoutubeNoCaptionsError(videoId);
  }

  const json3 = await fetchJson3(videoId, track.baseUrl);
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
    captionKind: track.kind === "asr" ? "asr" : "manual",
  };
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
    public reason: string,
  ) {
    super(`YouTube transcript fetch failed for ${videoId}: ${reason}`);
  }
}
