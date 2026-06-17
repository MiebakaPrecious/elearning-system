import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, ListChecks, CheckSquare, Calendar, Megaphone, Sparkles, CalendarClock } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RecommendationsCard } from "@/components/RecommendationsCard";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user, profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["stu-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enrolls } = await supabase.from("enrollments").select("course_id, courses(id,title,code,level)").eq("student_id", user!.id);
      const ids = (enrolls ?? []).map((e: any) => e.course_id);
      const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
      const [assigns, subs, events, anns] = await Promise.all([
        supabase.from("assignments").select("*", { count: "exact", head: true }).in("course_id", safeIds),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("student_id", user!.id),
        supabase.from("events").select("id,title,starts_at,location").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
        supabase.from("announcements").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(4),
      ]);
      const aCount = assigns.count ?? 0;
      const sCount = subs.count ?? 0;
      return {
        enrolls: enrolls ?? [],
        assigns: aCount,
        submitted: sCount,
        pending: Math.max(aCount - sCount, 0),
        completion: aCount ? Math.round((sCount / aCount) * 100) : 0,
        events: events.data ?? [],
        announcements: anns.data ?? [],
      };
    },
  });

  return (
    <DashboardShell title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Link to="/student/assistant" className="group flex items-center justify-between rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-4 transition hover-lift">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold">AI Learning Assistant</p>
              <p className="text-xs text-muted-foreground">Course-aware tutor · quizzes · flashcards</p>
            </div>
          </div>
          <Badge variant="secondary">New</Badge>
        </Link>
        <Link to="/student/planner" className="group flex items-center justify-between rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-card to-card p-4 transition hover-lift">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><CalendarClock className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold">Smart Study Planner</p>
              <p className="text-xs text-muted-foreground">AI-generated weekly schedule</p>
            </div>
          </div>
          <Badge variant="secondary">New</Badge>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={data?.enrolls.length ?? "—"} icon={BookOpen} tone="primary" />
        <StatCard label="Assignments" value={data?.assigns ?? "—"} icon={ClipboardList} tone="info" />
        <StatCard label="Pending" value={data?.pending ?? "—"} icon={ListChecks} tone="warning" />
        <StatCard label="Completion" value={`${data?.completion ?? 0}%`} icon={CheckSquare} tone="accent" />
      </div>
      <div className="mt-6"><RecommendationsCard /></div>
      <Card className="mt-6 shadow-card">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">My courses</p>
            <Button asChild size="sm" variant="outline"><Link to="/student/courses">Browse catalog</Link></Button>
          </div>
          {data?.enrolls.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.enrolls.map((e: any) => (
                <div key={e.course_id} className="rounded-lg border border-border p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="outline">{e.courses?.code}</Badge>
                    <Badge variant="secondary">{e.courses?.level}</Badge>
                  </div>
                  <p className="font-medium">{e.courses?.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You're not enrolled in any courses yet. <Link to="/student/courses" className="text-primary underline">Browse the catalog</Link>.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-3 flex items-center gap-2 font-semibold"><Calendar className="h-4 w-4 text-primary" /> Upcoming events</p>
            {data?.events.length ? (
              <ul className="space-y-3">
                {data.events.map((e) => (
                  <li key={e.id} className="border-l-2 border-primary pl-3">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString()} · {e.location ?? "TBA"}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-3 flex items-center gap-2 font-semibold"><Megaphone className="h-4 w-4 text-primary" /> Announcements</p>
            {data?.announcements.length ? (
              <ul className="space-y-3">
                {data.announcements.map((a) => (
                  <li key={a.id}>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No announcements.</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
