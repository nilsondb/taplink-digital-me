import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import type { LocalUser } from "@/lib/local-types";
import { toast } from "sonner";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — Authera Link Card" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard", replace: true }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres"); return; }
    setLoading(true);
    try {
      await apiFetch<{ user: LocalUser }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      toast.success("Conta criada!");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Crie sua conta" subtitle="Sua presença digital começa aqui">
    <form onSubmit={submit} className="space-y-3">
      <AuthField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" />
      <AuthField label="Senha" type="password" value={password} onChange={setPassword} placeholder="mínimo 8 caracteres" />
      <button disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Já tem conta? <Link to="/login" className="text-foreground font-medium hover:underline">Entrar</Link>
    </p>
  </AuthShell>;
}
