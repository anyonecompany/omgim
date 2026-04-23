"use client";

import { DragEvent, useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";

const ACCEPT = "video/*,audio/*";
const ACCEPT_EXTS = [
  ".mp4",
  ".mov",
  ".webm",
  ".mkv",
  ".avi",
  ".mp3",
  ".m4a",
  ".wav",
  ".aac",
  ".flac",
];

interface DropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFile, disabled }: DropzoneProps) {
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]);
    },
    [onFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "w-full max-w-[480px] rounded-lg border-2 border-dashed px-8 py-12 text-center cursor-pointer",
        "transition-colors duration-150 ease-[var(--ease-standard)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        disabled && "opacity-40 pointer-events-none",
        isDragging
          ? "border-brand bg-brand-light"
          : "border-grey-200 bg-white hover:border-brand hover:bg-brand-light/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
            isDragging ? "bg-brand text-white" : "bg-grey-100 text-grey-600",
          )}
        >
          <UploadCloud strokeWidth={1.75} size={28} />
        </div>
        <div className="space-y-1">
          <p className="text-[16px] font-semibold text-grey-900">
            영상 파일을 여기에 놓거나 클릭해서 선택
          </p>
          <p className="text-[13px] text-grey-500">
            최대 5GB · 한 번에 한 파일
          </p>
        </div>
        <p className="text-[12px] text-grey-400 tracking-tight">
          지원 포맷 · {ACCEPT_EXTS.join(" ")}
        </p>
      </div>
    </div>
  );
}
