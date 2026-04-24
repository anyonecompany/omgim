"use client";

/** 브라우저에서 File 의 길이(초)를 측정. 실패 시 0. */
export function readMediaDurationSec(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(0);

    const isAudio = file.type.startsWith("audio/");
    const el = document.createElement(isAudio ? "audio" : "video");
    el.preload = "metadata";

    const cleanup = () => {
      if (el.src) URL.revokeObjectURL(el.src);
    };

    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? el.duration : 0;
      cleanup();
      resolve(d > 0 ? d : 0);
    };
    el.onerror = () => {
      cleanup();
      resolve(0);
    };

    // 오래 걸리는 경우 타임아웃 (10초)
    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 10_000);

    el.src = URL.createObjectURL(file);
  });
}
