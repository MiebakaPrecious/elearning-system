import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ranks")({
  component: AdminRanks,
});

function AdminRanks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sort_order: 0 });

  const ranks = useQuery({ queryKey: ["admin-ranks"], queryFn: async () => (await supabase.from("lecturer_ranks").select("*").order("sort_order")).data ?? [] });
  const create = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("lecturer_ranks").insert(form); if (error) throw error; },
    onSuccess: () => { toast.success("Rank added"); qc.invalidateQueries({ queryKey: ["admin-ranks"] }); setOpen(false); setForm({ name: "", sort_order: 0 }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lecturer_ranks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["admin-ranks"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardShell title="Lecturer Ranks">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand"><Plus className="mr-2 h-4 w-4" /> New rank</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add lecturer rank</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Rank name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter><Button className="gradient-brand" onClick={() => create.mutate()}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {ranks.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{r.sort_order}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardShell>
  );
}
