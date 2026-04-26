import { del } from "@vercel/blob";
import { supabaseAdmin } from "./supabase";

// 원본 영상 Blob 삭제 — 1회 재시도 후 실패하면 deletion_pending 마킹.
// cron(/api/cron/cleanup-blobs)이 주기적으로 pending 행을 회수한다.
export async function tryDeleteOriginalBlob(jobId: string): Promise<void> {
  const { data: job, error } = await supabaseAdmin
    .from("jobs")
    .select("blob_url")
    .eq("id", jobId)
    .single();
  if (error || !job?.blob_url) return;

  const blobUrl = job.blob_url;

  try {
    await del(blobUrl);
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    try {
      await del(blobUrl);
    } catch (e2) {
      console.error("[blob-cleanup] delete failed twice:", e2);
      await supabaseAdmin
        .from("jobs")
        .update({ deletion_pending: true })
        .eq("id", jobId);
      return;
    }
  }

  await supabaseAdmin
    .from("jobs")
    .update({ blob_url: null, deletion_pending: false })
    .eq("id", jobId);
}
