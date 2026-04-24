"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useRef, useState } from "react";
import { getClientKey } from "./client-key";
import { readMediaDurationSec } from "./video-duration";

export type UploadPhase =
  | "idle"
  | "uploading"
  | "transcribing"
  | "completed"
  | "failed";

export interface UploadResult {
  txtUrl: string | null;
  srtUrl: string | null;
  vttUrl: string | null;
  durationSec: number | null;
  costUsd: number | null;
}

export interface UploadState {
  phase: UploadPhase;
  jobId: string | null;
  progress: number;
  result: UploadResult | null;
  error: string | null;
}

const INITIAL: UploadState = {
  phase: "idle",
  jobId: null,
  progress: 0,
  result: null,
  error: null,
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 20 * 60 * 1000; // 20분

export function useUpload() {
  const [state, setState] = useState<UploadState>(INITIAL);
  const cancelRef = useRef(false);

  const start = useCallback(async (file: File) => {
    cancelRef.current = false;
    const clientKey = getClientKey();
    const jobId = makeJobId();
    const ext = (file.name.split(".").pop() ?? "bin")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin";
    const path = `jobs/${jobId}/input.${ext}`;

    setState({
      phase: "uploading",
      jobId,
      progress: 0,
      result: null,
      error: null,
    });

    // 클라이언트 측 영상 길이 측정 (쿼터 사전 계산용)
    const expectedDurationSec = await readMediaDurationSec(file);

    try {
      await upload(path, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          jobId,
          clientKey,
          filename: file.name,
          size: file.size,
          expectedDurationSec,
        }),
        onUploadProgress: (ev) => {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setState((s) => ({ ...s, progress: pct }));
        },
      });
    } catch (e) {
      const msg = (e as Error).message ?? "업로드 실패";
      // 서버에서 QUOTA_EXCEEDED:: prefix 로 쿼터 초과 구분
      const quotaMatch = msg.match(/QUOTA_EXCEEDED::(.*)/);
      setState({
        phase: "failed",
        jobId,
        progress: 0,
        result: null,
        error: quotaMatch ? quotaMatch[1] : msg,
      });
      return;
    }

    setState((s) => ({ ...s, phase: "transcribing", progress: 100 }));

    const startedAt = Date.now();
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      if (cancelRef.current) return;
      await wait(POLL_INTERVAL_MS);
      try {
        const res = await fetch(`/api/status?jobId=${jobId}`, {
          cache: "no-store",
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === "completed") {
          setState({
            phase: "completed",
            jobId,
            progress: 100,
            result: {
              txtUrl: data.result_txt_url,
              srtUrl: data.result_srt_url,
              vttUrl: data.result_vtt_url,
              durationSec: data.duration_sec,
              costUsd: data.cost_usd,
            },
            error: null,
          });
          return;
        }
        if (data.status === "failed") {
          setState({
            phase: "failed",
            jobId,
            progress: 100,
            result: null,
            error: data.error ?? "전사 실패",
          });
          return;
        }
      } catch {
        // continue polling
      }
    }
    setState((s) => ({
      ...s,
      phase: "failed",
      error: "전사 타임아웃 (20분 초과)",
    }));
  }, []);

  const startYoutube = useCallback(async (url: string) => {
    cancelRef.current = false;
    const clientKey = getClientKey();
    setState({
      phase: "transcribing",
      jobId: null,
      progress: 100,
      result: null,
      error: null,
    });
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, clientKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          phase: "failed",
          jobId: null,
          progress: 0,
          result: null,
          error:
            data?.message ??
            data?.error ??
            "YouTube 자막을 가져오지 못했어요.",
        });
        return;
      }
      setState({
        phase: "completed",
        jobId: data.jobId,
        progress: 100,
        result: {
          txtUrl: data.result?.txtUrl ?? null,
          srtUrl: data.result?.srtUrl ?? null,
          vttUrl: data.result?.vttUrl ?? null,
          durationSec: data.durationSec ?? null,
          costUsd: 0,
        },
        error: null,
      });
    } catch (e) {
      setState({
        phase: "failed",
        jobId: null,
        progress: 0,
        result: null,
        error: (e as Error).message ?? "네트워크 오류",
      });
    }
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setState(INITIAL);
  }, []);

  return { state, start, startYoutube, reset };
}

function makeJobId(): string {
  const raw =
    crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now();
  return raw.replaceAll("-", "").slice(0, 24);
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
