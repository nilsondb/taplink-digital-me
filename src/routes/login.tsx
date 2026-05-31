import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — TapLink NFC" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard", replace: true }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard", replace: true });
  }

  return <AuthShell title="Entre na sua conta" subtitle="Acesse seu dashboard TapLink NFC">
    <form onSubmit={submit} className="space-y-3">
      <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" />
      <AuthField label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      <div className="text-right">
        <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Esqueci minha senha</Link>
      </div>
      <button disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Ainda não tem conta? <Link to="/signup" className="text-foreground font-medium hover:underline">Criar conta</Link>
    </p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-10 grid place-items-center">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl btn-primary grid place-items-center"><Sparkles className="w-5 h-5" /></div>
          <span className="font-display font-bold text-xl">TapLink<span className="gradient-text">NFC</span></span>
        </Link>
        <div className="glass rounded-3xl p-7">
          <h1 className="font-display font-bold text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1.5 mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({ label, type = "text", value, onChange, placeholder }:
  { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required
        className="w-full rounded-xl bg-input/50 border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </label>
  );
}
