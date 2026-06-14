import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/student/my-courses")({
  component: MyCourses,
});

type CourseRow = { id: string; code: string; title: string; description: string | null; level: string };

function MyCourses() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("enrollments").select("courses(id,code,title,description,level)").eq("student_id", user!.id);
      return (data ?? []).map((d) => d.courses as unknown as CourseRow).filter(Boolean);
    },
  });

  return (
    <DashboardShell title="My Courses">
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id} className="shadow-card">
              <CardContent className="p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline">{c.code}</Badge>
                  <Badge variant="secondary">{c.level}</Badge>
                </div>
                <p className="mt-2 font-semibold">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description ?? "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">No enrollments yet.</CardContent></Card>}
    </DashboardShell>
  );
}
