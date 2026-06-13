import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();

  const fetchByStatus = async (status: "pending" | "approved" | "rejected") => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,matric_number,staff_id,approval_status,created_at,department_id,level, departments(name,code), user_roles(role)")
      .eq("approval_status", status)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  };

  const pending = useQuery({ queryKey: ["users", "pending"], queryFn: () => fetchByStatus("pending") });
  const approved = useQuery({ queryKey: ["users", "approved"], queryFn: () => fetchByStatus("approved") });
  const rejected = useQuery({ queryKey: ["users", "rejected"], queryFn: () => fetchByStatus("rejected") });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("profiles").update({ approval_status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const renderTable = (rows: any[] | undefined, loading: boolean, kind: "pending" | "approved" | "rejected") => (
    <Card className="shadow-card"><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>ID</TableHead>
          <TableHead>Email</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Action</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow> :
            rows?.length ? rows.map((u) => {
              const role = u.user_roles?.[0]?.role ?? u.user_roles?.role ?? "—";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{u.matric_number ?? u.staff_id ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.departments?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {kind !== "approved" && (
                      <Button size="sm" className="gradient-emerald mr-2" onClick={() => setStatus.mutate({ id: u.id, status: "approved" })}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {kind !== "rejected" && (
                      <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: u.id, status: "rejected" })}>
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No users</TableCell></TableRow>}
        </TableBody>
      </Table>
    </CardContent></Card>
  );

  return (
    <DashboardShell title="User Approvals">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending {pending.data ? `(${pending.data.length})` : ""}</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">{renderTable(pending.data, pending.isLoading, "pending")}</TabsContent>
        <TabsContent value="approved" className="mt-4">{renderTable(approved.data, approved.isLoading, "approved")}</TabsContent>
        <TabsContent value="rejected" className="mt-4">{renderTable(rejected.data, rejected.isLoading, "rejected")}</TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
