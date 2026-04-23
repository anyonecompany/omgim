import { FAQ_ITEMS } from "@/lib/faq";

const SITE_URL = "https://omgim.vercel.app";
const LAST_UPDATED = "2026-04-23";

const webApplication = {
  "@type": "WebApplication",
  "@id": `${SITE_URL}#app`,
  name: "옮김 (Omgim)",
  alternateName: ["Omgim", "옴김", "오김"],
  url: SITE_URL,
  applicationCategory: "MultimediaApplication",
  applicationSubCategory: "SpeechToText",
  operatingSystem: "Any (Web Browser)",
  browserRequirements: "Requires JavaScript and HTML5",
  inLanguage: "ko-KR",
  availableLanguage: ["ko", "en"],
  description:
    "옮김은 장시간 영상을 한국어 텍스트(TXT/SRT/VTT/JSON)로 변환하는 AI 전사 서비스. 1.5시간 영상을 약 1분에 전사합니다.",
  featureList: [
    "장시간 영상 업로드 (최대 5GB)",
    "한국어 고정확도 음성 전사",
    "TXT / SRT / VTT / JSON 다중 포맷 출력",
    "타임스탬프 포함 자막 생성",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
    availability: "https://schema.org/PreOrder",
    description: "Phase 1 Preview",
  },
  dateModified: LAST_UPDATED,
  softwareVersion: "0.1.0",
};

const faqPage = {
  "@type": "FAQPage",
  "@id": `${SITE_URL}#faq`,
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const howTo = {
  "@type": "HowTo",
  "@id": `${SITE_URL}#howto`,
  name: "옮김으로 영상을 텍스트로 옮기는 방법",
  description: "영상 파일을 업로드해 한국어 텍스트로 변환하는 3단계 절차",
  totalTime: "PT3M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "영상 파일 선택",
      text: "드래그앤드롭 영역에 영상을 놓거나 클릭해서 파일을 선택합니다. MP4, MOV, WEBM 등 주요 포맷 지원, 최대 5GB.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "전사 시작",
      text: "전사 시작 버튼을 누르면 AI 엔진이 한국어 음성을 텍스트로 변환합니다. 1시간 영상 기준 약 1분 소요.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "결과 다운로드",
      text: "완료되면 TXT(일반 텍스트), SRT(자막), VTT(웹자막), JSON(원본 데이터) 중 원하는 포맷으로 다운로드합니다.",
    },
  ],
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: "옮김 (Omgim)",
  inLanguage: "ko-KR",
};

const graph = {
  "@context": "https://schema.org",
  "@graph": [website, webApplication, faqPage, howTo],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
