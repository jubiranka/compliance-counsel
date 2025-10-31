// shared app types (aligned to your FastAPI responses)

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED";

export interface ActStats {
  sections: number;
  compliances: number;
}

export interface Act {
  id: number;
  name: string;
  description: string | null;
  source_uri: string | null;
  source_hash: string | null;
  parser_version: string | null;
  extracted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  stats?: ActStats;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}
