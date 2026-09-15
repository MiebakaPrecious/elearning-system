import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/student/videos")({
  component: StudentVideos,
});

function StudentVideos() {
  const { user } = useAuth();
  const qc = useQueryClient();

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

  const progress = useQuery({
    queryKey: ["video-progress", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("video_progress").select("video_id,completed").eq("student_id", user!.id)).data ?? [],
  });
  const completedSet = new Set(progress.data?.filter((p) => p.completed).map((p) => p.video_id));

  const track = useMutation({
    mutationFn: async ({ videoId, completed }: { videoId: string; completed: boolean }) => {
      const { error } = await supabase
        .from("video_progress")
        .upsert({ student_id: user!.id, video_id: videoId, completed }, { onConflict: "student_id,video_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video-progress"] }),
    onError: (e) => toast.error(friendlyError(e)),
  });

  const play = async (videoId: string, url: string) => {
    track.mutate({ videoId, completed: completedSet.has(videoId) });
    if (url.startsWith("http")) return void window.open(url, "_blank");
    const { data: signed, error } = await supabase.storage.from("course-content").createSignedUrl(url, 3600);
    if (error || !signed) return toast.error("Could not open this video");
    window.open(signed.signedUrl, "_blank");
  };

  return (
    <DashboardShell title="Video Lessons">
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : data?.length ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {completedSet.size} of {data.length} lessons completed.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((v) => {
              const course = (v as unknown as { courses: { code: string; title: string } | null }).courses;
              const done = completedSet.has(v.id);
              return (
                <Card key={v.id} className="shadow-card transition hover:shadow-elevated">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg gradient-emerald text-white"><PlayCircle className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {course && <Badge variant="outline">{course.code}</Badge>}
                          {done && <Badge className="gradient-emerald text-white"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge>}
                        </div>
                        <p className="mt-2 font-semibold">{v.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{v.description ?? "Video lesson"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" className="gradient-brand" onClick={() => play(v.id, v.url)}>Watch</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => track.mutate({ videoId: v.id, completed: !done })}
                          >
                            {done ? "Mark as unwatched" : "Mark as completed"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">
          No video lessons yet for your registered courses.
        </CardContent></Card>
      )}
    </DashboardShell>
  );
}
