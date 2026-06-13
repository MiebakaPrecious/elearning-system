import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, ListChecks, CheckSquare } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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
      const [{ count: assigns }, { count: subs }] = await Promise.all([
        supabase.from("assignments").select("*", { count: "exact", head: true }).in("course_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("student_id", user!.id),
      ]);
      return { enrolls: enrolls ?? [], assigns: assigns ?? 0, pending: Math.max((assigns ?? 0) - (subs ?? 0), 0) };
    },
  });

  return (
    <DashboardShell title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={data?.enrolls.length ?? "—"} icon={BookOpen} tone="primary" />
        <StatCard label="Assignments" value={data?.assigns ?? "—"} icon={ClipboardList} tone="info" />
        <StatCard label="Pending" value={data?.pending ?? "—"} icon={ListChecks} tone="warning" />
        <StatCard label="Attendance" value="—" icon={CheckSquare} tone="accent" />
      </div>
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
    </DashboardShell>
  );
}
