import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "소개",
  description:
    "옮김(Omgim)은 영상을 한국어 텍스트로 빠르게 바꿔주는 AI 전사 서비스입니다.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center px-5 border-b border-grey-200 bg-white">
        <Link
          href="/"
          className="text-[14px] font-semibold text-grey-900 tracking-tight hover:text-brand"
        >
          ← 옮김
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[680px] px-5 py-10 space-y-8 text-[15px] leading-[24px] text-grey-700">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="옮김 로고"
              width={48}
              height={48}
              className="rounded-md"
              priority
            />
            <div>
              <h1 className="text-[26px] font-bold leading-[34px] text-grey-900">
                옮김 (Omgim)
              </h1>
              <p className="text-[13px] text-grey-500">
                영상을 글로 옮깁니다.
              </p>
            </div>
          </div>
        </div>

        <Section title="왜 만들었나요?">
          <p>
            1.5시간이 넘는 강의·회의·인터뷰 녹화를 텍스트로 정리하고 싶은데,
            기존 서비스는 대부분 <strong>한국어 품질이 약하거나 장시간 파일
            업로드가 불편</strong>합니다. 옮김은 그 두 가지에 집중하기 위해
            만들어졌어요.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>최대 5GB · 수 시간 분량 영상을 한 번에 업로드</li>
            <li>
              Deepgram Nova-3 기반 한국어 고정확도 (고유명사 · 전문 용어 포함)
            </li>
            <li>TXT · SRT · VTT · JSON 동시 출력</li>
            <li>YouTube 링크 붙여넣기 → 공개 자막 즉시 추출</li>
          </ul>
        </Section>

        <Section title="어떻게 동작하나요?">
          <ol className="ml-5 list-decimal space-y-1">
            <li>영상 또는 오디오 파일을 드래그 업로드, 또는 YouTube URL 붙여넣기</li>
            <li>서버가 ffmpeg 으로 오디오를 추출해 AI 전사 엔진에 전달</li>
            <li>
              완료되면 TXT · SRT · VTT 세 가지 포맷으로 다운로드 링크 제공
            </li>
          </ol>
          <p>
            1시간 영상 기준 약 1분, 8시간 분량도 약 7분 안에 완료됩니다 (실측
            기준).
          </p>
        </Section>

        <Section title="무료 사용 정책">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              YouTube 자막 추출: <strong>무제한 무료</strong>
            </li>
            <li>
              파일 업로드 전사: <strong>하루 120분 무료</strong> (한국 시간
              자정 초기화)
            </li>
            <li>
              업로드 원본 영상은 전사 완료 직후 자동 삭제 · 결과 파일만 보관
            </li>
            <li>
              운영 비용은 사이트 내 광고(구글 애드센스)로 충당할 예정이며,
              사용자에게 과금하지 않습니다.
            </li>
          </ul>
        </Section>

        <Section title="데이터 보안">
          <ul className="ml-5 list-disc space-y-1">
            <li>HTTPS/TLS 전송 구간 암호화</li>
            <li>Vercel Blob · Supabase Postgres 저장 시 암호화</li>
            <li>전사 결과물은 Blob 에 랜덤 24자 경로로 저장 (URL 추측 불가)</li>
            <li>사용자 데이터를 AI 모델 학습에 제공하지 않습니다</li>
          </ul>
          <p>
            자세한 내용은{" "}
            <Link href="/privacy" className="text-brand hover:underline">
              개인정보 처리방침
            </Link>
            을 참고해주세요.
          </p>
        </Section>

        <Section title="연락처 · 문의">
          <p>
            제품 문의 · 버그 신고 · 제휴 등 모든 커뮤니케이션은{" "}
            <a
              href="mailto:contact@anyonecompany.kr"
              className="font-semibold text-brand hover:underline"
            >
              contact@anyonecompany.kr
            </a>{" "}
            로 보내주세요. 영업일 기준 2일 내 회신드립니다.
          </p>
          <p>
            저작권 침해 신고는{" "}
            <Link href="/terms" className="text-brand hover:underline">
              이용약관
            </Link>{" "}
            의 DMCA 절차에 따라 같은 이메일로 접수됩니다.
          </p>
        </Section>

        <Section title="기술 스택">
          <ul className="ml-5 list-disc space-y-1">
            <li>프런트: Next.js 16 · React 19 · Tailwind CSS 4 · Pretendard</li>
            <li>백엔드: Vercel Fluid Compute · Vercel Blob · Supabase Postgres</li>
            <li>전사 엔진: Deepgram Nova-3 (한국어·영어 자동 감지)</li>
            <li>YouTube: 공식 timedtext 엔드포인트 (영상 원본 다운로드 없음)</li>
          </ul>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[18px] font-semibold text-grey-900">{title}</h2>
      {children}
    </section>
  );
}
