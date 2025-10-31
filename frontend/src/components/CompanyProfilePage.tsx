// src/components/CompanyProfilePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import Navigation from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Loader2, Search, FileText, Download, Wand2 } from "lucide-react";
import {
  fetchCompliances,
  generateComplianceDraft,
  type Compliance,
  type PaginatedCompliances,
} from "../api/compliances";
import { toast } from "sonner";

/** Minimal role awareness
 * If you already store role in global state, replace this with your hook/context.
 */
async function fetchRole(): Promise<"ADMIN" | "USER" | "VIEWER" | null> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/protected`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json(); // { message: "Hello X, your role is UserRole.ADMIN" }
    const match = /UserRole\.(ADMIN|USER|VIEWER)/.exec(data?.message || "");
    return (match?.[1] as any) || null;
  } catch {
    return null;
  }
}

/** Simple modal (no design change; uses same tailwind style) */
function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">{title}</h3>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function CompanyProfilePage({
  company,
  onBack,
  onNavigate,
  onLogout,
}: {
  company: { id: number; name: string };
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}) {
  // ======= state
  const [role, setRole] = useState<"ADMIN" | "USER" | "VIEWER" | null>(null);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Compliance[]>([]);

  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");

  // Draft modal state
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftText, setDraftText] = useState<string>("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftUserInput, setDraftUserInput] = useState<string>("");

  // ======= effects
  useEffect(() => {
    fetchRole()
      .then(setRole)
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchCompliances(page, pageSize, qApplied, company?.id)
      .then((res: PaginatedCompliances) => {
        if (!alive) return;
        setItems(res.items || []);
        setHasNext(Boolean(res.has_next));
        setTotal(res.total || 0);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load compliances for this company");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, pageSize, qApplied, company?.id]);

  // ======= helpers
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
      case "PENDING":
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const headerSubtitle = useMemo(() => {
    return `Company #${company?.id} • ${company?.name}`;
  }, [company]);

  // ======= draft
  const openDraftFromRow = async (complianceId: number) => {
    try {
      setDraftLoading(true);
      setDraftOpen(true);
      setDraftText("");
      const data = await generateComplianceDraft(complianceId);
      // we just display whatever backend returns (string or structured)
      const text =
        typeof data === "string"
          ? data
          : data.draft || JSON.stringify(data, null, 2);
      setDraftText(text);
    } catch (e: any) {
      setDraftText("");
      toast.error(e?.message || "Draft generation failed");
    } finally {
      setDraftLoading(false);
    }
  };

  const openDraftFromTopButton = async () => {
    const userInput = draftUserInput.trim();
    if (!userInput) {
      toast.error("Please enter compliance ID or a keyword");
      return;
    }
    try {
      setDraftLoading(true);
      setDraftOpen(true);
      setDraftText("");
      const data = await generateComplianceDraft(userInput);
      const text =
        typeof data === "string"
          ? data
          : data.draft || JSON.stringify(data, null, 2);
      setDraftText(text);
    } catch (e: any) {
      setDraftText("");
      toast.error(e?.message || "Draft generation failed");
    } finally {
      setDraftLoading(false);
    }
  };

  const downloadDraft = () => {
    const blob = new Blob([draftText || ""], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const namePart = (company?.name || "company").replace(/\s+/g, "_");
    a.download = `draft_${namePart}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Split into Routine vs Conditional (if you later add a field, swap the predicate)
  const routineItems = items; // TODO: replace with real routine filter when available
  const conditionalItems = items; // TODO: replace with real conditional filter when available

  // ======= render
  if (!company) {
    return (
      <div className="min-h-screen">
        <Navigation
          currentPage="companies"
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
        <main className="ml-64 pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-muted-foreground">No company selected.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage="companies"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground mt-2">{headerSubtitle}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            </div>
          </div>

          {/* tabs */}
          <Tabs defaultValue="routine" className="w-full">
            <TabsList>
              <TabsTrigger value="routine">Routine Compliance</TabsTrigger>
              <TabsTrigger value="conditional">
                Conditional Compliance
              </TabsTrigger>
            </TabsList>

            {/* Routine */}
            <TabsContent value="routine" className="mt-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Routine Compliance</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Live data filtered by company. Use search to narrow down.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <form onSubmit={onSearch}>
                        <Input
                          value={draftUserInput}
                          onChange={(e) => setDraftUserInput(e.target.value)}
                          placeholder="ID or keyword for draft…"
                          className="pl-9 w-56"
                        />
                      </form>
                    </div>
                    <Button
                      onClick={openDraftFromTopButton}
                      title="Generate Draft"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Draft
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* search for table */}
                  <form onSubmit={onSearch} className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search compliances…"
                        className="w-72"
                      />
                      <Button type="submit" variant="outline">
                        Search
                      </Button>
                    </div>
                  </form>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Loading…
                    </div>
                  ) : routineItems.length === 0 ? (
                    <p className="text-muted-foreground">
                      No compliances found.
                    </p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {routineItems.map((c) => (
                            <TableRow key={c.id} className="hover:bg-accent/20">
                              <TableCell className="text-muted-foreground">
                                {c.id}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {c.due_date
                                  ? new Date(c.due_date).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                              <TableCell>{statusBadge(c.status)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {c.remarks || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => openDraftFromRow(c.id)}
                                  title="Generate Draft for this compliance"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Draft
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
                            onClick={() =>
                              setPage((p) => (hasNext ? p + 1 : p))
                            }
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
            </TabsContent>

            {/* Conditional */}
            <TabsContent value="conditional" className="mt-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Conditional Compliance</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      When your model flags conditional items, they will appear
                      here.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <form onSubmit={onSearch}>
                        <Input
                          value={draftUserInput}
                          onChange={(e) => setDraftUserInput(e.target.value)}
                          placeholder="ID or keyword for draft…"
                          className="pl-9 w-56"
                        />
                      </form>
                    </div>
                    <Button
                      onClick={openDraftFromTopButton}
                      title="Generate Draft"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Draft
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Loading…
                    </div>
                  ) : conditionalItems.length === 0 ? (
                    <p className="text-muted-foreground">No items.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conditionalItems.map((c) => (
                          <TableRow key={c.id} className="hover:bg-accent/20">
                            <TableCell className="text-muted-foreground">
                              {c.id}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.due_date
                                ? new Date(c.due_date).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>{statusBadge(c.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.remarks || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => openDraftFromRow(c.id)}
                                title="Generate Draft for this compliance"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Draft
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Draft modal */}
      <Modal
        open={draftOpen}
        title="Generated Draft"
        onClose={() => setDraftOpen(false)}
      >
        {draftLoading ? (
          <div className="flex items-center">
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Generating…
          </div>
        ) : draftText ? (
          <div className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {draftText}
            </pre>
            <div className="flex justify-end">
              <Button onClick={downloadDraft}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No draft content.</p>
        )}
      </Modal>
    </div>
  );
}
