import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "옮김 서비스 개인정보 처리방침",
};

const LAST_UPDATED = "2026-04-24";

export default function PrivacyPage() {
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
      <main className="mx-auto w-full max-w-[680px] px-5 py-10 space-y-6 text-[14px] leading-[22px] text-grey-700">
        <div>
          <h1 className="text-[26px] font-bold leading-[36px] text-grey-900">
            개인정보 처리방침
          </h1>
          <p className="mt-1 text-[12px] text-grey-400">
            마지막 업데이트 · {LAST_UPDATED}
          </p>
        </div>

        <Section title="1. 수집하는 정보">
          <p>옮김은 서비스 제공을 위해 다음 정보를 수집·처리합니다.</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>클라이언트 식별자</strong>: 브라우저 localStorage 에
              저장되는 랜덤 ID. 로그인 없이도 본인의 전사 이력을 구분하기
              위함
            </li>
            <li>
              <strong>업로드 파일</strong>: 사용자가 업로드한 영상·오디오
              파일. 전사 처리에만 사용
            </li>
            <li>
              <strong>YouTube URL</strong>: 사용자가 제출한 YouTube 영상 주소
              (저장: 서비스 운영 로그)
            </li>
            <li>
              <strong>전사 결과</strong>: TXT/SRT/VTT 파일 및 관련
              메타데이터(길이, 비용, 상태)
            </li>
            <li>
              <strong>접속 로그</strong>: IP 주소, User-Agent, 접속 시각 —
              남용 방지 및 성능 모니터링 목적
            </li>
            <li>
              <strong>분석 데이터</strong> (GA4 활성화 시): 페이지뷰, 이벤트,
              대략적 지역 정보
            </li>
          </ul>
          <p>
            본 서비스는 계정·로그인·결제 기능이 없으므로 이름·이메일·전화
            번호 등 개인 식별 정보는 수집하지 않습니다. (DMCA 등 직접 문의
            시 자발적으로 제공하는 경우는 별도)
          </p>
        </Section>

        <Section title="2. 보관 기간">
          <ul className="ml-5 list-disc space-y-1">
            <li>업로드 영상 원본: 전사 완료 후 24시간 이내 자동 삭제 (구현 예정)</li>
            <li>전사 결과 파일: 30일 후 자동 삭제</li>
            <li>Job 메타데이터 (상태·길이·비용): 30일</li>
            <li>접속 로그: 90일</li>
            <li>DMCA 차단 videoId 목록: 영구</li>
          </ul>
        </Section>

        <Section title="3. 제3자 제공 및 처리 위탁">
          <p>서비스 운영을 위해 다음 외부 서비스와 데이터를 주고받습니다.</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Vercel Inc. (미국)</strong>: 호스팅, Blob 파일 저장,
              서버리스 함수 실행
            </li>
            <li>
              <strong>Supabase Inc. (미국)</strong>: Job 메타데이터 저장
              (PostgreSQL)
            </li>
            <li>
              <strong>Deepgram Inc. (미국)</strong>: 음성 전사 엔진. 업로드된
              오디오를 일시적으로 전달하여 텍스트로 변환. SOC 2 Type II,
              HIPAA 준수 인프라
            </li>
            <li>
              <strong>YouTube LLC (Google, 미국)</strong>: 공개 자막 데이터
              수신. 사용자가 제출한 URL 에 대해서만 호출
            </li>
            <li>
              <strong>Google Analytics (활성화 시)</strong>: 익명화된 서비스
              이용 통계
            </li>
          </ul>
          <p>
            어떠한 경우에도 업로드 파일이나 전사 결과를 AI 모델 학습용
            데이터로 제공·판매하지 않습니다.
          </p>
        </Section>

        <Section title="4. 국외 이전">
          <p>
            본 서비스는 Vercel·Supabase·Deepgram 등 미국 소재 인프라를
            사용하므로 데이터가 미국에 저장·처리될 수 있습니다. 이에
            동의하지 않으시는 경우 서비스 이용이 제한됩니다.
          </p>
        </Section>

        <Section title="5. 이용자 권리">
          <p>이용자는 다음 권리를 행사할 수 있습니다.</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>본인의 전사 결과물 삭제 요청</li>
            <li>보관 중인 본인 관련 정보의 열람·정정 요청</li>
            <li>클라이언트 식별자 재설정 (브라우저 localStorage 삭제)</li>
          </ul>
          <p>
            문의처:{" "}
            <a
              href="mailto:contact@anyonecompany.kr"
              className="font-semibold text-brand hover:underline"
            >
              contact@anyonecompany.kr
            </a>
          </p>
        </Section>

        <Section title="6. 보안 대책">
          <ul className="ml-5 list-disc space-y-1">
            <li>전송 구간: HTTPS/TLS 암호화</li>
            <li>저장: Vercel Blob 및 Supabase Postgres 암호화 저장</li>
            <li>접근 통제: 서비스 운영에 필요한 최소 권한만 부여</li>
            <li>rate limit: 남용 방지를 위한 IP 기반 호출 제한</li>
          </ul>
        </Section>

        <Section title="7. 쿠키">
          <p>
            서비스는 기능적 목적 외 쿠키를 사용하지 않습니다. GA4 활성화
            시에는 분석용 쿠키(_ga, _ga_*)가 설정될 수 있으며, 브라우저
            설정을 통해 거부할 수 있습니다.
          </p>
        </Section>

        <Section title="8. 방침 변경">
          <p>
            본 방침은 법령·서비스 정책 변경에 따라 개정될 수 있으며, 변경
            시 서비스 내에 7일 이상 공지합니다.
          </p>
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
    <section className="space-y-2">
      <h2 className="text-[17px] font-semibold text-grey-900">{title}</h2>
      {children}
    </section>
  );
}
