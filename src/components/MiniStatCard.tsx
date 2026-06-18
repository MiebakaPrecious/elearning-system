import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function MiniStatCard({
  label, value, delta, deltaTone = "up", icon: Icon, accent = "primary",
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "down" | "muted";
  icon: LucideIcon;
  accent?: "primary" | "info" | "accent" | "warning" | "destructive" | "success";
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    info: "bg-[color:var(--info)]/10 text-[color:var(--info)]",
    accent: "bg-accent/15 text-accent-foreground",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
  };
  const deltaClass = deltaTone === "up" ? "text-emerald-600" : deltaTone === "down" ? "text-red-600" : "text-muted-foreground";
  const DeltaIcon = deltaTone === "down" ? TrendingDown : TrendingUp;
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {delta && (
              <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${deltaClass}`}>
                {deltaTone !== "muted" && <DeltaIcon className="h-3 w-3" />} {delta}
              </p>
            )}
          </div>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accentMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
