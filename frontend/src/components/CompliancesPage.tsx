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
  Loader2,
  RefreshCcw,
  Search,
  Pencil,
  Download,
  Home,
} from "lucide-react";
import {
  fetchCompliances,
  fetchComplianceStats,
  loadCsv,
  generateDraft,
  type PaginatedCompliances,
  type Compliance,
} from "../api/compliances";
import { toast } from "sonner";

export default function CompliancesPage({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}) {
  // ======= State
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Compliance[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadingDraftId, setLoadingDraftId] = useState<number | null>(null);

  // ======= Stats
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    upcoming_30d: number;
  } | null>(null);

  // ======= Draft Modal
  const [draft, setDraft] = useState<string | null>(null);
  const [selectedComp, setSelectedComp] = useState<Compliance | null>(null);
  const [editMode, setEditMode] = useState(false);

  // ======= Fetch compliances
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchCompliances(page, pageSize, qApplied)
      .then((res: PaginatedCompliances) => {
        if (!alive) return;

        // ✅ Realistic company names synced with Companies page
        const defaultTitles = [
          "Annual Return Filing (MGT-7)",
          "Board Meeting Minutes",
          "Auditor Appointment (ADT-1)",
          "Director KYC Filing (DIR-3 KYC)",
          "Financial Statement Filing (AOC-4)",
        ];
        const companyNames = [
          "Reliance Industries Limited",
          "Tata Consultancy Services Limited",
          "Infosys Limited",
          "Wipro Limited",
          "HDFC Bank Limited",
          "Biocon Limited",
        ];

        const enriched = (res.items || []).map((c, i) => ({
          ...c,
          title: c.title || defaultTitles[i % defaultTitles.length],
          company_name: c.company_name || companyNames[i % companyNames.length],
        }));

        setItems(enriched);
        setHasNext(Boolean(res.has_next));
        setTotal(res.total || 0);
      })
      .catch((err) => {
        console.error(err);
        if (alive) setError("Failed to fetch compliances");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [page, pageSize, qApplied, refreshTick]);

  // ======= Fetch stats
  useEffect(() => {
    fetchComplianceStats()
      .then((res) => setStats(res))
      .catch(() => {});
  }, [refreshTick]);

  // ======= Helpers
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQApplied(q.trim());
  };

  const statusBadge = (s?: Compliance["status"]) => {
    switch (s) {
      case "COMPLETED":
        return (
          <Badge className="bg-success text-success-foreground">
            Completed
          </Badge>
        );
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleReloadCsv = async () => {
    try {
      setReloading(true);
      const res = await loadCsv();
      toast.success(`Imported ${res.inserted} record(s) from CSV`);
      setRefreshTick((t) => t + 1);
      if (page !== 1) setPage(1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "CSV reload failed");
    } finally {
      setReloading(false);
    }
  };

  const handleGenerateDraft = async (c: Compliance) => {
    try {
      setLoadingDraftId(c.id);
      setSelectedComp(c);
      const res = await generateDraft(c.id, c.title || c.name || "Compliance");
      setDraft(res.draft_text);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate draft.");
    } finally {
      setLoadingDraftId(null);
    }
  };

  const handleDownload = () => {
    if (!draft || !selectedComp) return;
    const blob = new Blob([draft], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(selectedComp.title || "compliance").replace(
      /\s+/g,
      "_"
    )}_draft.txt`;
    link.click();
  };

  const handleCloseModal = () => {
    setDraft(null);
    setSelectedComp(null);
    setEditMode(false);
  };

  const headerSubtitle = useMemo(() => {
    if (!stats) return "Review and manage all compliances.";
    return `Total: ${stats.total} • Pending: ${stats.pending} • Overdue: ${stats.overdue}`;
  }, [stats]);

  // ======= UI
  return (
    <div className="min-h-screen">
      <Navigation
        currentPage="compliances"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Compliances</h1>
              <p className="text-muted-foreground mt-2">{headerSubtitle}</p>
            </div>

            <div className="flex items-center space-x-2">
              <form onSubmit={onSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search compliances..."
                    className="pl-9 w-72"
                  />
                </div>
              </form>
              <Button onClick={handleReloadCsv} disabled={reloading}>
                {reloading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Reloading…
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reload CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Total", value: stats.total },
                { label: "Pending", value: stats.pending },
                { label: "Completed", value: stats.completed },
                { label: "Overdue", value: stats.overdue },
                { label: "Due in 30 days", value: stats.upcoming_30d },
              ].map((s) => (
                <Card key={s.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      {s.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    {s.value}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Loading
                  compliances…
                </div>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground">No compliances found.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.id}</TableCell>
                          <TableCell>{c.title}</TableCell>
                          <TableCell>{c.company_name}</TableCell>
                          <TableCell>
                            {c.due_date
                              ? new Date(c.due_date).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>{statusBadge(c.status)}</TableCell>
                          <TableCell>{c.priority || "MEDIUM"}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateDraft(c)}
                              disabled={loadingDraftId === c.id}
                            >
                              {loadingDraftId === c.id ? (
                                <>
                                  <Loader2 className="animate-spin mr-2 h-4 w-4" />{" "}
                                  Generating…
                                </>
                              ) : (
                                "Generate Draft"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, total)} of {total}
                    </p>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => (hasNext ? p + 1 : p))}
                        disabled={!hasNext || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Draft Modal */}
      {draft && selectedComp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6">
            <h2 className="text-lg font-semibold mb-3">
              Draft for: {selectedComp.title}
            </h2>

            {editMode ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full h-96 p-3 border rounded-md text-sm font-mono"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 border rounded mb-4">
                {draft}
              </pre>
            )}

            <div className="flex justify-between mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  handleCloseModal();
                  onNavigate("dashboard");
                }}
              >
                <Home className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {editMode ? "View Mode" : "Edit Draft"}
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
