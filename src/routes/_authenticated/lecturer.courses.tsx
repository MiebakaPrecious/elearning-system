import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Send, FileEdit, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/lecturer/courses")({
  component: LecturerCourses,
});

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;

function LecturerCourses() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", description: "", level: "ND1", semester_no: "1" });

  const { data, isLoading } = useQuery({
    queryKey: ["lect-courses", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("courses").select("*, semesters(name)").eq("lecturer_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        level: form.level as (typeof LEVELS)[number],
        semester_no: Number(form.semester_no),
        lecturer_id: user!.id,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course created as a draft");
      qc.invalidateQueries({ queryKey: ["lect-courses"] });
      setOpen(false);
      setForm({ code: "", title: "", description: "", level: "ND1", semester_no: "1" });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const submitForApproval = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("courses").update({ status: "pending_approval" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Submitted to admin for approval"); qc.invalidateQueries({ queryKey: ["lect-courses"] }); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Draft deleted"); qc.invalidateQueries({ queryKey: ["lect-courses"] }); },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const notApproved = profile && profile.approval_status !== "approved";

  return (
    <DashboardShell title="My Courses">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Create a course, then submit it for admin approval. Approved courses become visible to students at that level.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand" disabled={!!notApproved}><Plus className="mr-2 h-4 w-4" /> New course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create a course</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Course code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSC 315" /></div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Operating Systems" /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this course covers…" /></div>
              <div className="col-span-2">
                <Label>Semester</Label>
                <Select value={form.semester_no} onValueChange={(v) => setForm({ ...form, semester_no: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">First Semester</SelectItem>
                    <SelectItem value="2">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button className="gradient-brand" disabled={create.isPending || !form.code.trim() || !form.title.trim()} onClick={() => create.mutate()}>
                Create draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notApproved && (
        <Card className="mb-4 border-amber-500/40 shadow-card"><CardContent className="p-4 text-sm text-muted-foreground">
          Your lecturer account is still awaiting admin approval, so course creation is locked for now.
        </CardContent></Card>
      )}

      <Card className="shadow-card"><CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Title</TableHead>
            <TableHead>Level</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading…</TableCell></TableRow> :
              data?.length ? data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.code}</Badge></TableCell>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell><Badge variant="secondary">{c.level}</Badge></TableCell>
                  <TableCell><Badge className="capitalize">{c.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    {c.status === "draft" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="gradient-brand" onClick={() => submitForApproval.mutate(c.id)}>
                          <Send className="mr-1 h-3.5 w-3.5" /> Submit for approval
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                    {c.status === "pending_approval" && <Badge variant="secondary">Awaiting admin</Badge>}
                    {c.status === "approved" && <Badge className="gradient-emerald text-white"><FileEdit className="mr-1 h-3 w-3" /> Live</Badge>}
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No courses yet — create your first one.</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </CardContent></Card>
    </DashboardShell>
  );
}
