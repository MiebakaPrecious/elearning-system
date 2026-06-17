import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Loader2, Sparkles, Target, Flame, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/planner")({
  component: PlannerPage,
});

function PlannerPage() {
  const [courses, setCourses] = useState("Database Systems, Software Engineering, Networking");
  const [exams, setExams] = useState("Database Systems — 2026-07-10\nSoftware Engineering — 2026-07-15");
  const [deadlines, setDeadlines] = useState("Networking Assignment — 2026-06-25");
  const [hours, setHours] = useState(12);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(null); setPlan(null);
    const sys = "You are a study planner for a Computer Science student. Produce a clear, realistic weekly study plan in markdown with: 1) Priority assessment (High/Medium/Low) of items, 2) A 7-day schedule (Mon-Sun) splitting the weekly hours across topics, 3) A revision plan for exams, 4) Concrete next 24h actions. Be specific and time-boxed.";
    const user = `Courses: ${courses}\n\nExam dates:\n${exams}\n\nAssignment deadlines:\n${deadlines}\n\nWeekly study hours available: ${hours}\n\nToday's date: ${new Date().toDateString()}`;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ system: sys, messages: [{ role: "user", content: user }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setPlan(json.content);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <DashboardShell title="Smart Study Planner">
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Inputs</p>
            <div className="space-y-1.5">
              <Label>Courses</Label>
              <Input value={courses} onChange={(e) => setCourses(e.target.value)} placeholder="Comma-separated courses" />
            </div>
            <div className="space-y-1.5">
              <Label>Exam dates</Label>
              <Textarea value={exams} onChange={(e) => setExams(e.target.value)} rows={3} placeholder="Course — YYYY-MM-DD" />
            </div>
            <div className="space-y-1.5">
              <Label>Assignment deadlines</Label>
              <Textarea value={deadlines} onChange={(e) => setDeadlines(e.target.value)} rows={3} placeholder="Title — YYYY-MM-DD" />
            </div>
            <div className="space-y-1.5">
              <Label>Weekly study hours</Label>
              <Input type="number" min={1} max={60} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </div>
            <Button onClick={generate} disabled={loading} className="w-full gradient-brand">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate plan
            </Button>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Pill icon={Flame} tone="text-red-500" label="High" />
              <Pill icon={CalendarClock} tone="text-amber-500" label="Medium" />
              <Pill icon={CheckCircle2} tone="text-emerald-500" label="Low" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Your personalised plan</p>
            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {!plan && !loading && !error && (
              <div className="grid place-items-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <Sparkles className="h-8 w-8 text-primary/60" />
                Configure your inputs and tap <Badge variant="secondary">Generate plan</Badge> to receive a tailored weekly schedule.
              </div>
            )}
            {loading && <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {plan && (
              <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">{plan}</article>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Pill({ icon: Icon, tone, label }: { icon: any; tone: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border p-2 text-xs">
      <Icon className={`h-3.5 w-3.5 ${tone}`} /> {label}
    </div>
  );
}
