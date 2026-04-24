import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "이용약관",
  description: "옮김 서비스 이용약관",
};

const LAST_UPDATED = "2026-04-24";

export default function TermsPage() {
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
            이용약관
          </h1>
          <p className="mt-1 text-[12px] text-grey-400">
            마지막 업데이트 · {LAST_UPDATED}
          </p>
        </div>

        <Section title="1. 서비스 소개">
          <p>
            옮김(Omgim, 이하 &quot;서비스&quot;)은 사용자가 업로드한 영상 파일
            또는 YouTube 링크를 텍스트로 변환해주는 AI 음성 전사 서비스입니다.
          </p>
        </Section>

        <Section title="2. 저작권 보증 (중요)">
          <p>
            사용자는 본 서비스를 이용하여 업로드·제출하는 콘텐츠에 대하여 다음
            중 하나를 보증합니다.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>해당 콘텐츠의 저작권을 본인이 보유함</li>
            <li>권리자로부터 전사를 포함한 활용 허가를 받았음</li>
            <li>
              법적으로 허용되는 범위(공정 이용 등) 내에서 개인 학습·기록
              목적으로 이용함
            </li>
          </ul>
          <p>
            제3자의 저작권·초상권·기타 권리를 침해하는 사용은 전적으로 사용자
            본인의 책임이며, 서비스는 이에 대한 법적 책임을 지지 않습니다.
          </p>
        </Section>

        <Section title="3. YouTube 링크 이용 범위">
          <p>
            서비스는 YouTube 링크 제출 시 YouTube이 공개적으로 배포하는{" "}
            <strong>자막(Closed Caption)</strong> 데이터만을 수신·표시합니다.
            영상·음성 파일을 다운로드하거나 저장하지 않으며, YouTube의
            스트리밍 이용 약관을 우회하는 기술(yt-dlp 등)을 사용하지 않습니다.
          </p>
          <p>
            공개 자막이 없는 영상은 서비스에서 처리할 수 없으며, 이 경우
            사용자가 영상 소유자인 경우에 한해 YouTube Studio에서 원본을
            다운로드하여 파일 업로드 탭으로 이용할 것을 안내합니다.
          </p>
        </Section>

        <Section title="4. 데이터 보관 및 삭제">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              업로드 영상 파일: 전사 완료 후 24시간 이내 자동 삭제 (구현
              예정)
            </li>
            <li>전사 결과(TXT/SRT/VTT): 30일 보관 후 자동 삭제</li>
            <li>
              YouTube 자막 데이터: 결과 파일 형태로만 저장, 원본 URL과 videoId
              는 서비스 운영 로그에 보관
            </li>
          </ul>
        </Section>

        <Section title="5. 저작권 침해 신고 (DMCA / 저작권법)">
          <p>
            서비스가 보관 중인 전사 결과물이 본인의 저작권을 침해한다고
            판단되는 권리자는 다음 정보를 첨부하여{" "}
            <a
              href="mailto:contact@anyonecompany.kr"
              className="font-semibold text-brand hover:underline"
            >
              contact@anyonecompany.kr
            </a>
            로 신고할 수 있습니다.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>저작권자 신원 확인 정보</li>
            <li>침해된 저작물의 원본 위치(원본 영상 URL 등)</li>
            <li>침해된다고 주장하는 서비스 내 결과물 URL</li>
            <li>서면 또는 전자 서명</li>
          </ul>
          <p>
            유효한 신고 접수 시, 해당 결과물은 즉시 삭제되며 관련
            videoId는 향후 서비스 이용에서 차단됩니다.
          </p>
        </Section>

        <Section title="6. 금지 행위">
          <p>사용자는 다음 행위를 하지 않습니다.</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>타인의 저작물을 권한 없이 업로드·전사하는 행위</li>
            <li>서비스 API를 과도하게 자동화 호출하는 행위</li>
            <li>악성 파일·불법 콘텐츠를 업로드하는 행위</li>
            <li>서비스 운영을 방해하는 행위</li>
          </ul>
        </Section>

        <Section title="7. 서비스 변경·중단">
          <p>
            서비스는 사전 고지 후 기능을 추가·변경·중단할 수 있습니다. 무료
            Preview 단계에서는 데이터 보존을 보장하지 않으며, 중요한
            결과물은 로컬에 별도로 보관하시기 바랍니다.
          </p>
        </Section>

        <Section title="8. 면책">
          <p>
            서비스는 AI 전사 결과의 정확성에 대해 보증하지 않으며, 전사
            결과를 사용자가 검토·활용함에 따른 모든 책임은 사용자에게
            있습니다. 서비스 운영자는 전사 오류·누락·지연으로 인한 직·간접
            손해에 대해 책임지지 않습니다.
          </p>
        </Section>

        <Section title="9. 준거법 및 분쟁 해결">
          <p>
            본 약관은 대한민국 법령에 따라 해석되며, 분쟁이 발생할 경우 서울
            중앙지방법원을 1심 관할 법원으로 합니다.
          </p>
        </Section>

        <Section title="10. 문의">
          <p>
            <a
              href="mailto:contact@anyonecompany.kr"
              className="font-semibold text-brand hover:underline"
            >
              contact@anyonecompany.kr
            </a>
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
