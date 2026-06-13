import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, ClipboardList, ListChecks } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/lecturer/")({
  component: LecturerDashboard,
});

function LecturerDashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["lecturer-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: courses } = await supabase.from("courses").select("id,title,code,status").eq("lecturer_id", user!.id);
      const ids = (courses ?? []).map((c) => c.id);
      const [{ count: students }, { count: assignments }, { count: quizzes }] = await Promise.all([
        supabase.from("enrollments").select("*", { count: "exact", head: true }).in("course_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("assignments").select("*", { count: "exact", head: true }).in("course_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("quizzes").select("*", { count: "exact", head: true }).in("course_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      return { courses: courses ?? [], students: students ?? 0, assignments: assignments ?? 0, quizzes: quizzes ?? 0 };
    },
  });

  return (
    <DashboardShell title="Lecturer Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Courses" value={data?.courses.length ?? "—"} icon={BookOpen} tone="primary" />
        <StatCard label="Students" value={data?.students ?? "—"} icon={Users} tone="info" />
        <StatCard label="Assignments" value={data?.assignments ?? "—"} icon={ClipboardList} tone="accent" />
        <StatCard label="Quizzes" value={data?.quizzes ?? "—"} icon={ListChecks} tone="warning" />
      </div>
      <Card className="mt-6 shadow-card">
        <CardContent className="p-5">
          <p className="mb-3 font-semibold">My courses</p>
          {data?.courses.length ? (
            <div className="space-y-2">
              {data.courses.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div><p className="font-medium">{c.code} — {c.title}</p></div>
                  <Badge variant="outline" className="capitalize">{c.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No courses assigned yet. The admin will assign you courses to develop.</p>}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
