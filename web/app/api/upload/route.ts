import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildDeepgramAsyncUrl, type TranscribeLanguage } from "@/lib/deepgram";
import { DAILY_QUOTA_MIN, getUsedMinutesToday } from "@/lib/quota";

const ALLOWED_LANGS: TranscribeLanguage[] = ["auto", "ko", "en"];

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024 * 1024;

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  const origin = new URL(req.url).origin;

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayloadRaw) => {
        const payload = JSON.parse(clientPayloadRaw ?? "{}");
        if (!payload.jobId || !payload.clientKey) {
          throw new Error("missing jobId or clientKey");
        }

        // 쿼터 사전 체크: 이미 오늘 쓴 분 + 이번 업로드 예상 길이(클라 측정값) ≤ 120
        const usedMin = await getUsedMinutesToday(payload.clientKey);
        const expectedMin = Number(payload.expectedDurationSec ?? 0) / 60;
        if (usedMin >= DAILY_QUOTA_MIN) {
          throw new Error(
            `QUOTA_EXCEEDED::오늘 무료 쿼터 ${DAILY_QUOTA_MIN}분을 모두 사용했어요. 한국 시간 자정 이후 초기화됩니다.`,
          );
        }
        if (expectedMin > 0 && usedMin + expectedMin > DAILY_QUOTA_MIN) {
          const remaining = Math.max(0, DAILY_QUOTA_MIN - usedMin);
          throw new Error(
            `QUOTA_EXCEEDED::남은 쿼터 ${remaining.toFixed(1)}분 (영상 길이 ${expectedMin.toFixed(1)}분). 더 짧은 영상이나 내일 다시 시도해주세요.`,
          );
        }

        return {
          allowedContentTypes: [
            "video/*",
            "audio/*",
            "application/octet-stream",
          ],
          tokenPayload: JSON.stringify(payload),
          maximumSizeInBytes: MAX_BYTES,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { jobId, clientKey, filename, size, language } = JSON.parse(
          tokenPayload ?? "{}",
        );

        const lang: TranscribeLanguage = ALLOWED_LANGS.includes(
          language as TranscribeLanguage,
        )
          ? (language as TranscribeLanguage)
          : "auto";

        await supabaseAdmin.from("jobs").upsert({
          id: jobId,
          client_key: clientKey,
          status: "transcribing",
          filename,
          size_bytes: size,
          blob_url: blob.url,
          engine: "deepgram",
        });

        const callbackUrl = `${origin}/api/webhook/deepgram?jobId=${jobId}`;
        const dgRes = await fetch(
          buildDeepgramAsyncUrl(callbackUrl, { language: lang }),
          {
            method: "POST",
            headers: {
              Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: blob.url }),
          },
        );

        if (!dgRes.ok) {
          const errText = await dgRes.text();
          await supabaseAdmin
            .from("jobs")
            .update({
              status: "failed",
              error: `Deepgram ${dgRes.status}: ${errText.slice(0, 200)}`,
            })
            .eq("id", jobId);
        }
      },
    });
    return NextResponse.json(response);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "upload failed" },
      { status: 400 },
    );
  }
}
