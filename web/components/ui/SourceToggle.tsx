"use client";

import { Upload, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Source = "upload" | "youtube";

interface Props {
  value: Source;
  onChange: (s: Source) => void;
  disabled?: boolean;
}

export function SourceToggle({ value, onChange, disabled }: Props) {
  return (
    <div
      role="tablist"
      aria-label="입력 방식"
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-grey-200 bg-grey-50 p-1 text-[13px]",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <Tab
        active={value === "upload"}
        onClick={() => onChange("upload")}
        icon={<Upload size={14} strokeWidth={1.75} aria-hidden />}
        label="파일 업로드"
      />
      <Tab
        active={value === "youtube"}
        onClick={() => onChange("youtube")}
        icon={<LinkIcon size={14} strokeWidth={1.75} aria-hidden />}
        label="YouTube 링크"
      />
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 font-medium transition-colors",
        active
          ? "bg-white text-grey-900 shadow-[var(--shadow-level-1)]"
          : "text-grey-500 hover:text-grey-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
