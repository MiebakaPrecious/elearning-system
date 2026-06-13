import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function StubPage({ title, description }: { title: string; description?: string }) {
  return (
    <DashboardShell title={title}>
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-xl gradient-emerald text-primary-foreground"><Construction className="h-7 w-7" /></span>
          <p className="text-lg font-semibold">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{description ?? "This module is part of the next phase. The database tables and access rules are already in place — the UI is on the way."}</p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
