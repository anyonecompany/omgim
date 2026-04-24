import { supabaseAdmin } from "./supabase";

export const DAILY_QUOTA_MIN = 120; // 무료 플랜: 일 2시간 업로드 전사
export const QUOTA_TIMEZONE_OFFSET_HOURS = 9; // KST 기준 하루 경계

export interface QuotaStatus {
  usedMin: number;
  remainingMin: number;
  quotaMin: number;
  resetAt: string; // ISO 시간, 다음 KST 00:00
}

/**
 * 오늘(KST) 자정 시각을 ISO 문자열로 반환.
 * KST는 UTC+9 라서 UTC 기준 오늘 15:00 이 KST 0:00.
 */
function kstMidnightIso(): string {
  const now = new Date();
  const kstNow = new Date(
    now.getTime() + QUOTA_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000,
  );
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(
    kstNow.getTime() - QUOTA_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000,
  ).toISOString();
}

function nextKstMidnightIso(): string {
  const now = new Date();
  const kstNow = new Date(
    now.getTime() + QUOTA_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000,
  );
  kstNow.setUTCHours(24, 0, 0, 0);
  return new Date(
    kstNow.getTime() - QUOTA_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000,
  ).toISOString();
}

/**
 * client_key 기준 오늘(KST) upload 타입으로 사용한 분(minute) 합계.
 * YouTube 자막 추출은 원가 ≈0 이라 쿼터 대상 아님 (source='upload' 만 집계).
 */
export async function getUsedMinutesToday(
  clientKey: string,
): Promise<number> {
  const since = kstMidnightIso();
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("duration_sec")
    .eq("client_key", clientKey)
    .eq("source", "upload")
    .gte("created_at", since);

  if (error || !data) return 0;
  const totalSec = data.reduce(
    (sum, row) => sum + (row.duration_sec ?? 0),
    0,
  );
  return totalSec / 60;
}

export async function getQuotaStatus(clientKey: string): Promise<QuotaStatus> {
  const usedMin = await getUsedMinutesToday(clientKey);
  const remainingMin = Math.max(0, DAILY_QUOTA_MIN - usedMin);
  return {
    usedMin: Math.round(usedMin * 10) / 10,
    remainingMin: Math.round(remainingMin * 10) / 10,
    quotaMin: DAILY_QUOTA_MIN,
    resetAt: nextKstMidnightIso(),
  };
}
