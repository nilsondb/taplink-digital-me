import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — Authera Link Card" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch<{ ok: boolean; message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast.success("Solicitação processada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recuperar a senha");
    } finally {
      setLoading(false);
    }
  }

  return <AuthShell title="Recuperar senha" subtitle="Enviaremos um link seguro para seu e-mail">
    {sent ? (
      <div className="text-center text-sm text-muted-foreground">
        Se <span className="text-foreground font-medium">{email}</span> estiver cadastrado, você receberá as instruções.
      </div>
    ) : (
      <form onSubmit={submit} className="space-y-3">
        <AuthField label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" />
        <button disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link"}
        </button>
      </form>
    )}
    <p className="mt-6 text-center text-sm text-muted-foreground">
      <Link to="/login" className="hover:text-foreground">← Voltar ao login</Link>
    </p>
  </AuthShell>;
}
