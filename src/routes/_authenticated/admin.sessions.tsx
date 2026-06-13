import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/sessions")({
  component: AdminSessions,
});

function AdminSessions() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await supabase.from("academic_sessions").select("*, semesters(id,name)").order("name", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("academic_sessions").insert({ name, is_active: isActive }).select().single();
      if (error) throw error;
      // auto-create two semesters
      await supabase.from("semesters").insert([
        { session_id: data.id, name: "First Semester" },
        { session_id: data.id, name: "Second Semester" },
      ]);
    },
    onSuccess: () => { toast.success("Session created"); qc.invalidateQueries({ queryKey: ["sessions"] }); setOpen(false); setName(""); setIsActive(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academic_sessions").update({ is_active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Active session updated"); qc.invalidateQueries({ queryKey: ["sessions"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Academic Sessions & Semesters">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand"><Plus className="mr-2 h-4 w-4" /> New session</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create academic session</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Session name (e.g. 2026/2027)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Make active</p><p className="text-xs text-muted-foreground">Only one session can be active at a time.</p></div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} className="gradient-brand" disabled={create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Session</TableHead><TableHead>Semesters</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {sessions.data?.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.semesters.map((sem: any) => sem.name).join(", ") || "—"}</TableCell>
                <TableCell>{s.is_active ? <Badge className="gradient-emerald text-white">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                <TableCell className="text-right">{!s.is_active && <Button size="sm" variant="outline" onClick={() => toggle.mutate(s.id)}>Make active</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardShell>
  );
}
