import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — TapLink NFC" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/dashboard", replace: true }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Senha deve ter ao menos 6 caracteres"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) {
      toast.success("Conta criada!");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.success("Confirme seu email para entrar.");
    }
  }

  return <AuthShell title="Crie sua conta" subtitle="Comece grátis em segundos">
    <form onSubmit={submit} className="space-y-3">
      <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" />
      <AuthField label="Senha" type="password" value={password} onChange={setPassword} placeholder="mínimo 6 caracteres" />
      <button disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta"}
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Já tem conta? <Link to="/login" className="text-foreground font-medium hover:underline">Entrar</Link>
    </p>
  </AuthShell>;
}
