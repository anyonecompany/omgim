"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientKey } from "./client-key";

export interface QuotaSnapshot {
  usedMin: number;
  remainingMin: number;
  quotaMin: number;
  resetAt: string;
}

export function useQuota() {
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const clientKey = getClientKey();
    if (!clientKey) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/usage?clientKey=${encodeURIComponent(clientKey)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as QuotaSnapshot;
        setQuota(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quota, loading, refresh };
}
