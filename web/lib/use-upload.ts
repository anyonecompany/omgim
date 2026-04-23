"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useRef, useState } from "react";
import { getClientKey } from "./client-key";

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

    try {
      await upload(path, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          jobId,
          clientKey,
          filename: file.name,
          size: file.size,
        }),
        onUploadProgress: (ev) => {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setState((s) => ({ ...s, progress: pct }));
        },
      });
    } catch (e) {
      setState({
        phase: "failed",
        jobId,
        progress: 0,
        result: null,
        error: (e as Error).message ?? "업로드 실패",
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

  const reset = useCallback(() => {
    cancelRef.current = true;
    setState(INITIAL);
  }, []);

  return { state, start, reset };
}

function makeJobId(): string {
  const raw =
    crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now();
  return raw.replaceAll("-", "").slice(0, 24);
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
