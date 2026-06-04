import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Users, Eye, LinkIcon, FileText, UserPlus, Search, Trash2, ShieldCheck, ShieldOff, Power, KeyRound, Download, ExternalLink, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, type AdminUser, type AdminStats } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Administração — TapLink NFC" }] }),
  component: AdminPage,
});

const PAGE_SIZE = 10;

function AdminPage() {
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (checking) return;
    if (!isAdmin) {
      toast.error("Acesso negado");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAdmin, checking, navigate]);

  async function reload() {
    setLoading(true);
    const [s, u] = await Promise.all([
      supabase.rpc("admin_stats"),
      supabase.rpc("admin_list_users"),
    ]);
    if (s.data) setStats(s.data as unknown as AdminStats);
    if (u.data) setUsers(u.data as unknown as AdminUser[]);
    if (s.error || u.error) toast.error("Erro ao carregar dados");
    setLoading(false);
  }

  useEffect(() => { if (isAdmin) reload(); }, [isAdmin]);

  // Realtime user counter
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel("admin-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.slug || "").toLowerCase().includes(term)
    );
  }, [users, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [q]);

  function exportCsv() {
    const header = ["email", "name", "slug", "status", "is_admin", "views", "clicks", "created_at"];
    const rows = users.map((u) => [u.email, u.name ?? "", u.slug ?? "", u.status ?? "", u.is_admin ? "yes" : "no", u.views_count, u.clicks_count, u.created_at]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `taplinknfc-users-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleAdmin(u: AdminUser) {
    const { error } = await supabase.rpc("admin_set_role", { _user_id: u.user_id, _role: "admin", _grant: !u.is_admin });
    if (error) return toast.error(error.message);
    toast.success(u.is_admin ? "Permissão removida" : "Promovido a admin");
    reload();
  }

  async function toggleStatus(u: AdminUser) {
    if (!u.profile_id) return toast.error("Usuário ainda não criou perfil");
    const next = u.status === "active" ? "inactive" : "active";
    const { error } = await supabase.rpc("admin_set_status", { _user_id: u.user_id, _status: next });
    if (error) return toast.error(error.message);
    toast.success(next === "active" ? "Usuário ativado" : "Usuário desativado");
    reload();
  }

  async function resetPassword(u: AdminUser) {
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("E-mail de recuperação enviado");
  }

  async function deleteUser(u: AdminUser) {
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: u.user_id });
    if (error) return toast.error(error.message);
    toast.success("Usuário excluído");
    setConfirmDelete(null);
    reload();
  }

  if (checking || (loading && !stats)) {
    return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) return null;

  const maxGrowth = Math.max(1, ...(stats?.growth.map((g) => g.count) ?? [0]));

  return (
    <main className="px-6 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl">Administração</h1>
          <p className="text-sm text-muted-foreground">Gestão completa da plataforma TapLink NFC</p>
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
        <Metric icon={Users} label="Usuários" value={stats?.total_users ?? 0} accent />
        <Metric icon={FileText} label="Perfis" value={stats?.total_profiles ?? 0} />
        <Metric icon={Eye} label="Visualizações" value={stats?.total_views ?? 0} />
        <Metric icon={LinkIcon} label="Links" value={stats?.total_links ?? 0} />
        <Metric icon={UserPlus} label="Hoje" value={stats?.users_today ?? 0} />
      </div>

      <section className="glass rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Crescimento (30 dias)</h2>
          <span className="text-xs text-muted-foreground">{stats?.growth.reduce((a, g) => a + g.count, 0) ?? 0} novos</span>
        </div>
        <div className="flex items-end gap-1 h-32">
          {(stats?.growth ?? []).map((g) => (
            <div key={g.day} className="flex-1 group relative">
              <div className="bg-gradient-to-t from-primary/40 to-primary rounded-t-md transition-all hover:opacity-80"
                style={{ height: `${(g.count / maxGrowth) * 100}%`, minHeight: g.count > 0 ? 4 : 0 }} />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                {g.day}: {g.count}
              </div>
            </div>
          ))}
          {(!stats?.growth || stats.growth.length === 0) && <div className="text-sm text-muted-foreground m-auto">Sem cadastros recentes</div>}
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
          <table className="w-full text-sm min-w-[720px]">
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
                    {u.slug ? (
                      <Link to="/$slug" params={{ slug: u.slug }} className="hover:text-primary inline-flex items-center gap-1">
                        /{u.slug} <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-2 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-2 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${u.status === "inactive" ? "bg-destructive/20 text-destructive" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {u.status === "inactive" ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="Editar" onClick={() => setEditing(u)}><Save className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title={u.status === "active" ? "Desativar" : "Ativar"} onClick={() => toggleStatus(u)}><Power className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title={u.is_admin ? "Remover admin" : "Tornar admin"} onClick={() => toggleAdmin(u)}>
                        {u.is_admin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      </IconBtn>
                      <IconBtn title="Resetar senha" onClick={() => resetPassword(u)}><KeyRound className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title="Excluir" danger onClick={() => setConfirmDelete(u)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {pageUsers.length === 0 && (
                <tr><td colSpan={5} className="text-center text-sm text-muted-foreground py-10">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-muted-foreground">Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg glass disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg glass disabled:opacity-40">Próxima</button>
            </div>
          </div>
        )}
      </section>

      {editing && <EditModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <h3 className="font-display font-bold text-xl">Excluir usuário</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Tem certeza que deseja excluir <span className="text-foreground font-medium">{confirmDelete.email}</span>?
            Esta ação removerá o usuário, o perfil e todas as estatísticas relacionadas. Não pode ser desfeita.
          </p>
          <div className="flex gap-2 justify-end mt-6">
            <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl glass text-sm">Cancelar</button>
            <button onClick={() => deleteUser(confirmDelete)} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold">Excluir definitivamente</button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Metric({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center mb-3 ${accent ? "btn-primary" : "bg-white/5"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-2xl mt-0.5">{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 rounded-lg grid place-items-center transition ${danger ? "hover:bg-destructive/20 hover:text-destructive" : "hover:bg-white/5"}`}>
      {children}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur p-4" onClick={onClose}>
      <div className="glass rounded-3xl p-6 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-white/5 grid place-items-center">
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function EditModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name ?? "");
  const [slug, setSlug] = useState(user.slug ?? "");
  const [status, setStatus] = useState(user.status ?? "active");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user.profile_id) { toast.error("Usuário ainda não criou perfil"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim(), slug: slug.trim(), status,
    }).eq("id", user.profile_id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Usuário atualizado");
    onSaved();
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-xl">Editar usuário</h3>
      <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
      <div className="space-y-3 mt-5">
        <ModalField label="Nome" value={name} onChange={setName} />
        <ModalField label="Slug" value={slug} onChange={setSlug} />
        <label className="block">
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Status</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none">
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>
        <p className="text-[11px] text-muted-foreground">Para edição completa (foto, bio, links, redes sociais, tema), peça que o usuário utilize a área de edição.</p>
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <button onClick={onClose} className="px-4 py-2 rounded-xl glass text-sm">Cancelar</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl btn-primary text-sm font-semibold disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}

function ModalField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}
