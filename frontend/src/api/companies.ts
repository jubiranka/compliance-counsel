// src/api/companies.ts
import api from "./api";

/** ✅ Company model matching backend schema */
export interface Company {
  id: number;
  name: string;
  cin_number?: string;
  industry_type?: string;
  industry?: string;
  status?: string;
  authorized_capital?: number;
  paid_up_capital?: number;
  address?: string;
  registration_date?: string;
  director_name?: string;
  director_email?: string;
  company_secretary?: string;
  auditor_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/** ✅ Payload sent when creating/updating a company */
export interface CompanyPayload {
  name: string;
  cin_number?: string | null;
  industry_type?: string | null;
  industry?: string | null;
  status?: string | null;
  authorized_capital?: number | null;
  paid_up_capital?: number | null;
  address?: string | null;
  registration_date?: string | null;
  director_name?: string | null;
  director_email?: string | null;
  company_secretary?: string | null;
  auditor_name?: string | null;
  notes?: string | null;
}

/** ✅ Paginated list of companies */
export interface PaginatedCompanies {
  items: Company[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}

/** ✅ Fetch all companies (paginated, optional search) */
export async function fetchCompanies(
  page = 1,
  pageSize = 20,
  search = ""
): Promise<PaginatedCompanies> {
  const res = await api.get<PaginatedCompanies>("/companies", {
    params: { page, page_size: pageSize, q: search },
  });
  return res.data;
}

/** ✅ Create a new company (sends structured payload) */
export async function createCompany(payload: CompanyPayload): Promise<Company> {
  const res = await api.post<Company>("/companies", payload);
  return res.data;
}

/** ✅ Update an existing company (sends structured payload) */
export async function updateCompany(
  id: number,
  payload: CompanyPayload
): Promise<Company> {
  const res = await api.put<Company>(`/companies/${id}`, payload);
  return res.data;
}

/** ✅ Delete a company */
export async function deleteCompany(id: number): Promise<void> {
  await api.delete(`/companies/${id}`);
}
