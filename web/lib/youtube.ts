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

// User-Agent 와 Accept-Language 로 bot detection 완화.
// Vercel 서버 IP 라도 정상 브라우저 헤더 복제 시 timedtext 응답 정상.
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

interface CaptionTrack {
  lang: string;
  kind: "manual" | "asr";
  name: string; // 비어 있을 수 있음
}

/**
 * YouTube 의 공식 timedtext 리스트 엔드포인트를 호출해 사용 가능한 자막 트랙을 받음.
 * 비공식 스크래퍼(youtube-transcript) 대신 이 엔드포인트는 브라우저 플레이어가
 * 자막 메뉴를 그릴 때 실제로 호출하는 경로라 훨씬 안정적.
 */
async function fetchTrackList(videoId: string): Promise<CaptionTrack[]> {
  const url = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`;
  const res = await fetch(url, { headers: HTTP_HEADERS, cache: "no-store" });
  if (res.status === 404) throw new YoutubeVideoNotFoundError(videoId);
  if (res.status === 403) throw new YoutubeRegionBlockedError(videoId);
  if (!res.ok) {
    throw new YoutubeFetchError(videoId, `track list status ${res.status}`);
  }

  const xml = await res.text();
  const tracks: CaptionTrack[] = [];
  const re = /<track\b[^>]*\/>/g;
  const attrRe = (name: string) =>
    new RegExp(`\\b${name}="([^"]*)"`);

  const matches = xml.match(re) ?? [];
  for (const tag of matches) {
    const lang = tag.match(attrRe("lang_code"))?.[1] ?? "";
    const kindRaw = tag.match(attrRe("kind"))?.[1] ?? "";
    const name = tag.match(attrRe("name"))?.[1] ?? "";
    if (!lang) continue;
    tracks.push({
      lang,
      kind: kindRaw === "asr" ? "asr" : "manual",
      name,
    });
  }
  return tracks;
}

function selectBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;
  const prefs: Array<(t: CaptionTrack) => boolean> = [
    (t) => t.lang === "ko" && t.kind === "manual",
    (t) => t.lang.startsWith("ko") && t.kind === "manual",
    (t) => t.lang === "en" && t.kind === "manual",
    (t) => t.lang.startsWith("en") && t.kind === "manual",
    (t) => t.lang === "ko" && t.kind === "asr",
    (t) => t.lang.startsWith("ko") && t.kind === "asr",
    (t) => t.lang === "en" && t.kind === "asr",
    (t) => t.lang.startsWith("en") && t.kind === "asr",
    (t) => t.kind === "manual",
    (t) => t.kind === "asr",
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
  track: CaptionTrack,
): Promise<Json3Response> {
  const params = new URLSearchParams({
    v: videoId,
    lang: track.lang,
    fmt: "json3",
  });
  if (track.kind === "asr") params.set("kind", "asr");
  if (track.name) params.set("name", track.name);

  const url = `https://www.youtube.com/api/timedtext?${params.toString()}`;
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
  const tracks = await fetchTrackList(videoId);
  if (tracks.length === 0) {
    throw new YoutubeNoCaptionsError(videoId);
  }
  const track = selectBestTrack(tracks);
  if (!track) {
    throw new YoutubeNoCaptionsError(videoId);
  }

  const json3 = await fetchJson3(videoId, track);
  const parsed = parseJson3(json3);
  if (parsed.utterances.length === 0) {
    throw new YoutubeNoCaptionsError(videoId);
  }

  return {
    utterances: parsed.utterances,
    plainText: parsed.plainText,
    durationSec: parsed.durationSec,
    language: track.lang,
    videoId,
    captionKind: track.kind,
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
