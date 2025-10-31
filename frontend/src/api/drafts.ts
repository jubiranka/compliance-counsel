import api from "./api";

export interface DraftResponse {
  draft_text: string;
}

export async function generateDraft(
  complianceId: number,
  complianceTitle: string
): Promise<DraftResponse> {
  const res = await api.post<DraftResponse>("/drafts/generate", {
    compliance_id: complianceId,
    compliance_title: complianceTitle,
  });
  return res.data;
}
