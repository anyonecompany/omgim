import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export const post: BlogPost = {
  slug: "meeting-transcription-guide",
  title: "회의 녹화를 텍스트로 정리하는 실용 가이드",
  description:
    "Zoom · Google Meet · 오프라인 녹음을 텍스트로 옮기고, 요약·액션 아이템까지 뽑는 실무 워크플로우를 정리했습니다.",
  publishedAt: "2026-04-24T01:00:00Z",
  readMinutes: 7,
  tags: ["회의", "녹화", "한국어", "생산성"],
  body: (
    <>
      <p>
        회의 녹화가 30분만 넘어가도 나중에 "거기서 뭐 결정했더라?" 를
        되짚기 위해 영상을 다시 감는 것은 비효율입니다. 텍스트로 한 번만 옮겨두면
        검색·인용·공유가 10배 쉬워집니다. 이 글에서는 회의 녹화를 텍스트로
        정리하는 현실적 절차를 단계별로 소개합니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        1단계: 녹화 소스 확보
      </h2>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>Zoom</strong>: 로컬 녹화(.mp4) 또는 클라우드 녹화. 클라우드는
          "내 기록" 에서 mp4 다운로드 가능.
        </li>
        <li>
          <strong>Google Meet</strong>: Workspace 관리자 승인 시 Drive 에 자동
          저장. 파일 형식은 mp4.
        </li>
        <li>
          <strong>오프라인</strong>: 스마트폰 녹음(m4a) 또는 리코더(wav).
          옮김은 양쪽 다 그대로 업로드 가능합니다.
        </li>
      </ul>
      <p>
        Tip: 참석자 모두가 발언하는 자리라면 회의 시작에 "녹화·전사에 동의해
        주세요" 한 마디를 남기고 녹화를 시작하세요. 사후 동의 요청보다
        매끄럽습니다.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        2단계: 전사 도구 선택
      </h2>
      <p>
        한국어 회의 녹화는 영어권 도구(Otter.ai 등) 보다는{" "}
        <strong>한국어 고정확도 엔진</strong> 을 쓰는 게 정답입니다. Deepgram
        Nova-3 · Google Speech-to-Text · Naver Clova 등이 후보이며, 최근엔
        Deepgram 의 한국어 품질이 많이 올라왔습니다. 실측 기준 대화형 한국어에서
        고유명사·전문 용어 인식 정확도가 95% 이상 나옵니다.
      </p>
      <p>
        옮김은 Deepgram Nova-3 엔진을 기본으로 사용합니다. 1시간 회의 영상을
        업로드하면 약 1분 안에 TXT/SRT/VTT 파일로 결과를 받을 수 있어요.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        3단계: 텍스트 후처리
      </h2>
      <p>
        AI 전사 결과는 그대로 쓰기보다 약간의 후처리를 거치면 품질이 크게
        올라갑니다.
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <strong>고유명사 보정</strong>: 회사명·제품명·인명 1회 전체 찾아
          바꾸기. 한 번 맞추면 본문 전체가 정돈됩니다.
        </li>
        <li>
          <strong>문단 단위 개행</strong>: 발화자 교체 시점이나 주제 전환에서
          빈 줄 하나 추가. 가독성이 훨씬 좋아집니다.
        </li>
        <li>
          <strong>불필요 어절 제거</strong>: "어", "음", "그" 같은 filler 가
          과하게 남으면 일괄 삭제 (정규식 <code>\s(어|음|그)\s</code>).
        </li>
      </ul>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        4단계: 요약 · 액션 아이템 추출
      </h2>
      <p>
        전사된 TXT 를 LLM(ChatGPT · Claude · Gemini) 에 넣고 아래 프롬프트를
        쓰면 회의록 수준의 결과가 나옵니다.
      </p>
      <pre className="overflow-x-auto rounded-md bg-grey-100 p-4 text-[13px] leading-[20px] text-grey-800">
{`다음은 회의 전사 원문입니다. 세 가지를 뽑아주세요.
1. 3줄 요약 (배경 · 결정 · 다음 단계)
2. 액션 아이템 (담당자 · 마감일 · 내용)
3. 후속 질문·불확실성 포인트

---
[전사 내용 붙여넣기]`}</pre>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        5단계: 저장 · 공유 포맷
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] border border-grey-200">
          <thead className="bg-grey-50">
            <tr>
              <th className="px-3 py-2 text-left">용도</th>
              <th className="px-3 py-2 text-left">추천 포맷</th>
              <th className="px-3 py-2 text-left">왜</th>
            </tr>
          </thead>
          <tbody className="[&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-grey-100">
            <tr>
              <td>Notion · Confluence 정리</td>
              <td>TXT</td>
              <td>타임스탬프 없이 본문 중심. 요약 블록 추가 쉬움</td>
            </tr>
            <tr>
              <td>영상 위에 자막 입히기</td>
              <td>SRT</td>
              <td>Premiere Pro · DaVinci · 유튜브 업로드 모두 지원</td>
            </tr>
            <tr>
              <td>웹 플레이어 싱크</td>
              <td>VTT</td>
              <td>HTML5 video track 요소 표준</td>
            </tr>
            <tr>
              <td>후속 가공·검색용 DB</td>
              <td>JSON (단어 단위 타임스탬프 포함)</td>
              <td>재가공·스크립트 자동화에 유리</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        자주 묻는 질문
      </h2>
      <p>
        <strong>Q. 녹화 원본이 개인 정보가 담겨있어요. 업로드해도 되나요?</strong>
      </p>
      <p>
        옮김은 원본 영상을 전사 완료 직후 자동 삭제합니다. 결과 TXT/SRT/VTT 만
        Blob 에 남고, 그것도 일정 기간 후 자동 삭제 스케줄 적용 예정입니다. 다만
        외부 서비스 저장이 걸리는 고민감 회의는 로컬 CLI 버전(Python) 사용을
        권장합니다.
      </p>
      <p>
        <strong>Q. 여러 명 회의에서 누가 말했는지 구분되나요?</strong>
      </p>
      <p>
        현재 옮김 Phase 1 은 화자 분리를 켜지 않았습니다 (Phase 2 차별화 기능으로
        검토 중). 당장 필요하면 Deepgram 의 diarize 옵션을 CLI 에서 수동으로 켜
        쓰거나, AssemblyAI Best 모델을 사용해주세요.
      </p>

      <h2 className="text-[20px] font-semibold text-grey-900 pt-4">
        요약
      </h2>
      <ol className="ml-5 list-decimal space-y-1">
        <li>녹화 파일 확보 (Zoom/Meet/오프라인)</li>
        <li>한국어 품질 좋은 엔진 선택 — 옮김 = Deepgram Nova-3</li>
        <li>고유명사·문단·filler 간단 후처리</li>
        <li>LLM 으로 요약·액션 아이템 추출</li>
        <li>용도에 맞는 포맷(TXT/SRT/VTT/JSON) 으로 저장</li>
      </ol>
      <p>
        30분 단위 회의 하나를 이 흐름으로 정리하는 데 총 10–15분이면 충분합니다.{" "}
        <Link href="/" className="text-brand hover:underline">
          옮김 홈
        </Link>
        에서 바로 시작할 수 있어요.
      </p>
    </>
  ),
};
