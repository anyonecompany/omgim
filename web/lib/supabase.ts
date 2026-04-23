import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL 미설정");
if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY 미설정");

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
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
