import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — TapLink NFC" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Enviamos o link de recuperação.");
  }

  return <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para resetar sua senha">
    {sent ? (
      <div className="text-center text-sm text-muted-foreground">
        Confira seu email <span className="text-foreground font-medium">{email}</span> e clique no link.
      </div>
    ) : (
      <form onSubmit={submit} className="space-y-3">
        <AuthField label="Email" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" />
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
