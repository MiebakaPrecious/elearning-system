import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/videos")({
  component: StudentVideos,
});

function StudentVideos() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["student-videos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enr } = await supabase.from("enrollments").select("course_id").eq("student_id", user!.id);
      const ids = (enr ?? []).map((e) => e.course_id);
      if (!ids.length) return [];
      const { data: rows } = await supabase
        .from("videos")
        .select("*, courses(code,title)")
        .in("course_id", ids)
        .order("created_at", { ascending: false });
      return rows ?? [];
    },
  });

  const play = async (url: string) => {
    if (url.startsWith("http")) return void window.open(url, "_blank");
    const { data: signed, error } = await supabase.storage.from("course-content").createSignedUrl(url, 3600);
    if (error || !signed) return toast.error("Could not open this video");
    window.open(signed.signedUrl, "_blank");
  };

  return (
    <DashboardShell title="Video Lessons">
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => {
            const course = (v as unknown as { courses: { code: string; title: string } | null }).courses;
            return (
              <Card key={v.id} className="shadow-card transition hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg gradient-emerald text-white"><PlayCircle className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      {course && <Badge variant="outline">{course.code}</Badge>}
                      <p className="mt-2 font-semibold">{v.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{v.description ?? "Video lesson"}</p>
                      <Button size="sm" className="mt-3 gradient-brand" onClick={() => play(v.url)}>Watch</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">
          No video lessons yet for your registered courses.
        </CardContent></Card>
      )}
    </DashboardShell>
  );
}
