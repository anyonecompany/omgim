import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildDeepgramAsyncUrl } from "@/lib/deepgram";

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
        const { jobId, clientKey, filename, size } = JSON.parse(
          tokenPayload ?? "{}",
        );

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
        const dgRes = await fetch(buildDeepgramAsyncUrl(callbackUrl), {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: blob.url }),
        });

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
