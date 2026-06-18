import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, BookOpen, GraduationCap, CheckSquare, UserCheck, ClipboardList,
  UserPlus, BookPlus, FilePlus2, ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MiniStatCard } from "@/components/MiniStatCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { QuickActions } from "@/components/QuickActions";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const LEVELS = ["ND1", "ND2", "HND1", "HND2"] as const;
const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const ENROLLMENT_TREND = [
  { m: "Jan", ND1: 42, ND2: 36, HND1: 28, HND2: 24 },
  { m: "Feb", ND1: 48, ND2: 39, HND1: 30, HND2: 26 },
  { m: "Mar", ND1: 55, ND2: 44, HND1: 33, HND2: 28 },
  { m: "Apr", ND1: 61, ND2: 47, HND1: 36, HND2: 30 },
  { m: "May", ND1: 68, ND2: 52, HND1: 39, HND2: 33 },
  { m: "Jun", ND1: 74, ND2: 58, HND1: 42, HND2: 35 },
];
const ATTENDANCE_TREND = [
  { w: "W1", rate: 86 }, { w: "W2", rate: 88 }, { w: "W3", rate: 91 },
  { w: "W4", rate: 89 }, { w: "W5", rate: 93 }, { w: "W6", rate: 90 },
  { w: "W7", rate: 94 }, { w: "W8", rate: 92 },
];
const COMPLETION = [
  { course: "CSC111", rate: 92 }, { course: "CSC211", rate: 87 },
  { course: "CSC312", rate: 78 }, { course: "CSC411", rate: 81 },
  { course: "CSC421", rate: 74 }, { course: "CSC451", rate: 88 },
];
const WEEKLY_ACTIVITY = [
  { d: "Mon", logins: 142, submissions: 38 },
  { d: "Tue", logins: 168, submissions: 52 },
  { d: "Wed", logins: 184, submissions: 61 },
  { d: "Thu", logins: 176, submissions: 48 },
  { d: "Fri", logins: 198, submissions: 73 },
  { d: "Sat", logins: 94, submissions: 22 },
  { d: "Sun", logins: 76, submissions: 18 },
];

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, lecturers, courses, pending, enrollments] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
      ]);
      const { data: byLevel } = await supabase.from("profiles").select("level").eq("approval_status", "approved");
      const levelMap = new Map<string, number>();
      LEVELS.forEach((l) => levelMap.set(l, 0));
      (byLevel ?? []).forEach((p: any) => {
        if (p.level && levelMap.has(p.level)) levelMap.set(p.level, (levelMap.get(p.level) ?? 0) + 1);
      });
      // fallback demo data when empty
      const total = Array.from(levelMap.values()).reduce((a, b) => a + b, 0);
      if (total === 0) {
        levelMap.set("ND1", 74); levelMap.set("ND2", 58); levelMap.set("HND1", 42); levelMap.set("HND2", 35);
      }
      const studentByLevel = Array.from(levelMap, ([name, value]) => ({ name, value }));
      return {
        students: students.count ?? 0,
        lecturers: lecturers.count ?? 0,
        courses: courses.count ?? 0,
        pending: pending.count ?? 0,
        enrollments: enrollments.count ?? 0,
        studentByLevel,
      };
    },
  });

  const adminActions = [
    { to: "/admin/users", label: "Add Student", icon: UserPlus, tone: "bg-indigo-500/10 text-indigo-600" },
    { to: "/admin/users", label: "Add Lecturer", icon: GraduationCap, tone: "bg-blue-500/10 text-blue-600" },
    { to: "/admin/courses", label: "Create Course", icon: BookPlus, tone: "bg-emerald-500/10 text-emerald-600" },
    { to: "/admin/courses", label: "Approve Courses", icon: ShieldCheck, tone: "bg-amber-500/10 text-amber-600" },
    { to: "/admin/announcements", label: "New Announcement", icon: FilePlus2, tone: "bg-fuchsia-500/10 text-fuchsia-600" },
    { to: "/admin/seed", label: "Seed Demo Data", icon: ClipboardList, tone: "bg-cyan-500/10 text-cyan-600" },
  ];

  return (
    <DashboardShell title="Admin Dashboard">
      {/* Stats — 6 compact cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MiniStatCard label="Total Students" value={data?.students ?? "—"} delta="+12.4%" icon={Users} accent="primary" />
        <MiniStatCard label="Total Lecturers" value={data?.lecturers ?? "—"} delta="+3" icon={GraduationCap} accent="info" />
        <MiniStatCard label="Total Courses" value={data?.courses ?? "—"} delta="+5" icon={BookOpen} accent="success" />
        <MiniStatCard label="Active Enrollments" value={data?.enrollments ?? "—"} delta="+8.2%" icon={UserCheck} accent="accent" />
        <MiniStatCard label="Pending Approvals" value={data?.pending ?? "—"} delta="needs review" deltaTone="muted" icon={CheckSquare} accent="warning" />
        <MiniStatCard label="Attendance Rate" value="91%" delta="+2.1%" icon={ClipboardList} accent="destructive" />
      </div>

      {/* Main charts row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">Course Enrollment Trends</p>
                <p className="text-xs text-muted-foreground">Last 6 months · by level</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ENROLLMENT_TREND}>
                <defs>
                  {LEVELS.map((l, i) => (
                    <linearGradient key={l} id={`g-${l}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {LEVELS.map((l, i) => (
                  <Area key={l} type="monotone" dataKey={l} stroke={COLORS[i]} strokeWidth={2} fill={`url(#g-${l})`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-semibold">Student Distribution</p>
            <p className="text-xs text-muted-foreground">By academic level</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data?.studentByLevel ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {(data?.studentByLevel ?? []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second charts row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-semibold">Attendance Trends</p>
            <p className="text-xs text-muted-foreground">Weekly average %</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ATTENDANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11 }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-semibold">Assignment Completion</p>
            <p className="text-xs text-muted-foreground">By course %</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={COMPLETION}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="course" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-semibold">Weekly Platform Activity</p>
            <p className="text-xs text-muted-foreground">Logins & submissions</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY_ACTIVITY}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="logins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="submissions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity + Quick actions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><ActivityFeed /></div>
        <QuickActions actions={adminActions} />
      </div>
    </DashboardShell>
  );
}
