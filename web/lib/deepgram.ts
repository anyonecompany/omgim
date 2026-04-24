export const DEEPGRAM_COST_PER_MIN = 0.0043;
export const DEEPGRAM_MODEL = "nova-3";

export interface DeepgramWord {
  word?: string;
  punctuated_word?: string;
  start?: number;
  end?: number;
  confidence?: number;
}

export interface DeepgramUtterance {
  start?: number;
  end?: number;
  transcript?: string;
  words?: DeepgramWord[];
}

export type TranscribeLanguage = "auto" | "ko" | "en";

export function buildDeepgramAsyncUrl(
  callbackUrl: string,
  opts?: { language?: TranscribeLanguage },
): string {
  const params = new URLSearchParams({
    model: DEEPGRAM_MODEL,
    smart_format: "true",
    punctuate: "true",
    utterances: "true",
    diarize: "false",
    callback: callbackUrl,
  });
  const lang = opts?.language ?? "auto";
  if (lang === "auto") {
    params.set("detect_language", "true");
  } else {
    params.set("language", lang);
  }
  return `https://api.deepgram.com/v1/listen?${params.toString()}`;
}

export function extractTranscript(payload: unknown): {
  text: string;
  utterances: DeepgramUtterance[];
  words: DeepgramWord[];
  duration: number;
} {
  const p = payload as {
    results?: {
      channels?: { alternatives?: { transcript?: string; words?: DeepgramWord[] }[] }[];
      utterances?: DeepgramUtterance[];
    };
    metadata?: { duration?: number };
  };
  const alt = p?.results?.channels?.[0]?.alternatives?.[0];
  return {
    text: alt?.transcript ?? "",
    utterances: p?.results?.utterances ?? [],
    words: alt?.words ?? [],
    duration: p?.metadata?.duration ?? 0,
  };
}

export function buildTxt(utterances: DeepgramUtterance[], fallback: string): string {
  if (utterances.length) {
    return utterances.map((u) => (u.transcript ?? "").trim()).filter(Boolean).join("\n\n") + "\n";
  }
  return fallback.trim() + "\n";
}

export function buildSrt(utterances: DeepgramUtterance[]): string {
  const blocks: string[] = [];
  utterances.forEach((u, i) => {
    const text = (u.transcript ?? "").trim();
    if (!text) return;
    blocks.push(
      `${i + 1}\n${srtTs(u.start ?? 0)} --> ${srtTs(u.end ?? 0)}\n${text}\n`,
    );
  });
  return blocks.join("\n");
}

export function buildVtt(utterances: DeepgramUtterance[]): string {
  const lines = ["WEBVTT", ""];
  utterances.forEach((u) => {
    const text = (u.transcript ?? "").trim();
    if (!text) return;
    lines.push(`${vttTs(u.start ?? 0)} --> ${vttTs(u.end ?? 0)}`);
    lines.push(text);
    lines.push("");
  });
  return lines.join("\n");
}

function srtTs(sec: number): string {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const r = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(r, 3)}`;
}
function vttTs(sec: number): string {
  return srtTs(sec).replace(",", ".");
}
function pad(n: number, w: number): string {
  return String(n).padStart(w, "0");
}
