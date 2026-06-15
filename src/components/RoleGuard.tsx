import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";

export function RoleGuard({ role, children }: { role: AppRole | AppRole[]; children: ReactNode }) {
  const { role: current, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  const allowed = Array.isArray(role) ? role : [role];
  if (!current || !allowed.includes(current)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}
