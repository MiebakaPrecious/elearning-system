import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Image as ImageIcon, Download } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/materials")({
  component: StudentMaterials,
});

function StudentMaterials() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["student-materials", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enr } = await supabase.from("enrollments").select("course_id").eq("student_id", user!.id);
      const ids = (enr ?? []).map((e) => e.course_id);
      if (!ids.length) return [];
      const { data: rows } = await supabase
        .from("materials")
        .select("*, courses(code,title)")
        .in("course_id", ids)
        .order("created_at", { ascending: false });
      return rows ?? [];
    },
  });

  const open = async (path: string | null) => {
    if (!path) return;
    if (path.startsWith("http")) return void window.open(path, "_blank");
    const { data: signed, error } = await supabase.storage.from("course-content").createSignedUrl(path, 3600);
    if (error || !signed) return toast.error("Could not open this file");
    window.open(signed.signedUrl, "_blank");
  };

  return (
    <DashboardShell title="Course Materials">
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => {
            const course = (m as unknown as { courses: { code: string; title: string } | null }).courses;
            const Icon = (m.file_type ?? "").startsWith("image") ? ImageIcon : FileText;
            return (
              <Card key={m.id} className="shadow-card transition hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      {course && <Badge variant="outline">{course.code}</Badge>}
                      <p className="mt-2 font-semibold">{m.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{m.description ?? "No description"}</p>
                      <Button size="sm" className="mt-3 gradient-brand" onClick={() => open(m.file_url)}>
                        <Download className="mr-1 h-3.5 w-3.5" /> Open
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">
          No materials yet. Register for courses and your lecturers' uploads will appear here.
        </CardContent></Card>
      )}
    </DashboardShell>
  );
}
