import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Save, Activity, RefreshCw, Copy, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/saas-center")({
  head: () => ({ meta: [{ title: "SaaS Center — TapLink NFC" }] }),
  component: SaasCenterPage,
});

type Settings = {
  id: string;
  enabled: boolean;
  saas_center_url: string | null;
  integration_token: string | null;
  last_sync: string | null;
};

type Metrics = Record<string, unknown> | null;

type SyncLog = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
};

function SaasCenterPage() {
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [testResult, setTestResult] = useState<{ ok: boolean; status: number; body: string } | null>(null);

  const endpointUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/saas-center` : "";
  const officialEndpointUrl = typeof window !== "undefined" ? `${window.location.origin}/api/saas-center` : "";

  useEffect(() => {
    if (!checking && !isAdmin) {
      toast.error("Acesso negado");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAdmin, checking, navigate]);

  async function load() {
    setLoading(true);
    const [s, m, l] = await Promise.all([
      supabase.from("integration_settings").select("*").limit(1).maybeSingle(),
      supabase.from("app_metrics").select("*").limit(1).maybeSingle(),
      supabase.from("saas_center_sync_log").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (s.data) setSettings(s.data as Settings);
    if (m.data) setMetrics(m.data as Metrics);
    if (l.data) setLogs(l.data as SyncLog[]);
    setLoading(false);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("integration_settings")
      .update({
        enabled: settings.enabled,
        saas_center_url: settings.saas_center_url,
        integration_token: settings.integration_token,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Configurações salvas");
  }

  async function testIntegration() {
    if (!settings?.integration_token) {
      toast.error("Informe um token primeiro");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(endpointUrl, {
        headers: { Authorization: `Bearer ${settings.integration_token}` },
      });
      const text = await res.text();
      setTestResult({ ok: res.ok, status: res.status, body: text });
      await supabase.from("saas_center_sync_log").insert({
        status: res.ok ? "success" : "error",
        message: `Teste manual (${res.status})`,
      });
      load();
      if (res.ok) toast.success("Integração funcionando!");
      else toast.error(`Falha (${res.status})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setTestResult({ ok: false, status: 0, body: msg });
      toast.error("Erro ao testar");
    } finally {
      setTesting(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(endpointUrl);
    toast.success("URL copiada");
  }

  if (checking || loading || !settings) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-2xl font-display font-bold mt-2">Integração SaaS Center</h1>
          <p className="text-sm text-muted-foreground">Conecte este SaaS ao painel centralizador de métricas.</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${settings.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
          {settings.enabled ? "Ativa" : "Inativa"}
        </div>
      </div>

      {/* Settings */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Configurações</h2>

        <label className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/40">
          <div>
            <div className="text-sm font-medium">Ativar Integração</div>
            <div className="text-xs text-muted-foreground">Habilita o endpoint público de métricas.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-5 h-5 accent-primary"
          />
        </label>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">URL do SaaS Center</label>
          <input
            type="url"
            placeholder="https://saascenter.exemplo.com"
            value={settings.saas_center_url ?? ""}
            onChange={(e) => setSettings({ ...settings, saas_center_url: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Token de Integração</label>
          <input
            type="text"
            placeholder="Cole um token seguro"
            value={settings.integration_token ?? ""}
            onChange={(e) => setSettings({ ...settings, integration_token: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Última sincronização</div>
            <div className="font-medium">{settings.last_sync ? new Date(settings.last_sync).toLocaleString("pt-BR") : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="font-medium inline-flex items-center gap-1">
              {settings.enabled ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ativa</> : <><XCircle className="w-4 h-4 text-muted-foreground" /> Inativa</>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg btn-primary text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
          <button onClick={testIntegration} disabled={testing} className="px-4 py-2 rounded-lg border border-border text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />} Testar Integração
          </button>
          <button onClick={load} className="px-4 py-2 rounded-lg border border-border text-sm font-medium inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Recarregar
          </button>
        </div>
      </section>

      {/* Endpoint */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Endpoint</h2>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 font-mono text-xs sm:text-sm break-all">
          <span className="flex-1">{endpointUrl}</span>
          <button onClick={copyUrl} className="p-1.5 rounded hover:bg-background"><Copy className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground">Método: <code>GET</code> · Header: <code>Authorization: Bearer &lt;token&gt;</code></p>

        {testResult && (
          <div className={`rounded-lg border p-3 text-xs font-mono whitespace-pre-wrap break-all ${testResult.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
            <div className="mb-1 font-sans font-medium">HTTP {testResult.status}</div>
            {(() => { try { return JSON.stringify(JSON.parse(testResult.body), null, 2); } catch { return testResult.body; } })()}
          </div>
        )}
      </section>

      {/* Official Public Endpoint (SaaS Center Standard) */}
      <OfficialEndpointCard url={officialEndpointUrl} />


      {/* Metrics preview */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Métricas enviadas</h2>
        <pre className="rounded-lg bg-muted/40 p-3 text-xs overflow-auto max-h-72">{JSON.stringify(metrics, null, 2)}</pre>
      </section>

      {/* Sync log */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Histórico de sincronizações</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {l.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-destructive" />}
                  <span>{l.message ?? l.status}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function OfficialEndpointCard({ url }: { url: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; status: number; body: string } | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast.success("Endpoint copiado");
  }

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch(url);
      const text = await res.text();
      let valid = true;
      try { JSON.parse(text); } catch { valid = false; }
      setResult({ ok: res.ok && valid, status: res.status, body: text });
      if (res.ok && valid) toast.success("JSON válido");
      else toast.error("Resposta inválida");
    } catch (e) {
      setResult({ ok: false, status: 0, body: e instanceof Error ? e.message : "Erro" });
      toast.error("Erro ao testar");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-primary/40 bg-card p-6 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-semibold">Endpoint Oficial — Padrão SaaS Center</h2>
          <p className="text-xs text-muted-foreground">Público, sem autenticação. Retorna JSON padronizado.</p>
        </div>
        <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wide bg-primary/15 text-primary font-medium">Oficial</span>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 font-mono text-xs sm:text-sm break-all">
        <span className="flex-1">{url}</span>
        <button onClick={copy} className="p-1.5 rounded hover:bg-background"><Copy className="w-4 h-4" /></button>
      </div>
      <p className="text-xs text-muted-foreground">Método: <code>GET</code> · <code>Content-Type: application/json</code></p>
      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium inline-flex items-center gap-2">
          <Copy className="w-3.5 h-3.5" /> Copiar Endpoint
        </button>
        <button onClick={test} disabled={testing} className="px-3 py-1.5 rounded-lg btn-primary text-xs font-medium inline-flex items-center gap-2 disabled:opacity-50">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />} Testar Endpoint
        </button>
      </div>
      {result && (
        <div className={`rounded-lg border p-3 text-xs font-mono whitespace-pre-wrap break-all ${result.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
          <div className="mb-1 font-sans font-medium">HTTP {result.status}</div>
          {(() => { try { return JSON.stringify(JSON.parse(result.body), null, 2); } catch { return result.body; } })()}
        </div>
      )}
    </section>
  );
}

