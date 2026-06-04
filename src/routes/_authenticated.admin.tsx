import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useIsAdmin } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, checking } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (checking) return;
    if (!isAdmin) {
      toast.error("Acesso negado");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAdmin, checking, navigate]);

  if (checking) {
    return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) return null;

  return <Outlet />;
}
