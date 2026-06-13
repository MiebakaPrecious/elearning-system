import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Send, FileEdit } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lecturer/courses")({
  component: LecturerCourses,
});

function LecturerCourses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["lect-courses", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("courses").select("*, departments(name,code), semesters(name)").eq("lecturer_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submitForApproval = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("courses").update({ status: "pending_approval" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Submitted for approval"); qc.invalidateQueries({ queryKey: ["lect-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardShell title="My Courses">
      <Card className="shadow-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Dept</TableHead>
            <TableHead>Level</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow> :
              data?.length ? data.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.code}</Badge></TableCell>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.departments?.code ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{c.level}</Badge></TableCell>
                  <TableCell><Badge className="capitalize">{c.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    {c.status === "draft" && (
                      <Button size="sm" className="gradient-brand" onClick={() => submitForApproval.mutate(c.id)}>
                        <Send className="mr-1 h-3.5 w-3.5" /> Submit for approval
                      </Button>
                    )}
                    {c.status === "approved" && <Badge className="gradient-emerald text-white"><FileEdit className="mr-1 h-3 w-3" /> Live</Badge>}
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No courses yet. Admin must assign one to you.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardShell>
  );
}
