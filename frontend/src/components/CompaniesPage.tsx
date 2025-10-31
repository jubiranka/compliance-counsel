// src/components/CompaniesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import Navigation from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Share,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { fetchCompanies, deleteCompany, createCompany } from "../api/companies";
import { toast } from "sonner"; // ✅ ensure installed: npm i sonner

interface Company {
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

interface CompaniesPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  refreshTrigger: number;
}

export default function CompaniesPage({
  onNavigate,
  onLogout,
  selectedCompany,
  setSelectedCompany,
  refreshTrigger,
}: CompaniesPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [apiCompanies, setApiCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 form state for adding a new company
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: "",
    cin_number: "",
    industry_type: "",
    industry: "",
    status: "",
    authorized_capital: undefined,
    paid_up_capital: undefined,
    address: "",
    registration_date: "",
    director_name: "",
    director_email: "",
    company_secretary: "",
    auditor_name: "",
    notes: "",
  });

  // 🔹 fetch companies from backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCompanies(1, 50, "");
        if (alive) setApiCompanies(data.items || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load companies.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshTrigger]);

  const companies: Company[] = useMemo(() => apiCompanies, [apiCompanies]);

  const filteredCompanies = companies.filter(
    (company) =>
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.industry_type || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // 🔹 helpers for status visualization
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "overdue":
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-green-100 text-green-700">Compliant</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // 🔹 delete company
  const handleDelete = async (company: Company) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${company.name}"?`
    );
    if (!confirmed) return;
    try {
      await deleteCompany(company.id);
      toast.success(`Deleted ${company.name}`);
      setApiCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch {
      toast.error("Failed to delete company.");
    }
  };

  // 🔹 add company
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || newCompany.name.trim().length < 2) {
      toast.error("Company name is required.");
      return;
    }

    try {
      await createCompany({
        name: newCompany.name,
        cin_number: newCompany.cin_number,
        industry_type: newCompany.industry_type,
        industry: newCompany.industry,
        status: newCompany.status,
        authorized_capital: newCompany.authorized_capital,
        paid_up_capital: newCompany.paid_up_capital,
        address: newCompany.address,
        registration_date: newCompany.registration_date,
        director_name: newCompany.director_name,
        director_email: newCompany.director_email,
        company_secretary: newCompany.company_secretary,
        auditor_name: newCompany.auditor_name,
        notes: newCompany.notes,
      });
      toast.success("Company added successfully!");
      setNewCompany({
        name: "",
        cin_number: "",
        industry_type: "",
        industry: "",
        status: "",
        authorized_capital: undefined,
        paid_up_capital: undefined,
        address: "",
        registration_date: "",
        director_name: "",
        director_email: "",
        company_secretary: "",
        auditor_name: "",
        notes: "",
      });
      const updated = await fetchCompanies(1, 50, "");
      setApiCompanies(updated.items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add company.");
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage="companies"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Companies You Manage</h1>
              <p className="text-muted-foreground mt-2">
                Manage all company compliance details here.
              </p>
            </div>
          </div>

          {/* Add company form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Company</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleAddCompany}
                className="grid grid-cols-2 gap-4"
              >
                <Input
                  placeholder="Company Name *"
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="CIN Number"
                  value={newCompany.cin_number}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, cin_number: e.target.value })
                  }
                />
                <Input
                  placeholder="Industry Type"
                  value={newCompany.industry_type}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      industry_type: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Status"
                  value={newCompany.status}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, status: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Authorized Capital"
                  value={newCompany.authorized_capital ?? ""}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      authorized_capital:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Paid-Up Capital"
                  value={newCompany.paid_up_capital ?? ""}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      paid_up_capital: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <Input
                  placeholder="Address"
                  value={newCompany.address}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, address: e.target.value })
                  }
                />
                <Input
                  type="date"
                  placeholder="Registration Date"
                  value={newCompany.registration_date}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      registration_date: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Director Name"
                  value={newCompany.director_name}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      director_name: e.target.value,
                    })
                  }
                />
                <Input
                  type="email"
                  placeholder="Director Email"
                  value={newCompany.director_email}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      director_email: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Company Secretary"
                  value={newCompany.company_secretary}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      company_secretary: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Auditor Name"
                  value={newCompany.auditor_name}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      auditor_name: e.target.value,
                    })
                  }
                />
                <textarea
                  placeholder="Notes"
                  value={newCompany.notes}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, notes: e.target.value })
                  }
                  className="col-span-2 border rounded-md p-2"
                />
                <Button type="submit" className="col-span-2">
                  Add Company
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Company List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Company Overview
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="text-muted-foreground p-4">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Industry Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Authorized Capital</TableHead>
                      <TableHead>Paid-Up Capital</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          {company.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {company.industry_type || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(company.status)}
                            {getStatusBadge(company.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          ₹{company.authorized_capital?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell>
                          ₹{company.paid_up_capital?.toLocaleString() || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onSelect={() =>
                                  onNavigate("company-profile", company)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleDelete(company)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
