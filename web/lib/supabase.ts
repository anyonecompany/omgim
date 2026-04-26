import { createClient } from "@supabase/supabase-js";

// 빌드 환경(로컬/CI)에서 env 없어도 모듈 로드는 성공해야 함.
// createClient 가 빈 URL 을 거부해서 placeholder 사용. 실제 런타임 호출 시
// 잘못된 키/URL 이면 Supabase API 가 401 등으로 응답. Vercel 프로덕션은 env 주입 보장.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type JobStatus =
  | "pending"
  | "uploading"
  | "transcribing"
  | "completed"
  | "failed";

export interface Job {
  id: string;
  client_key: string;
  status: JobStatus;
  filename: string;
  size_bytes: number;
  duration_sec: number | null;
  blob_url: string | null;
  result_txt_url: string | null;
  result_srt_url: string | null;
  result_vtt_url: string | null;
  cost_usd: number | null;
  engine: string | null;
  error: string | null;
  deletion_pending: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
