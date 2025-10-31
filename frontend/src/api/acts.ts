// src/api/acts.ts
import api from "./api";
import type { Act, Paginated } from "../types";

/** Fetch paginated Acts (your backend already returns stats per act). */
export async function fetchActs(
  page = 1,
  pageSize = 20
): Promise<Paginated<Act>> {
  const res = await api.get<Paginated<Act>>("/acts", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

/** Small helper hook you can drop into any component to get live totals. */
import { useEffect, useMemo, useState } from "react";

export function useActsStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acts, setActs] = useState<Act[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchActs(1, 50)
      .then((data) => {
        if (!mounted) return;
        setActs(data.items || []);
      })
      .catch((e: Error) => {
        if (!mounted) return;
        setError(e.message);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const sectionsTotal = acts.reduce(
      (sum, a) => sum + (a.stats?.sections ?? 0),
      0
    );
    const compliancesTotal = acts.reduce(
      (sum, a) => sum + (a.stats?.compliances ?? 0),
      0
    );
    return { sectionsTotal, compliancesTotal, actsCount: acts.length };
  }, [acts]);

  return { loading, error, acts, totals };
}
