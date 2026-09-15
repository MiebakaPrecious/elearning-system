import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { BookOpen, Check, Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/student/courses")({
  component: StudentCoursesBrowse,
});

function StudentCoursesBrowse() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const courses = useQuery({
    queryKey: ["browse-courses", profile?.level],
    enabled: !!profile,
    queryFn: async () => {
      let q = supabase.from("courses").select("*").eq("status", "approved");
      if (profile?.level) q = q.eq("level", profile.level);
      const { data } = await q.order("code");
      return data ?? [];
    },
  });

  const enrollments = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("enrollments").select("course_id").eq("student_id", user!.id)).data ?? [],
  });
  const enrolledSet = new Set(enrollments.data?.map((e) => e.course_id));

  const enroll = useMutation({
    mutationFn: async (course_id: string) => {
      const { error } = await supabase.from("enrollments").insert({ student_id: user!.id, course_id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Enrolled"); qc.invalidateQueries({ queryKey: ["my-enrollments"] }); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  if (!profile?.level) {
    return (
      <DashboardShell title="Browse Courses">
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">
          Set your level (ND1, ND2, HND1 or HND2) in your profile to see eligible courses.
        </CardContent></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Browse Courses">
      <p className="mb-4 text-sm text-muted-foreground">Showing approved CS courses for <Badge variant="secondary">{profile.level}</Badge>.</p>
      {courses.isLoading ? <p className="text-muted-foreground">Loading…</p> : courses.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.data.map((c) => {
            const isEnrolled = enrolledSet.has(c.id);
            return (
              <Card key={c.id} className="shadow-card transition hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg gradient-emerald text-primary-foreground"><BookOpen className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{c.code}</Badge>
                        <Badge variant="secondary">{c.level}</Badge>
                      </div>
                      <p className="mt-2 font-semibold">{c.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description ?? "No description"}</p>
                      <div className="mt-3">
                        {isEnrolled ? (
                          <Badge className="gradient-emerald text-white"><Check className="mr-1 h-3 w-3" /> Enrolled</Badge>
                        ) : (
                          <Button size="sm" className="gradient-brand" onClick={() => enroll.mutate(c.id)} disabled={enroll.isPending}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Enroll
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">No courses available yet for your level.</CardContent></Card>
      )}
    </DashboardShell>
  );
}
