"use client";

import { cn } from "@/lib/cn";

export type TranscribeLanguage = "auto" | "ko" | "en";

const OPTIONS: Array<{ value: TranscribeLanguage; label: string }> = [
  { value: "auto", label: "자동 감지" },
  { value: "ko", label: "한국어" },
  { value: "en", label: "영어" },
];

interface Props {
  value: TranscribeLanguage;
  onChange: (v: TranscribeLanguage) => void;
  disabled?: boolean;
}

export function LanguagePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-grey-500">언어</span>
      <div
        role="radiogroup"
        aria-label="전사 언어"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-sm border border-grey-200 bg-grey-50 p-0.5 text-[12px]",
          disabled && "opacity-40 pointer-events-none",
        )}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-[3px] px-2 py-1 font-medium transition-colors",
              value === opt.value
                ? "bg-white text-grey-900 shadow-[var(--shadow-level-1)]"
                : "text-grey-500 hover:text-grey-700",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
