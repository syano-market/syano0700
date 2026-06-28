import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Ticket, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  XCircle, Filter, ChevronDown, Mail, Trash2, ChevronRight,
} from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SupportTicket {
  id: number;
  status: "open" | "pending" | "resolved" | "closed";
  category: string;
  priority: "normal" | "high" | "urgent";
  subject: string | null;
  conversation_id: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_name: string;
  user_email: string;
  assigned_admin_name: string | null;
}

interface Stats {
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  total: number;
  urgent: number;
  unassigned: number;
}

interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  source_ip: string;
  created_at: string;
}

// ─── Small shared components ─────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    urgent: { label: "Urgent", cls: "bg-red-500/10 text-red-600 border-red-200" },
    high:   { label: "High",   cls: "bg-orange-500/10 text-orange-600 border-orange-200" },
    normal: { label: "Normal", cls: "bg-muted text-muted-foreground border-border" },
  };
  const c = config[priority] ?? config["normal"]!;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${c.cls}`}>{c.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    open:     { label: "Open",     cls: "bg-blue-500/10 text-blue-600 border-blue-200" },
    pending:  { label: "Pending",  cls: "bg-amber-500/10 text-amber-600 border-amber-200" },
    resolved: { label: "Resolved", cls: "bg-primary/10 text-primary border-primary/20" },
    closed:   { label: "Closed",   cls: "bg-muted text-muted-foreground border-border" },
  };
  const c = config[status] ?? config["open"]!;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${c.cls}`}>{c.label}</span>;
}

// ─── Contact Submissions Tab ─────────────────────────────────────────────────

function ContactSubmissionsTab({ token }: { token: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [items, setItems]       = useState<ContactSubmission[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/contact-submissions?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("fetch failed");
      const data = (await r.json()) as { submissions: ContactSubmission[]; total: number };
      setItems(data.submissions);
      setTotal(data.total);
    } catch {
      toast({ title: "Failed to load contact messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { void fetchSubmissions(); }, [fetchSubmissions]);

  const deleteSubmission = async (id: number) => {
    setDeleting(id);
    try {
      const r = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("delete failed");
      toast({ title: t("support.contact_deleted") });
      setItems((prev) => prev.filter((x) => x.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      toast({ title: t("support.contact_delete_fail"), variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? t("support.contact_total", { count: total }) : t("support.contact_total_plural", { count: total })}
        </span>
        <Button variant="outline" size="sm" onClick={fetchSubmissions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 me-2 ${loading ? "animate-spin" : ""}`} />
          {t("support.refresh")}
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{t("support.contact_empty")}</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => {
              const isOpen = expanded === item.id;
              return (
                <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">#{item.id}</span>
                        <span className="text-sm font-medium text-foreground truncate">{item.subject}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span>{item.email}</span>
                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                        <span className="font-mono opacity-60">{t("support.contact_ip")}: {item.source_ip}</span>
                      </div>

                      {isOpen && (
                        <div className="mt-2 p-3 rounded-lg bg-muted/50 border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {item.message}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setExpanded(isOpen ? null : item.id)}
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        {isOpen ? "Hide" : "Read"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        disabled={deleting === item.id}
                        onClick={() => deleteSubmission(item.id)}
                      >
                        {deleting === item.id ? (
                          <><RefreshCw className="h-3 w-3 me-1 animate-spin" />{t("support.contact_deleting")}</>
                        ) : (
                          <><Trash2 className="h-3 w-3 me-1" />{t("support.contact_delete")}</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"tickets" | "contact">("tickets");

  const [tickets, setTickets]         = useState<SupportTicket[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating]       = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetch(
          statusFilter === "all"
            ? "/api/admin/support/tickets"
            : `/api/admin/support/tickets?status=${statusFilter}`,
          { headers: h },
        ),
        fetch("/api/admin/support/stats", { headers: h }),
      ]);
      const [ticketsData, statsData] = await Promise.all([ticketsRes.json(), statsRes.json()]);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setStats(statsData as Stats);
    } catch {
      toast({ title: "Failed to load support tickets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, toast]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const updateTicket = async (id: number, updates: Record<string, unknown>) => {
    if (!token) return;
    setUpdating(id);
    try {
      const r = await fetch(`/api/admin/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!r.ok) throw new Error("Failed to update ticket");
      toast({ title: "Ticket updated" });
      void fetchAll();
    } catch {
      toast({ title: "Failed to update ticket", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const STATUS_OPTIONS = ["open", "pending", "resolved", "closed"] as const;

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{t("support.admin_title")}</h1>
              <p className="text-sm text-muted-foreground">{t("support.admin_subtitle")}</p>
            </div>
          </div>
          {tab === "tickets" && (
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 me-2 ${loading ? "animate-spin" : ""}`} />
              {t("support.refresh")}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setTab("tickets")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "tickets"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4" />
            {t("support.admin_nav")}
          </button>
          <button
            onClick={() => setTab("contact")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "contact"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            {t("support.contact_tab")}
          </button>
        </div>

        {/* ── Tickets tab ── */}
        {tab === "tickets" && (
          <>
            {/* Stats */}
            {stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label={t("support.stat_open")}     value={stats.open}     icon={AlertTriangle} color="bg-blue-500/10 text-blue-600" />
                <StatCard label={t("support.stat_pending")}  value={stats.pending}  icon={Clock}         color="bg-amber-500/10 text-amber-600" />
                <StatCard label={t("support.stat_resolved")} value={stats.resolved} icon={CheckCircle2}  color="bg-primary/10 text-primary" />
                <StatCard label={t("support.stat_urgent")}   value={stats.urgent}   icon={AlertTriangle} color="bg-red-500/10 text-red-600" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
              </div>
            )}

            {/* Filter + Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
              <div className="p-4 border-b flex items-center gap-3 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", ...STATUS_OPTIONS] as string[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-xs font-medium px-3 py-1 rounded-lg border transition-colors ${
                        statusFilter === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {s === "all" ? t("support.filter_all") : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {stats && (
                  <span className="ms-auto text-xs text-muted-foreground">
                    {tickets.length} {t("support.tickets_shown")}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Ticket className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{t("support.admin_no_tickets")}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">#{ticket.id}</span>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                            <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                              {ticket.category}
                            </span>
                          </div>
                          {ticket.subject && (
                            <p className="text-sm text-foreground font-medium truncate">{ticket.subject}</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{ticket.user_name}</span>
                            <span>{ticket.user_email}</span>
                            <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                            {ticket.assigned_admin_name && (
                              <span className="text-primary">{t("support.assigned_to")}: {ticket.assigned_admin_name}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {ticket.conversation_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => window.open("/admin/messages", "_blank")}
                            >
                              {t("support.view_chat")}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs" disabled={updating === ticket.id}>
                                {t("support.change_status")}
                                <ChevronDown className="h-3 w-3 ms-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {STATUS_OPTIONS.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => updateTicket(ticket.id, { status: s })}
                                  className={ticket.status === s ? "text-primary font-medium" : ""}
                                >
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                  {ticket.status === s && <CheckCircle2 className="h-3.5 w-3.5 ms-auto text-primary" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Contact tab ── */}
        {tab === "contact" && token && (
          <ContactSubmissionsTab token={token} />
        )}
      </div>
    </AdminLayout>
  );
}
