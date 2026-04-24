import type { Metadata, Viewport } from "next";
import {
  GoogleAnalytics,
  GoogleTagManager,
} from "@next/third-parties/google";
import { StructuredData } from "@/components/seo/StructuredData";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-NPRMV6RJ";

const SITE_URL = "https://omgim.xyz";
const SITE_NAME = "옮김 (Omgim)";
const DESCRIPTION =
  "옮김(Omgim)은 1.5시간 이상의 강의·회의·인터뷰 영상을 드래그 한 번으로 한국어 텍스트(TXT·SRT·VTT)로 옮기는 AI 음성 전사 서비스입니다. 8시간 분량 영상을 약 5분에 전사합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 영상을 글로 옮깁니다`,
    template: "%s · 옮김",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "옮김",
    "Omgim",
    "영상 텍스트 변환",
    "음성 전사",
    "AI 전사",
    "한국어 STT",
    "강의 텍스트 변환",
    "회의록 자동 작성",
    "긴 영상 자막",
    "SRT 자막 생성",
  ],
  authors: [{ name: "옮김" }],
  creator: "옮김",
  publisher: "옮김",
  category: "AI Transcription",
  alternates: {
    canonical: SITE_URL,
    languages: { "ko-KR": SITE_URL },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: `${SITE_NAME} — 영상을 글로 옮깁니다`,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "옮김 — 영상을 글로 옮깁니다",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 영상을 글로 옮깁니다`,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "ai:last_updated": "2026-04-23",
    "ai:content_type": "product_landing",
  },
};

export const viewport: Viewport = {
  themeColor: "#ef4444",
  width: "device-width",
  initialScale: 1,
};

const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* LCP 최적화: CDN preconnect + stylesheet parallel load.
            globals.css 의 @import 는 CSSOM blocking 이라 head 로 이동 */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
      </head>
      {/* GTM: <head> 스크립트 + <body> noscript iframe 둘 다 자동 주입 */}
      <GoogleTagManager gtmId={GTM_ID} />
      <body className="min-h-full flex flex-col bg-white text-grey-900">
        <StructuredData />
        {children}
      </body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
