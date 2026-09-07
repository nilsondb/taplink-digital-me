import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — Authera Link Card" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("Link de recuperação inválido"); return; }
    if (password.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres"); return; }
    setLoading(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      toast.success("Senha atualizada. Entre novamente.");
      navigate({ to: "/login", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <AuthShell title="Link inválido" subtitle="Solicite uma nova recuperação de senha.">
      <Link to="/forgot-password" className="btn-primary block text-center py-3 rounded-2xl font-semibold">Solicitar novo link</Link>
    </AuthShell>;
  }

  return <AuthShell title="Defina uma nova senha">
    <form onSubmit={submit} className="space-y-3">
      <AuthField label="Nova senha" type="password" value={password} onChange={setPassword} placeholder="mínimo 8 caracteres" />
      <button disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar senha"}
      </button>
    </form>
  </AuthShell>;
}
