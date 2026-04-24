import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldAlert, Handshake } from "lucide-react";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "문의",
  description:
    "옮김(Omgim) 제품 문의 · 버그 신고 · 제휴 제안 · 저작권 침해 신고 연락처.",
};

const SUPPORT_EMAIL = "contact@anyonecompany.kr";

export default function ContactPage() {
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
          <h1 className="text-[26px] font-bold leading-[34px] text-grey-900">
            문의하기
          </h1>
          <p className="mt-2 text-[14px] text-grey-500">
            모든 문의는 이메일로 받고 있어요. 영업일 기준 2일 내 회신드립니다.
          </p>
        </div>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-3 rounded-md border border-grey-200 bg-white px-5 py-4 hover:border-brand transition-colors"
        >
          <Mail size={20} strokeWidth={1.75} className="text-brand" aria-hidden />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-grey-900">
              {SUPPORT_EMAIL}
            </p>
            <p className="text-[12px] text-grey-500">
              클릭하면 메일 앱이 열려요
            </p>
          </div>
        </a>

        <section className="space-y-3">
          <h2 className="text-[18px] font-semibold text-grey-900">
            어떤 내용을 보내면 되나요?
          </h2>
          <ul className="space-y-3">
            <Item
              icon={<Handshake size={18} strokeWidth={1.75} />}
              title="제품 문의 · 제휴"
              desc="기능 질문, 기업 고객 대응, 제휴 제안"
            />
            <Item
              icon={<Mail size={18} strokeWidth={1.75} />}
              title="버그 신고 · 피드백"
              desc="재현 단계 · 브라우저 · 영상 길이를 함께 알려주시면 빠르게 도와드릴 수 있어요"
            />
            <Item
              icon={<ShieldAlert size={18} strokeWidth={1.75} />}
              title="저작권 침해 신고 (DMCA)"
              desc={
                <>
                  권리자 정보 · 원본 영상 URL · 침해 주장 결과물 URL · 서명 포함
                  (절차 상세:{" "}
                  <Link href="/terms" className="text-brand hover:underline">
                    이용약관
                  </Link>
                  )
                </>
              }
            />
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-[18px] font-semibold text-grey-900">응답 시간</h2>
          <p>영업일(월–금) 기준 2일 내 회신을 원칙으로 합니다. 공휴일·주말은 지연될 수 있어요.</p>
          <p>
            긴급한 보안 이슈(시크릿 노출 · 서비스 취약점)는 제목에{" "}
            <code className="rounded bg-grey-100 px-1 py-0.5 text-[13px]">
              [URGENT]
            </code>{" "}
            를 붙여주세요.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Item({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-sm border border-grey-200 bg-grey-50 px-4 py-3">
      <span className="mt-0.5 text-grey-600" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-grey-900">{title}</p>
        <p className="mt-0.5 text-[13px] text-grey-600">{desc}</p>
      </div>
    </li>
  );
}
