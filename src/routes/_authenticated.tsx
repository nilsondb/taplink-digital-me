import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CreditCard, Loader2, LogOut, LayoutDashboard, Pencil, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/admin";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, refresh } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  async function logout() {
    try {
      await apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } finally {
      await refresh();
      toast.success("Até breve!");
      navigate({ to: "/", replace: true });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="px-6 py-5 max-w-6xl mx-auto flex items-center justify-between gap-3">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl btn-primary grid place-items-center shrink-0"><CreditCard className="w-5 h-5" /></div>
          <div className="min-w-0">
            <span className="font-display font-bold whitespace-nowrap">Authera <span className="gradient-text">Link Card</span></span>
            <div className="text-[10px] text-muted-foreground hidden md:block">Sua presença digital em um toque</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm hover:bg-white/5 inline-flex items-center gap-2" activeProps={{ className: "px-3 py-2 rounded-lg text-sm bg-white/5 inline-flex items-center gap-2" }}>
            <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link to="/edit" className="px-3 py-2 rounded-lg text-sm hover:bg-white/5 inline-flex items-center gap-2" activeProps={{ className: "px-3 py-2 rounded-lg text-sm bg-white/5 inline-flex items-center gap-2" }}>
            <Pencil className="w-4 h-4" /> <span className="hidden sm:inline">Editar</span>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="px-3 py-2 rounded-lg text-sm hover:bg-white/5 inline-flex items-center gap-2 text-primary" activeProps={{ className: "px-3 py-2 rounded-lg text-sm bg-primary/10 inline-flex items-center gap-2 text-primary" }}>
              <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <button onClick={logout} className="px-3 py-2 rounded-lg text-sm hover:bg-destructive/20 hover:text-destructive inline-flex items-center gap-2">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
