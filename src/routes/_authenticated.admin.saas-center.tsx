import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Copy, KeyRound, Loader2, RefreshCw, Save } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/saas-center")({
  head: () => ({ meta: [{ title: "SaaS Center — Authera Link Card" }] }),
  component: SaasCenterPage,
});

type Settings = {
  id: string;
  enabled: boolean;
  saas_center_url: string | null;
  integration_token: string | null;
  last_sync: string | null;
};

type Payload = {
  settings: Settings;
  metrics: Record<string, unknown>;
  logs: Array<{ id: string; status: string; message: string | null; created_at: string }>;
};

function SaasCenterPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const endpointUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/saas-center` : "";
  const publicMetricsUrl = typeof window !== "undefined" ? `${window.location.origin}/api/saas-center` : "";

  async function load() {
    try {
      setData(await apiFetch<Payload>("/api/admin/saas-settings"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar integração");
    }
  }

  useEffect(() => { void load(); }, []);

  function patchSettings(patch: Partial<Settings>) {
    setData((prev) => prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev);
  }

  function generateToken() {
    const token = `ALC_${crypto.randomUUID().replaceAll("-", "")}_${crypto.randomUUID().replaceAll("-", "")}`;
    patchSettings({ integration_token: token });
    toast.success("Novo token gerado. Salve para ativá-lo.");
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const next = await apiFetch<Payload>("/api/admin/saas-settings", {
        method: "PUT",
        body: JSON.stringify({
          enabled: data.settings.enabled,
          saas_center_url: data.settings.saas_center_url,
          integration_token: data.settings.integration_token,
        }),
      });
      setData(next);
      toast.success("Configurações salvas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function testIntegration() {
    if (!data?.settings.integration_token) return toast.error("Gere e salve um token primeiro");
    setTesting(true);
    try {
      const res = await fetch(endpointUrl, {
        headers: { Authorization: `Bearer ${data.settings.integration_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Integração funcionando");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no teste");
    } finally {
      setTesting(false);
    }
  }

  if (!data) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-display font-bold mt-2">Integração SaaS Center</h1>
        <p className="text-sm text-muted-foreground">Métricas do Authera Link Card vindas diretamente do SQLite local.</p>
      </div>

      <section className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Configurações</h2>
            <p className="text-xs text-muted-foreground">O endpoint autenticado só funciona quando esta integração estiver ativa.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <span>{data.settings.enabled ? "Ativa" : "Inativa"}</span>
            <input type="checkbox" checked={data.settings.enabled} onChange={(e) => patchSettings({ enabled: e.target.checked })} className="w-5 h-5 accent-primary" />
          </label>
        </div>

        <label className="block">
          <div className="text-xs text-muted-foreground mb-1.5">URL do SaaS Center</div>
          <input type="url" value={data.settings.saas_center_url || ""} onChange={(e) => patchSettings({ saas_center_url: e.target.value })}
            placeholder="https://seu-saas-center..." className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none" />
        </label>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs text-muted-foreground">Token de integração</div>
            <button onClick={generateToken} className="text-xs text-primary inline-flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Gerar token seguro</button>
          </div>
          <input value={data.settings.integration_token || ""} onChange={(e) => patchSettings({ integration_token: e.target.value })}
            placeholder="mínimo 24 caracteres" className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm font-mono outline-none" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={saving} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
          <button onClick={testIntegration} disabled={testing} className="glass px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />} Testar
          </button>
          <button onClick={load} className="glass px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Recarregar</button>
        </div>
      </section>

      <section className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold">Endpoints</h2>
        <Endpoint label="Autenticado" url={endpointUrl} />
        <Endpoint label="Métricas públicas" url={publicMetricsUrl} />
        <div className="text-xs text-muted-foreground">Última sincronização: {data.settings.last_sync ? new Date(`${data.settings.last_sync}Z`).toLocaleString("pt-BR") : "—"}</div>
      </section>

      <section className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold">Métricas locais</h2>
        <pre className="rounded-xl bg-black/20 p-4 text-xs overflow-auto max-h-80">{JSON.stringify(data.metrics, null, 2)}</pre>
      </section>

      <section className="glass rounded-3xl p-6 space-y-3">
        <h2 className="font-semibold">Histórico</h2>
        {data.logs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma sincronização ainda.</p> : (
          <div className="divide-y divide-border">
            {data.logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                <span>{log.message || log.status}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(`${log.created_at}Z`).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Endpoint({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5">
        <code className="text-xs flex-1 break-all">{url}</code>
        <button onClick={() => { navigator.clipboard.writeText(url); toast.success("URL copiada"); }} className="shrink-0 p-2"><Copy className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
