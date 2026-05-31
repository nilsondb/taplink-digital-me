import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — TapLink NFC" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard", replace: true });
  }

  return <AuthShell title="Defina uma nova senha">
    <form onSubmit={submit} className="space-y-3">
      <AuthField label="Nova senha" type="password" value={password} onChange={setPassword} placeholder="mínimo 6 caracteres" />
      <button disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl font-semibold inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar senha"}
      </button>
    </form>
  </AuthShell>;
}
