import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export const post: BlogPost = {
  slug: "korean-stt-comparison",
  title: "한국어 AI 음성 인식 엔진 비교: Deepgram · Whisper · Gemini (2026)",
  description:
    "한국어 STT 엔진 3종을 정확도 · 속도 · 비용 · API 사용성 관점에서 실사용 기준으로 비교합니다.",
  publishedAt: "2026-04-24T02:00:00Z",
  readMinutes: 8,
  tags: ["STT", "한국어", "Deepgram", "Whisper", "Gemini", "비교"],
  body: (
    <>
      <p>
        한국어 음성 인식 서비스를 만들려고 엔진을 고르다 보면 "결국 뭐가 제일
        좋은가"라는 질문에 부딪힙니다. 2026 년 기준 상용 API 세 가지 —{" "}
        <strong>Deepgram Nova-3 · OpenAI Whisper · Google Gemini</strong> —
        를 정확도 · 속도 · 비용 · 사용성 관점에서 정리합니다. 옮김 구축 과정에서
        실측한 수치를 담았습니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        요약 비교
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] border border-grey-200">
          <thead className="bg-grey-50">
            <tr>
              <th className="px-3 py-2 text-left">항목</th>
              <th className="px-3 py-2 text-left">Deepgram Nova-3</th>
              <th className="px-3 py-2 text-left">Whisper API (OpenAI)</th>
              <th className="px-3 py-2 text-left">Gemini 2.0 (audio)</th>
            </tr>
          </thead>
          <tbody className="[&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-grey-100">
            <tr>
              <td>한국어 품질</td>
              <td>상 (구어체·고유명사 강함)</td>
              <td>상 (중문어체 강함)</td>
              <td>상 (문어체 강함)</td>
            </tr>
            <tr>
              <td>처리 속도 (90분 영상)</td>
              <td>~1분</td>
              <td>~3–5분 (25MB 청크 필요)</td>
              <td>~1–2분</td>
            </tr>
            <tr>
              <td>단일 파일 크기 한도</td>
              <td>2 GB</td>
              <td>25 MB</td>
              <td>~2 GB (Files API)</td>
            </tr>
            <tr>
              <td>분당 비용</td>
              <td>$0.0043 (nova-3)</td>
              <td>$0.006</td>
              <td>$0.0001 미만 (audio tokens)</td>
            </tr>
            <tr>
              <td>타임스탬프·화자 분리</td>
              <td>내장 (단어·utterance·diarize)</td>
              <td>세그먼트 단위</td>
              <td>문장 단위 (수동 파싱)</td>
            </tr>
            <tr>
              <td>무료 티어</td>
              <td>$200 신규 크레딧</td>
              <td>없음 (API 종량)</td>
              <td>일 1500 요청 (flash)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        1. 정확도 — 실측
      </h2>
      <p>
        대학 강의 녹화(약 1h 40m, 한국어) 를 세 엔진 각각에 태운 결과:
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>Deepgram Nova-3</strong>: 구어체("했거든요", "~잖아요" 등)
          처리가 자연스러움. "현대자동차"·"금속노조" 같은 고유명사 정확
          인식. 숫자·외래어 혼용 시 강점.
        </li>
        <li>
          <strong>Whisper</strong>: 문장 마무리 표현이 표준화되는 경향
          (구어체가 문어체로 변환). 학술 용어는 정확하나 구어체 "~잖아"
          처럼 문법에서 벗어난 표현이 "~잖아요" 로 자동 교정되어 원형
          보존은 떨어짐.
        </li>
        <li>
          <strong>Gemini 2.0</strong>: 전반적으로 매끄러운 문어체 출력.
          타임스탬프가 단어 단위로 촘촘하지 않아 자막 생성에는 후처리
          필요.
        </li>
      </ul>
      <p>
        구어체 원형 보존이 중요한 회의·강의 기록에는 Deepgram, 공식 기사·논문
        초안에는 Whisper 나 Gemini 가 유리합니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        2. 처리 속도 — SaaS 설계 관점
      </h2>
      <p>
        대용량 파일을 단일 요청으로 받는지가 핵심입니다. Whisper 는 25MB 제한
        때문에 1.5시간 영상을 청크로 자르고 합치는 파이프라인이 필요합니다.
        Deepgram 과 Gemini 는 단일 요청으로 처리되어 서버 로직이 훨씬 간단합니다.
      </p>
      <p>
        Vercel Functions 처럼 타임아웃(300s) 이 있는 환경에서는 async + webhook
        콜백 패턴이 중요합니다. Deepgram 은 <code>callback</code> 파라미터로
        공식 지원하며, 옮김 역시 이 패턴으로 구축했습니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        3. 비용 — 실제 지출 예시
      </h2>
      <p>
        옮김 Phase 0 에서 대학 강의 6편(총 10h 11m) 을 Deepgram 으로 전사한
        실제 지출은 <strong>$2.63</strong> 이었습니다 (신규 크레딧 $200 내).
      </p>
      <p>
        Gemini 는 오디오 토큰이 매우 저렴해 이론적으로는 Deepgram 대비 10분의
        1 이하이지만, Files API 업로드·처리 시간·문장 단위 타임스탬프 파싱
        추가 개발 비용을 고려하면 단순 "분당 가격" 으로만 판단하기 어렵습니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        4. API 사용성
      </h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>Deepgram</strong>: URL 기반 async + webhook, SDK 성숙. 옮김은
          이 방식으로 구축.
        </li>
        <li>
          <strong>Whisper</strong>: 파일 업로드 동기 API. 청크 로직 + 순서
          보장 + 중복 제거가 추가 부담.
        </li>
        <li>
          <strong>Gemini</strong>: Google GenAI SDK 로 Files API 업로드 → 동기
          호출. 응답 포맷을 프롬프트로 통제 (JSON 강제 등).
        </li>
      </ul>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        5. 실무 선택 가이드
      </h2>
      <ol className="ml-5 list-decimal space-y-1">
        <li>
          <strong>실시간·장시간·한국어 구어체 중시</strong> → Deepgram Nova-3
        </li>
        <li>
          <strong>문어체 · 학술 용어 · 영어 섞인 콘텐츠</strong> → Whisper 또는
          Gemini
        </li>
        <li>
          <strong>비용 극단 최소화 + 품질도 괜찮음</strong> → Gemini 2.0 Flash
          (단 개발 공수 있음)
        </li>
        <li>
          <strong>화자 분리 · 감정 · 언어 감지까지</strong> → AssemblyAI Best
          (본 글엔 미포함, 별도 엔진)
        </li>
      </ol>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        맺음말
      </h2>
      <p>
        옮김은 Deepgram Nova-3 를 기본 엔진, Gemini 2.0 을 보조 엔진(CLI) 으로
        구성했습니다. 업로드 기능은 언어를 자동 감지하므로 한국어 · 영어 영상
        모두 같은 정확도로 처리됩니다. 실제로 시도해보고 싶다면{" "}
        <Link href="/" className="text-brand hover:underline">
          옮김 홈
        </Link>
        에서 바로 업로드하거나 YouTube 링크를 붙여넣어 보세요.
      </p>
    </>
  ),
};
