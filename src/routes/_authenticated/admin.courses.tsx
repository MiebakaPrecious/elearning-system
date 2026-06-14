import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Check, X, Archive } from "lucide-react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: AdminCourses,
});

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline", pending_approval: "secondary", approved: "default", archived: "destructive",
};

function AdminCourses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ code: "", title: "", description: "", level: "ND1", semester_id: "", lecturer_id: "" });

  const courses = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("*, semesters(name, academic_sessions(name)), profiles!courses_lecturer_id_fkey(full_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const semesters = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => (await supabase.from("semesters").select("id,name, academic_sessions(name)").order("name")).data ?? [],
  });
  const lecturers = useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, profiles!inner(id,full_name,staff_id)").eq("role", "lecturer");
      return (data ?? []).map((r) => r.profiles as unknown as { id: string; full_name: string; staff_id: string | null }).filter(Boolean);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | null> = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      const { error } = await supabase.from("courses").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course created"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); setOpen(false); },
    onError: (e) => toast.error((e as Error).message),
  });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: "draft" | "pending_approval" | "approved" | "archived" }) => {
      const { error } = await supabase.from("courses").update({ status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <DashboardShell title="Course Management">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand"><Plus className="mr-2 h-4 w-4" /> New course</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create CS course</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. COM 111" /></div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>Semester</Label>
                <Select value={form.semester_id} onValueChange={(v) => setForm({ ...form, semester_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{semesters.data?.map((s) => {
                    const sess = (s as unknown as { academic_sessions: { name: string } | null }).academic_sessions;
                    return <SelectItem key={s.id} value={s.id}>{sess?.name ?? ""} — {s.name}</SelectItem>;
                  })}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Assign Lecturer</Label>
                <Select value={form.lecturer_id} onValueChange={(v) => setForm({ ...form, lecturer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{lecturers.data?.map((l) => <SelectItem key={l.id} value={l.id}>{l.full_name}{l.staff_id ? ` (${l.staff_id})` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} className="gradient-brand" disabled={create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card"><CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Title</TableHead>
            <TableHead>Level</TableHead><TableHead>Lecturer</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {courses.isLoading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow> :
              courses.data?.length ? courses.data.map((c) => {
                const row = c as unknown as { id: string; code: string; title: string; level: string; status: string; profiles: { full_name: string } | null };
                return (
                <TableRow key={row.id}>
                  <TableCell><Badge variant="outline">{row.code}</Badge></TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell><Badge variant="secondary">{row.level}</Badge></TableCell>
                  <TableCell>{row.profiles?.full_name ?? "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[row.status]} className="capitalize">{row.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    {row.status !== "approved" && <Button size="sm" className="gradient-emerald mr-1" onClick={() => setStatus.mutate({ id: row.id, status: "approved" })}><Check className="h-3.5 w-3.5" /></Button>}
                    {row.status === "approved" && <Button size="sm" variant="outline" className="mr-1" onClick={() => setStatus.mutate({ id: row.id, status: "archived" })}><Archive className="h-3.5 w-3.5" /></Button>}
                    {row.status !== "archived" && row.status !== "approved" && <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: row.id, status: "draft" })}><X className="h-3.5 w-3.5" /></Button>}
                  </TableCell>
                </TableRow>
                );
              }) : <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No courses yet</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </CardContent></Card>
    </DashboardShell>
  );
}
