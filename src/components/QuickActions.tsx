import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type QuickAction = { to: string; label: string; icon: LucideIcon; tone: string };

export function QuickActions({ actions, title = "Quick actions" }: { actions: QuickAction[]; title?: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <p className="mb-4 font-semibold">{title}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-card"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${a.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium leading-tight">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
