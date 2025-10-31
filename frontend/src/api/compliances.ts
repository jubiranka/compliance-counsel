// src/api/compliances.ts
import api from "./api";

/** ✅ Compliance model aligned with backend list payload */
export interface Compliance {
  id: number;
  company_id?: number | null;
  act_id?: number | null;
  section_id?: number | null;
  rule_id?: number | null;
  form_id?: number | null;
  status?: string | null;
  due_date?: string | null;
  verified_status?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  remarks?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // UI-only safe fallbacks
  title?: string;
  name?: string;
  company_name?: string;
  priority?: string;
}

/** ✅ Paginated response from backend */
export interface PaginatedCompliances {
  items: Compliance[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

/** 🔎 Helper for safe filtering */
const contains = (text: any, q: string) => {
  if (!text) return false;
  return String(text).toLowerCase().includes(q.toLowerCase());
};

/** ✅ Fetch compliances (paginated) */
export async function fetchCompliances(
  page = 1,
  pageSize = 20,
  q?: string,
  companyId?: number
): Promise<PaginatedCompliances> {
  const res = await api.get<PaginatedCompliances>("/compliances/", {
    params: {
      page,
      page_size: pageSize,
      ...(q ? { q } : {}),
      ...(companyId ? { company_id: companyId } : {}),
    },
  });

  let data = res.data;
  if (q || companyId) {
    const filtered = data.items.filter((c) => {
      const byCompany = companyId ? c.company_id === companyId : true;
      const byQ = q
        ? contains(c.id, q) ||
          contains(c.status, q) ||
          contains(c.remarks, q) ||
          contains(c.title, q) ||
          contains(c.name, q)
        : true;
      return byCompany && byQ;
    });

    return {
      items: filtered.slice(0, pageSize),
      page: 1,
      page_size: pageSize,
      total: filtered.length,
      has_next: filtered.length > pageSize,
    };
  }

  return data;
}

/** ✅ Compliance summary stats */
export async function fetchComplianceStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  upcoming_30d: number;
}> {
  const res = await api.get("/compliances/stats");
  return res.data;
}

/** ✅ Optional CSV loader */
export async function loadCsv(): Promise<{
  status: string;
  inserted?: number;
}> {
  try {
    const res = await api.post("/compliances/load-csv");
    return res.data;
  } catch (error: any) {
    console.warn("⚠️ CSV import not available:", error.message);
    return { status: "failed" };
  }
}

/** ✅ Unified Draft Generator — connects to /drafts/generate */
export async function generateDraft(
  complianceId: number,
  complianceTitle?: string
): Promise<{ draft_text: string }> {
  const res = await api.post<{ draft_text: string }>("/drafts/generate", {
    compliance_id: complianceId,
    compliance_title: complianceTitle || "Untitled Compliance",
  });
  return res.data;
}

/** ✅ Legacy alias — for backward compatibility with old imports */
export const generateComplianceDraft = async (
  userInput: number | string
): Promise<{ draft_text: string }> => {
  // If it's numeric, treat as compliance ID
  if (typeof userInput === "number") {
    return generateDraft(userInput, `Compliance ${userInput}`);
  }
  // If it's string, assume user typed title
  return generateDraft(0, userInput);
};
