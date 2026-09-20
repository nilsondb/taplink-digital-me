import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Eye, FileText, LinkIcon, Loader2, Power, Search, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import type { AdminStats, AdminUser } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Administração — Authera Link Card" }] }),
  component: AdminPage,
});

const PAGE_SIZE = 10;

type AdminPayload = { users: AdminUser[]; stats: AdminStats };

function AdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      setData(await apiFetch<AdminPayload>("/api/admin"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar administração");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function action(actionName: "set-role" | "set-status" | "delete", user: AdminUser, value?: unknown) {
    if (actionName === "delete" && !window.confirm(`Excluir definitivamente ${user.email}?`)) return;
    try {
      const next = await apiFetch<AdminPayload>("/api/admin", {
        method: "POST",
        body: JSON.stringify({ action: actionName, user_id: user.user_id, value }),
      });
      setData(next);
      toast.success("Alteração concluída");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a ação");
    }
  }

  const users = data?.users || [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      (u.name || "").toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.slug || "").toLowerCase().includes(term)
    );
  }, [users, q]);

  useEffect(() => { setPage(1); }, [q]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const header = ["email", "name", "slug", "status", "is_admin", "views", "clicks", "created_at"];
    const rows = users.map((u) => [u.email, u.name ?? "", u.slug ?? "", u.user_status, u.is_admin ? "yes" : "no", u.views_count, u.clicks_count, u.created_at]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `authera-link-card-users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  const stats = data.stats;
  const maxGrowth = Math.max(1, ...stats.growth.map((g) => g.count));

  return (
    <main className="px-6 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl">Administração</h1>
          <p className="text-sm text-muted-foreground">Gestão local do Authera Link Card</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/saas-center" className="glass rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/5">
            <ExternalLink className="w-4 h-4" /> SaaS Center
          </Link>
          <button onClick={exportCsv} className="glass rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/5">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Metric icon={Users} label="Usuários" value={stats.total_users} accent />
        <Metric icon={FileText} label="Perfis" value={stats.total_profiles} />
        <Metric icon={Eye} label="Visualizações" value={stats.total_views} />
        <Metric icon={LinkIcon} label="Cliques" value={stats.total_clicks} />
        <Metric icon={UserPlus} label="Hoje" value={stats.users_today} />
      </div>

      <section className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Crescimento (30 dias)</h2>
          <span className="text-xs text-muted-foreground">{stats.growth.reduce((a, g) => a + g.count, 0)} novos</span>
        </div>
        <div className="flex items-end gap-1 h-32">
          {stats.growth.map((g) => (
            <div key={g.day} className="flex-1 group relative h-full flex items-end">
              <div className="w-full bg-primary/60 rounded-t-md transition-all hover:bg-primary"
                style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count > 0 ? 4 : 0 }} />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                {g.day}: {g.count}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-lg">Usuários ({filtered.length})</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou slug"
              className="pl-9 pr-3 py-2 rounded-xl bg-input/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 w-72 max-w-full" />
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 font-medium">Usuário</th>
                <th className="px-2 py-2 font-medium">Slug</th>
                <th className="px-2 py-2 font-medium">Cadastro</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((u) => (
                <tr key={u.user_id} className="border-t border-border/60 hover:bg-white/[0.02]">
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                        {u.photo_url ? <img src={u.photo_url} className="w-full h-full object-cover" alt="" /> :
                          <div className="w-full h-full grid place-items-center text-xs text-muted-foreground">{(u.name || u.email).slice(0, 1).toUpperCase()}</div>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-1.5">
                          {u.name || <span className="text-muted-foreground">Sem perfil</span>}
                          {u.is_admin && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">Admin</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs">
                    {u.slug ? <a href={`/${u.slug}`} target="_blank" rel="noreferrer" className="hover:text-primary">/{u.slug}</a> : "—"}
                  </td>
                  <td className="px-2 py-3 text-xs text-muted-foreground">{new Date(`${u.created_at}Z`).toLocaleDateString("pt-BR")}</td>
                  <td className="px-2 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${u.user_status === "inactive" ? "bg-destructive/20 text-destructive" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {u.user_status === "inactive" ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button title={u.is_admin ? "Remover admin" : "Tornar admin"} onClick={() => action("set-role", u, u.is_admin ? "user" : "admin")} className="w-9 h-9 rounded-lg grid place-items-center hover:bg-white/5">
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button title={u.user_status === "active" ? "Desativar" : "Ativar"} onClick={() => action("set-status", u, u.user_status === "active" ? "inactive" : "active")} className="w-9 h-9 rounded-lg grid place-items-center hover:bg-white/5">
                        <Power className="w-4 h-4" />
                      </button>
                      <button title="Excluir" onClick={() => action("delete", u)} className="w-9 h-9 rounded-lg grid place-items-center hover:bg-destructive/20 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="glass px-3 py-2 rounded-lg disabled:opacity-40">Anterior</button>
            <span className="text-muted-foreground">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="glass px-3 py-2 rounded-lg disabled:opacity-40">Próxima</button>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center mb-3 ${accent ? "btn-primary" : "bg-white/5"}`}><Icon className="w-4 h-4" /></div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-2xl">{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}
