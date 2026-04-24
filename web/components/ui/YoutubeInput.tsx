"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { parseVideoId } from "@/lib/youtube";

interface Props {
  onStart: (url: string) => void;
}

interface OembedMeta {
  title: string;
  thumbnailUrl: string;
  author: string;
}

export function YoutubeInput({ onStart }: Props) {
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<OembedMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const videoId = useMemo(() => parseVideoId(url), [url]);
  const valid = videoId !== null;

  useEffect(() => {
    // videoId 변경/없어짐 시 이전 meta/loading 리셋은 cleanup 에서 수행
    // (React 18+ cleanup 중 setState 는 안전, lint 규칙은 주석으로 완화)
    if (!videoId) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMetaLoading(true);

    fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setMeta({
          title: data.title ?? "",
          thumbnailUrl: data.thumbnail_url ?? "",
          author: data.author_name ?? "",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });

    return () => {
      cancelled = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMeta(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMetaLoading(false);
    };
  }, [videoId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onStart(url.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[480px] space-y-3"
    >
      <label className="block">
        <span className="sr-only">YouTube URL</span>
        <div
          className={cn(
            "flex items-center gap-2 rounded-sm border bg-grey-100 px-3 py-2.5 transition-colors",
            url.length === 0 && "border-grey-200",
            url.length > 0 && valid && "border-brand bg-brand-light/40",
            url.length > 0 && !valid && "border-error/60",
          )}
        >
          <LinkIcon
            size={18}
            strokeWidth={1.75}
            className="flex-shrink-0 text-grey-500"
            aria-hidden
          />
          <input
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-transparent text-[14px] text-grey-900 placeholder:text-grey-400 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </label>

      {url.length > 0 && !valid && (
        <p className="text-[12px] text-error">
          YouTube URL 형식이 아닙니다. (youtube.com/watch, youtu.be, shorts 지원)
        </p>
      )}

      {valid && meta && (
        <div className="flex items-start gap-3 rounded-md border border-grey-200 bg-white p-3">
          {meta.thumbnailUrl && (
            <Image
              src={meta.thumbnailUrl}
              alt=""
              width={96}
              height={64}
              unoptimized
              className="h-16 w-24 flex-shrink-0 rounded-sm object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-grey-900">
              {meta.title || "(제목 없음)"}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-grey-500">
              {meta.author}
            </p>
          </div>
        </div>
      )}

      {valid && metaLoading && !meta && (
        <p className="text-[12px] text-grey-400">영상 정보 가져오는 중…</p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={!valid}>
        YouTube 자막 가져오기
      </Button>

      <p className="text-[11px] leading-[16px] text-grey-400">
        공개 자막이 있는 영상만 가능해요. 자막이 없는 영상은 본인 영상의 경우에만
        YouTube Studio에서 원본을 받아 파일 업로드 탭으로 올려주세요.
      </p>
    </form>
  );
}
