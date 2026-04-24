import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export const post: BlogPost = {
  slug: "youtube-transcript-ways",
  title: "YouTube 한국어 자막 추출 3가지 방법 비교 (2026년 기준)",
  description:
    "YouTube 영상의 자막을 텍스트 파일로 뽑는 세 가지 방법 — 공식 자막 활용·AI 재전사·YouTube Studio 다운로드 — 를 실측 비교합니다.",
  publishedAt: "2026-04-24T00:00:00Z",
  readMinutes: 6,
  tags: ["YouTube", "자막", "한국어", "가이드"],
  body: (
    <>
      <p>
        유튜브 강의·인터뷰를 텍스트로 남기고 싶은 경우는 크게 세 가지 상황입니다.
        (1) 공부 후 노트 정리, (2) 번역·요약 입력 소스로 쓰려고,
        (3) 블로그 콘텐츠로 재가공. 어느 경우든 <strong>시간과 품질의 트레이드오프</strong>가
        있어 방법 선택이 중요합니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        방법 A. YouTube 공식 자막 바로 추출
      </h2>
      <p>
        유튜브는 대부분의 영상에 자동 생성 자막(auto-captions) 을 제공합니다.
        크리에이터가 직접 올린 수동 자막이 있으면 더 정확합니다. 이 자막은
        브라우저에서 영상 재생 시 요청되는 <code>timedtext</code> 엔드포인트에
        이미 공개된 데이터입니다.
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li><strong>장점</strong>: 가장 빠름 (몇 초). 원가 0.</li>
        <li><strong>단점</strong>: 자막이 없는 영상은 불가. 자동 자막은 오타·누락 발생.</li>
        <li><strong>추천 케이스</strong>: TED · 대형 채널 · 뉴스 (수동 자막 있을 확률↑)</li>
      </ul>
      <p>
        옮김의 YouTube 링크 탭이 이 방식입니다. URL 만 붙여넣으면 TXT/SRT/VTT
        로 바로 받을 수 있어요. 자세한 이용 범위는{" "}
        <Link href="/terms" className="text-brand hover:underline">
          이용약관
        </Link>
        을 참고해주세요.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        방법 B. 원본 영상을 받아 AI 로 재전사
      </h2>
      <p>
        자막이 없거나 자동 자막 품질이 낮은 경우, 영상을 로컬에 받아서 Deepgram ·
        Whisper · Gemini 같은 전문 AI 엔진에 다시 태우는 방법입니다. 정확도는
        자동 자막보다 훨씬 높고, 특히 한국어 고유명사·전문 용어 인식에 큰 차이가
        납니다.
      </p>
      <p>
        <strong>중요</strong>: YouTube 이용약관(§5.B.iii) 은 스트리밍 외 방식으로
        영상 파일을 다운로드하는 것을 금지합니다. 따라서 이 방법은 <u>본인 영상</u>
        또는 권리자의 허가를 받은 영상에만 쓰는 것이 원칙입니다. 본인 영상이라면
        YouTube Studio 에서 원본 mp4 를 공식 다운로드할 수 있습니다.
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li><strong>장점</strong>: 한국어 품질 최상 (Deepgram Nova-3 기준 일반 발화 오인식 1% 대)</li>
        <li><strong>단점</strong>: 업로드·처리 시간 필요. 비용 발생.</li>
        <li><strong>추천 케이스</strong>: 본인 강의 녹화 · 회사 내부 웨비나 아카이브</li>
      </ul>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        방법 C. YouTube Studio 의 공식 캡션 다운로드
      </h2>
      <p>
        본인 채널에 업로드한 영상이라면 YouTube Studio → 자막 탭 에서{" "}
        <strong>.sbv / .vtt / .srt</strong> 파일을 직접 다운로드할 수 있습니다.
        수동 자막이 있으면 그 원본이 받아지고, 없으면 자동 자막이 받아집니다.
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li><strong>장점</strong>: 100% 합법, 별도 도구 불필요</li>
        <li><strong>단점</strong>: 본인 채널 영상만 가능. 자동 자막 품질은 방법 A 와 동일</li>
        <li><strong>추천 케이스</strong>: 본인 YouTube 채널 운영자</li>
      </ul>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        비교표
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] border border-grey-200">
          <thead className="bg-grey-50">
            <tr>
              <th className="px-3 py-2 text-left">항목</th>
              <th className="px-3 py-2 text-left">A. 공식 자막</th>
              <th className="px-3 py-2 text-left">B. AI 재전사</th>
              <th className="px-3 py-2 text-left">C. Studio 다운로드</th>
            </tr>
          </thead>
          <tbody className="[&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-grey-100">
            <tr>
              <td>소요 시간</td>
              <td>수 초</td>
              <td>1–5분 + 처리 시간</td>
              <td>수 초</td>
            </tr>
            <tr>
              <td>한국어 품질</td>
              <td>중 (자동) ~ 상 (수동)</td>
              <td>상</td>
              <td>중 (자동) ~ 상 (수동)</td>
            </tr>
            <tr>
              <td>법적 리스크</td>
              <td>낮음</td>
              <td>중 (본인 영상만 권장)</td>
              <td>없음</td>
            </tr>
            <tr>
              <td>대상 영상</td>
              <td>자막 있는 공개 영상</td>
              <td>본인·권한 있는 영상</td>
              <td>본인 채널만</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        실용적인 선택 흐름
      </h2>
      <ol className="ml-5 list-decimal space-y-1">
        <li>내 채널 영상 → 방법 C (Studio)</li>
        <li>타인 영상이지만 자막 있음 → 방법 A (공식 자막)</li>
        <li>자막 없거나 품질 아쉬움, 본인/권한 있음 → 방법 B (AI 재전사)</li>
        <li>타인 영상이고 자막 없음 → 전사 불가. 채널 운영자에게 요청하거나 공개된 다른 영상 찾기</li>
      </ol>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        맺음말
      </h2>
      <p>
        옮김은 방법 A (YouTube 링크) 와 방법 B (본인 영상 업로드) 를 한 화면에서
        제공합니다. 파일 업로드는 <strong>하루 120분 무료</strong>이고, YouTube
        링크는 <strong>무제한 무료</strong>입니다. 더 깊은 배경은{" "}
        <Link href="/about" className="text-brand hover:underline">
          소개 페이지
        </Link>
        에서 확인하세요.
      </p>
    </>
  ),
};
