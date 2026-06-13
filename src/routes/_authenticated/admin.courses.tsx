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
  const [form, setForm] = useState<any>({ code: "", title: "", description: "", department_id: "", level: "ND1", semester_id: "", lecturer_id: "" });

  const courses = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("*, departments(name,code), semesters(name), profiles!courses_lecturer_id_fkey(full_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const depts = useQuery({ queryKey: ["depts"], queryFn: async () => (await supabase.from("departments").select("id,name,code").order("name")).data ?? [] });
  const semesters = useQuery({ queryKey: ["semesters"], queryFn: async () => (await supabase.from("semesters").select("id,name,academic_sessions(name)").order("name")).data ?? [] });
  const lecturers = useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, profiles!inner(id,full_name,staff_id)").eq("role", "lecturer");
      return (data ?? []).map((r: any) => r.profiles).filter(Boolean);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      const { error } = await supabase.from("courses").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course created"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: string }) => {
      const { error } = await supabase.from("courses").update({ status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Course Management">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand"><Plus className="mr-2 h-4 w-4" /> New course</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create course</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{depts.data?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester</Label>
                <Select value={form.semester_id} onValueChange={(v) => setForm({ ...form, semester_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{semesters.data?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.academic_sessions?.name} — {s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Assign Lecturer</Label>
                <Select value={form.lecturer_id} onValueChange={(v) => setForm({ ...form, lecturer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{lecturers.data?.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.full_name}{l.staff_id ? ` (${l.staff_id})` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} className="gradient-brand" disabled={create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Dept</TableHead>
            <TableHead>Level</TableHead><TableHead>Lecturer</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {courses.isLoading ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow> :
              courses.data?.length ? courses.data.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline">{c.code}</Badge></TableCell>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.departments?.code ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{c.level}</Badge></TableCell>
                  <TableCell>{c.profiles?.full_name ?? "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status]} className="capitalize">{c.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    {c.status !== "approved" && <Button size="sm" className="gradient-emerald mr-1" onClick={() => setStatus.mutate({ id: c.id, status: "approved" })}><Check className="h-3.5 w-3.5" /></Button>}
                    {c.status === "approved" && <Button size="sm" variant="outline" className="mr-1" onClick={() => setStatus.mutate({ id: c.id, status: "archived" })}><Archive className="h-3.5 w-3.5" /></Button>}
                    {c.status !== "archived" && c.status !== "approved" && <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: c.id, status: "draft" })}><X className="h-3.5 w-3.5" /></Button>}
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No courses yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardShell>
  );
}
