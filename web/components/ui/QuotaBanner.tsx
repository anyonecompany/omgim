"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { QuotaSnapshot } from "@/lib/use-quota";

interface Props {
  quota: QuotaSnapshot | null;
  source: "upload" | "youtube";
}

export function QuotaBanner({ quota, source }: Props) {
  if (source === "youtube") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-grey-50 border border-grey-200 px-3 py-1 text-[12px] text-grey-600">
        <Clock size={12} strokeWidth={1.75} aria-hidden className="text-grey-400" />
        YouTube 자막 추출은 무제한 무료
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-grey-50 border border-grey-200 px-3 py-1 text-[12px] text-grey-500">
        <Clock size={12} strokeWidth={1.75} aria-hidden className="text-grey-400" />
        오늘 무료 업로드 · 120분
      </div>
    );
  }

  const depleted = quota.remainingMin <= 0;
  const low = quota.remainingMin < 30;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] tabular-nums",
        depleted
          ? "border-error/40 bg-error/5 text-error"
          : low
            ? "border-warning/40 bg-warning/5 text-warning"
            : "border-grey-200 bg-grey-50 text-grey-600",
      )}
    >
      <Clock size={12} strokeWidth={1.75} aria-hidden />
      {depleted ? (
        <>오늘 무료 쿼터 소진 · 한국 시간 자정 이후 초기화</>
      ) : (
        <>
          오늘 남은 무료 업로드 · {quota.remainingMin}분 / {quota.quotaMin}분
        </>
      )}
    </div>
  );
}
