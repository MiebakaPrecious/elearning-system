import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, GraduationCap, BookOpenCheck, Flag, Coffee, PenLine } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildAcademicCalendar, currentSessionYear, formatRange, type CalendarItem } from "@/lib/academic-calendar";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: AcademicCalendarPage,
});

const ICONS = {
  orientation: GraduationCap,
  start: BookOpenCheck,
  assessment: PenLine,
  revision: BookOpenCheck,
  exam: Flag,
  break: Coffee,
} as const;

const TONE: Record<CalendarItem["kind"], string> = {
  orientation: "gradient-brand text-primary-foreground",
  start: "bg-primary/10 text-primary",
  assessment: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  revision: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  exam: "gradient-emerald text-white",
  break: "bg-muted text-muted-foreground",
};

function AcademicCalendarPage() {
  const [year, setYear] = useState(() => currentSessionYear());
  const cal = useMemo(() => buildAcademicCalendar(year), [year]);
  const now = Date.now();

  return (
    <DashboardShell title="Academic Calendar">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)} aria-label="Previous session"><ChevronLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-semibold">{cal.label} Session</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)} aria-label="Next session"><ChevronRight className="h-4 w-4" /></Button>
        <p className="text-sm text-muted-foreground">
          Sessions open every November. Continuous assessment closes two weeks before exams; the final two weeks are for revision and topic clarification.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {cal.semesters.map((sem) => (
          <Card key={sem.name} className="shadow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{sem.name}</CardTitle>
              <Badge variant="secondary">
                Exams {sem.examStart.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {sem.items.map((item) => {
                const Icon = ICONS[item.kind];
                const active = now >= item.start.getTime() && now <= (item.end ?? item.start).getTime() + 86_400_000;
                return (
                  <div
                    key={item.key}
                    className={`flex gap-3 rounded-lg border p-3 transition ${active ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONE[item.kind]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        {active && <Badge className="gradient-brand text-primary-foreground">In progress</Badge>}
                      </div>
                      <p className="text-xs font-medium text-primary">{formatRange(item)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
