import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, Layers, GraduationCap, CheckSquare, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, lecturers, courses, pending, enrollments, events, anns] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("events").select("id,title,starts_at,location").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
        supabase.from("announcements").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const { data: byLevel } = await supabase.from("courses").select("level");
      const levelMap = new Map<string, number>();
      LEVELS.forEach((l) => levelMap.set(l, 0));
      (byLevel ?? []).forEach((c) => {
        levelMap.set(c.level, (levelMap.get(c.level) ?? 0) + 1);
      });
      const courseByLevel = Array.from(levelMap, ([name, value]) => ({ name, value }));
      const { data: byStatus } = await supabase.from("courses").select("status");
      const statusMap = new Map<string, number>();
      (byStatus ?? []).forEach((c) => statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1));
      const courseByStatus = Array.from(statusMap, ([name, value]) => ({ name, value }));
      return {
        students: students.count ?? 0,
        lecturers: lecturers.count ?? 0,
        courses: courses.count ?? 0,
        pending: pending.count ?? 0,
        enrollments: enrollments.count ?? 0,
        courseByLevel,
        courseByStatus,
        events: events.data ?? [],
        announcements: anns.data ?? [],
      };
    },
  });

  const COLORS = ["oklch(0.48 0.20 270)", "oklch(0.62 0.16 240)", "oklch(0.72 0.15 170)", "oklch(0.78 0.16 80)", "oklch(0.60 0.22 25)"];

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Students" value={data?.students ?? "—"} icon={Users} tone="primary" />
        <StatCard label="Lecturers" value={data?.lecturers ?? "—"} icon={GraduationCap} tone="info" />
        <StatCard label="Courses" value={data?.courses ?? "—"} icon={BookOpen} tone="accent" />
        <StatCard label="Levels" value={4} icon={Layers} tone="warning" />
        <StatCard label="Pending Approvals" value={data?.pending ?? "—"} icon={CheckSquare} tone="warning" />
        <StatCard label="Total Enrollments" value={data?.enrollments ?? "—"} icon={BarChart3} tone="primary" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-4 font-semibold">Courses by Level</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.courseByLevel ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-3 font-semibold">Upcoming events</p>
            {data?.events.length ? (
              <ul className="space-y-3">
                {data.events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 border-l-2 border-primary pl-3">
                    <div>
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString()} · {e.location ?? "TBA"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="mb-3 font-semibold">Recent announcements</p>
            {data?.announcements.length ? (
              <ul className="space-y-3">
                {data.announcements.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No announcements yet.</p>}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
