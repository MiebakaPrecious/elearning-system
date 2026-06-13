import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dispatcher,
});

function Dispatcher() {
  const { role, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (role === "admin") return <Navigate to="/admin" />;
  if (role === "lecturer") return <Navigate to="/lecturer" />;
  return <Navigate to="/student" />;
}
