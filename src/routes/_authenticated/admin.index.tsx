import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, Building2, GraduationCap, CheckSquare, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, lecturers, depts, courses, pending, enrollments] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("departments").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
      ]);
      const { data: byDept } = await supabase.from("courses").select("department_id, departments(name)");
      const deptMap = new Map<string, number>();
      (byDept ?? []).forEach((c: any) => {
        const n = c.departments?.name ?? "Unassigned";
        deptMap.set(n, (deptMap.get(n) ?? 0) + 1);
      });
      const courseByDept = Array.from(deptMap, ([name, value]) => ({ name, value }));
      const { data: byStatus } = await supabase.from("courses").select("status");
      const statusMap = new Map<string, number>();
      (byStatus ?? []).forEach((c: any) => statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1));
      const courseByStatus = Array.from(statusMap, ([name, value]) => ({ name, value }));
      return {
        students: students.count ?? 0,
        lecturers: lecturers.count ?? 0,
        depts: depts.count ?? 0,
        courses: courses.count ?? 0,
        pending: pending.count ?? 0,
        enrollments: enrollments.count ?? 0,
        courseByDept,
        courseByStatus,
      };
    },
  });

  const COLORS = ["oklch(0.48 0.20 270)", "oklch(0.62 0.16 240)", "oklch(0.72 0.15 170)", "oklch(0.78 0.16 80)", "oklch(0.60 0.22 25)"];

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={data?.students ?? "—"} icon={Users} tone="primary" />
        <StatCard label="Total Lecturers" value={data?.lecturers ?? "—"} icon={GraduationCap} tone="info" />
        <StatCard label="Departments" value={data?.depts ?? "—"} icon={Building2} tone="accent" />
        <StatCard label="Courses" value={data?.courses ?? "—"} icon={BookOpen} tone="warning" />
        <StatCard label="Pending Approvals" value={data?.pending ?? "—"} icon={CheckSquare} tone="warning" />
        <StatCard label="Total Enrollments" value={data?.enrollments ?? "—"} icon={BarChart3} tone="primary" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-4 font-semibold">Courses by Department</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.courseByDept ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 255)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="oklch(0.48 0.20 270)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-4 font-semibold">Courses by Status</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data?.courseByStatus ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {(data?.courseByStatus ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
