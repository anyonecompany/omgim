"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Mic,
  Clock3,
  Sparkles,
  FileText,
  CircleCheck,
  CircleAlert,
  Download,
  RotateCcw,
} from "lucide-react";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/ui/Footer";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SourceToggle, type Source } from "@/components/ui/SourceToggle";
import { YoutubeInput } from "@/components/ui/YoutubeInput";
import { QuotaBanner } from "@/components/ui/QuotaBanner";
import {
  LanguagePicker,
  type TranscribeLanguage,
} from "@/components/ui/LanguagePicker";
import { FAQ_ITEMS } from "@/lib/faq";
import { useUpload, type UploadResult } from "@/lib/use-upload";
import { useQuota } from "@/lib/use-quota";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Source>("upload");
  const [language, setLanguage] = useState<TranscribeLanguage>("auto");
  const { state, start, startYoutube, reset } = useUpload();
  const { quota, refresh: refreshQuota } = useQuota();
  const phase = state.phase;
  const idle = phase === "idle";

  const stageSubtitle =
    source === "youtube" ? "YouTube 링크" : (file?.name ?? "");

  // 전사 완료 시 쿼터 갱신
  if (phase === "completed") {
    // side effect within render is OK for idempotent fetch; React will dedupe
    void refreshQuota();
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center px-5 pb-16 pt-10 sm:pt-16">
        <HeroSection />

        <div className="mt-10 w-full flex flex-col items-center gap-6">
          {idle && (
            <SourceToggle
              value={source}
              onChange={(s) => {
                setFile(null);
                setSource(s);
              }}
            />
          )}

          {idle && <QuotaBanner quota={quota} source={source} />}

          {idle && source === "upload" && !file && (
            <Dropzone onFile={setFile} />
          )}

          {idle && source === "upload" && file && (
            <SelectedFile
              file={file}
              language={language}
              onLanguageChange={setLanguage}
              onClear={() => setFile(null)}
              onStart={() => start(file, { language })}
            />
          )}

          {idle && source === "youtube" && (
            <YoutubeInput onStart={(url) => startYoutube(url)} />
          )}

          {phase === "uploading" && (
            <StageCard
              title="업로드 중"
              subtitle={stageSubtitle}
              progressValue={state.progress}
              note={`${state.progress}% 업로드됨`}
            />
          )}

          {phase === "transcribing" && (
            <StageCard
              title={source === "youtube" ? "자막 가져오는 중" : "전사 중"}
              subtitle={stageSubtitle}
              indeterminate
              note={
                source === "youtube"
                  ? "YouTube 공개 자막을 받아오고 있어요."
                  : "AI가 음성을 텍스트로 옮기고 있어요. 1시간 영상 기준 약 1분 소요."
              }
            />
          )}

          {phase === "completed" && state.result && (
            <CompletedCard
              filename={
                source === "youtube"
                  ? "YouTube 자막"
                  : (file?.name ?? "(알 수 없음)")
              }
              result={state.result}
              onReset={() => {
                setFile(null);
                reset();
              }}
            />
          )}

          {phase === "failed" && (
            <FailedCard
              filename={stageSubtitle}
              error={state.error ?? "알 수 없는 오류"}
              onReset={() => {
                setFile(null);
                reset();
              }}
              onSwitchToUpload={
                source === "youtube"
                  ? () => {
                      setSource("upload");
                      setFile(null);
                      reset();
                    }
                  : undefined
              }
            />
          )}
        </div>

        <FeatureRow />
        <DefinitionSection />
        <StatsSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="flex h-14 items-center justify-between px-5 border-b border-grey-200 bg-white">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="옮김 (Omgim) 로고"
          width={32}
          height={32}
          priority
          className="rounded-md"
        />
        <span className="text-[16px] font-semibold text-grey-900 tracking-tight">
          옮김
          <span className="ml-1.5 text-[12px] font-medium text-grey-400 tracking-normal">
            Omgim
          </span>
        </span>
      </div>
      <span className="text-[12px] text-grey-500">Preview</span>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="w-full max-w-[480px] text-center">
      <h1 className="text-[30px] font-bold leading-[40px] tracking-tight text-grey-900">
        영상을 올리면
        <br />
        텍스트가 나옵니다
      </h1>
      <p className="mt-3 text-[16px] leading-[24px] text-grey-600">
        1.5시간이 넘는 강의·회의 녹화도 약 1분 안에
        <br className="hidden sm:inline" /> 한국어 텍스트로 바꿔 드려요.
      </p>
    </section>
  );
}

function SelectedFile({
  file,
  language,
  onLanguageChange,
  onClear,
  onStart,
}: {
  file: File;
  language: TranscribeLanguage;
  onLanguageChange: (l: TranscribeLanguage) => void;
  onClear: () => void;
  onStart: () => void;
}) {
  const sizeMB = (file.size / 1_000_000).toFixed(1);
  return (
    <div className="w-full max-w-[480px] rounded-md border border-grey-200 bg-white px-5 py-4 shadow-[var(--shadow-level-2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-grey-900">
            {file.name}
          </p>
          <p className="mt-0.5 text-[13px] text-grey-500 tabular-nums">
            {sizeMB} MB · {file.type || "unknown"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          다시 선택
        </Button>
      </div>
      <div className="mt-4 flex justify-center">
        <LanguagePicker value={language} onChange={onLanguageChange} />
      </div>
      <div className="mt-3">
        <Button fullWidth size="lg" onClick={onStart}>
          전사 시작
        </Button>
      </div>
    </div>
  );
}

function StageCard({
  title,
  subtitle,
  progressValue,
  indeterminate,
  note,
}: {
  title: string;
  subtitle: string;
  progressValue?: number;
  indeterminate?: boolean;
  note?: string;
}) {
  return (
    <div className="w-full max-w-[480px] rounded-md border border-grey-200 bg-white px-5 py-5 shadow-[var(--shadow-level-2)]">
      <div className="mb-3">
        <p className="text-[13px] font-semibold text-grey-700">{title}</p>
        <p className="mt-0.5 truncate text-[13px] text-grey-500">{subtitle}</p>
      </div>
      <ProgressBar
        value={progressValue}
        indeterminate={indeterminate}
      />
      {note && <p className="mt-2 text-[12px] text-grey-500">{note}</p>}
    </div>
  );
}

function CompletedCard({
  filename,
  result,
  onReset,
}: {
  filename: string;
  result: UploadResult;
  onReset: () => void;
}) {
  const duration = result.durationSec ? formatDuration(result.durationSec) : "";
  return (
    <div className="w-full max-w-[480px] rounded-md border border-grey-200 bg-white px-5 py-5 shadow-[var(--shadow-level-2)]">
      <div className="flex items-start gap-3">
        <CircleCheck
          size={24}
          strokeWidth={2}
          className="mt-0.5 flex-shrink-0 text-success"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-grey-900">전사 완료</p>
          <p className="mt-0.5 truncate text-[13px] text-grey-600">{filename}</p>
          {duration && (
            <p className="mt-0.5 text-[12px] text-grey-500 tabular-nums">
              길이 {duration}
              {result.costUsd != null &&
                ` · 비용 $${result.costUsd.toFixed(3)}`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {result.txtUrl && (
          <DownloadBtn href={result.txtUrl} label="TXT" />
        )}
        {result.srtUrl && (
          <DownloadBtn href={result.srtUrl} label="SRT" />
        )}
        {result.vttUrl && (
          <DownloadBtn href={result.vttUrl} label="VTT" />
        )}
      </div>

      <div className="mt-3">
        <Button variant="ghost" size="sm" fullWidth onClick={onReset}>
          <RotateCcw size={14} strokeWidth={1.75} aria-hidden />
          새 파일 전사
        </Button>
      </div>
    </div>
  );
}

function DownloadBtn({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-grey-200 bg-white text-[13px] font-semibold text-grey-900 hover:border-brand hover:text-brand transition-colors"
    >
      <Download size={14} strokeWidth={1.75} aria-hidden />
      {label}
    </a>
  );
}

function FailedCard({
  filename,
  error,
  onReset,
  onSwitchToUpload,
}: {
  filename: string;
  error: string;
  onReset: () => void;
  onSwitchToUpload?: () => void;
}) {
  return (
    <div className="w-full max-w-[480px] rounded-md border border-error/40 bg-white px-5 py-5">
      <div className="flex items-start gap-3">
        <CircleAlert
          size={24}
          strokeWidth={2}
          className="mt-0.5 flex-shrink-0 text-error"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-grey-900">전사 실패</p>
          {filename && (
            <p className="mt-0.5 truncate text-[13px] text-grey-500">
              {filename}
            </p>
          )}
          <p className="mt-1 text-[13px] text-error/90 break-words">{error}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {onSwitchToUpload && (
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onSwitchToUpload}
          >
            파일 업로드로 전환
          </Button>
        )}
        <Button variant="secondary" size="md" fullWidth onClick={onReset}>
          다시 시도
        </Button>
      </div>
    </div>
  );
}

function FeatureRow() {
  const items = [
    {
      icon: <Clock3 size={18} strokeWidth={1.75} />,
      label: "1시간 영상 약 1분",
    },
    {
      icon: <Sparkles size={18} strokeWidth={1.75} />,
      label: "한국어 고정확도",
    },
    {
      icon: <FileText size={18} strokeWidth={1.75} />,
      label: "txt · srt · vtt 출력",
    },
  ];
  return (
    <ul className="mt-12 flex w-full max-w-[480px] flex-col gap-2 sm:flex-row sm:gap-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex flex-1 items-center gap-2 rounded-sm border border-grey-200 bg-grey-50 px-3 py-2.5 text-[13px] text-grey-700"
        >
          <span className="text-grey-500">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function DefinitionSection() {
  return (
    <section
      id="about"
      className="mt-20 w-full max-w-[640px] rounded-lg border border-grey-200 bg-white px-6 py-8"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-grey-500">
        About
      </p>
      <h2 className="mt-2 text-[22px] font-bold leading-[30px] text-grey-900">
        옮김(Omgim)은 어떤 서비스인가요?
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-grey-700">
        옮김은 1.5시간 이상의 장시간 영상을 한국어 텍스트로 변환하는 AI 음성
        전사 서비스입니다. 강의·회의·인터뷰·팟캐스트 영상을 업로드하면
        TXT·SRT·VTT·JSON 포맷의 결과 파일을 받을 수 있습니다. 한국어
        고정확도와 장시간 파일 처리에 최적화되어 있습니다.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
        {[
          ["언어", "한국어 · 영어"],
          ["최대 용량", "5 GB"],
          ["출력 포맷", "TXT·SRT·VTT·JSON"],
          ["속도", "약 60× 실시간"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-sm border border-grey-200 bg-grey-50 px-3 py-2"
          >
            <dt className="text-[11px] font-medium text-grey-500">{k}</dt>
            <dd className="mt-0.5 font-semibold text-grey-900">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { label: "누적 전사 분량", value: "10h 11m", caption: "실측 (강의 6편)" },
    { label: "총 처리 시간", value: "7m", caption: "실측 (강의 6편)" },
    { label: "실시간 대비 속도", value: "~60×", caption: "AI 엔진" },
    { label: "한국어 고유명사", value: "정확", caption: "실측 검증" },
  ];
  return (
    <section
      id="stats"
      className="mt-16 w-full max-w-[640px] rounded-lg bg-grey-50 px-6 py-8"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-grey-500">
        Performance
      </p>
      <h2 className="mt-2 text-[20px] font-bold leading-[28px] text-grey-900">
        실측 전사 성능 (2026-04-23 기준)
      </h2>
      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-grey-500">{s.label}</dt>
            <dd className="mt-1 text-[22px] font-bold tracking-tight text-grey-900 tabular-nums">
              {s.value}
            </dd>
            <p className="mt-0.5 text-[11px] text-grey-400">{s.caption}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="mt-16 w-full max-w-[640px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-grey-500">
        FAQ
      </p>
      <h2 className="mt-2 text-[22px] font-bold leading-[30px] text-grey-900">
        자주 묻는 질문
      </h2>
      <dl className="mt-6 divide-y divide-grey-200 rounded-lg border border-grey-200 bg-white">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="px-5 py-5">
            <dt className="text-[15px] font-semibold text-grey-900">
              {item.q}
            </dt>
            <dd className="mt-2 text-[14px] leading-[22px] text-grey-700">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-center text-[12px] text-grey-400">
        마지막 업데이트 · 2026-04-23
      </p>
    </section>
  );
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h}시간 ${m}분 ${s}초`;
  if (m) return `${m}분 ${s}초`;
  return `${s}초`;
}
