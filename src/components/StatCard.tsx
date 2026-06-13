import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "info" | "accent" | "warning";
}) {
  const toneClass = {
    primary: "gradient-brand text-primary-foreground",
    info: "bg-[color:var(--info)] text-[color:var(--info-foreground)]",
    accent: "gradient-emerald text-primary-foreground",
    warning: "bg-[color:var(--warning)] text-[color:var(--warning-foreground)]",
  }[tone];

  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="h-6 w-6" />
        </span>
      </CardContent>
    </Card>
  );
}
