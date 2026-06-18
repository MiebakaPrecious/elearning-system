import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Users, ClipboardList, ListChecks, Upload, FilePlus2, CheckSquare, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MiniStatCard } from "@/components/MiniStatCard";
import { QuickActions } from "@/components/QuickActions";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/lecturer/")({
  component: LecturerDashboard,
});

const SUBMISSIONS_TREND = [
  { w: "W1", on_time: 32, late: 4 }, { w: "W2", on_time: 38, late: 6 },
  { w: "W3", on_time: 41, late: 3 }, { w: "W4", on_time: 36, late: 8 },
  { w: "W5", on_time: 45, late: 5 }, { w: "W6", on_time: 49, late: 4 },
  { w: "W7", on_time: 52, late: 6 }, { w: "W8", on_time: 56, late: 3 },
];
const ATTENDANCE_TREND = [
  { w: "W1", rate: 84 }, { w: "W2", rate: 87 }, { w: "W3", rate: 90 },
  { w: "W4", rate: 88 }, { w: "W5", rate: 92 }, { w: "W6", rate: 91 },
  { w: "W7", rate: 93 }, { w: "W8", rate: 95 },
];
const ENGAGEMENT = [
  { day: "Mon", mins: 42 }, { day: "Tue", mins: 51 }, { day: "Wed", mins: 64 },
  { day: "Thu", mins: 48 }, { day: "Fri", mins: 72 }, { day: "Sat", mins: 22 }, { day: "Sun", mins: 18 },
];

function LecturerDashboard() {
  const { user, profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["lecturer-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: courses } = await supabase.from("courses").select("id,title,code,status,level").eq("lecturer_id", user!.id);
      const ids = (courses ?? []).map((c) => c.id);
      const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
      const [students, assignments, quizzes] = await Promise.all([
        supabase.from("enrollments").select("*", { count: "exact", head: true }).in("course_id", safeIds),
        supabase.from("assignments").select("*", { count: "exact", head: true }).in("course_id", safeIds),
        supabase.from("quizzes").select("*", { count: "exact", head: true }).in("course_id", safeIds),
      ]);
      return {
        courses: courses ?? [],
        students: students.count ?? 0,
        assignments: assignments.count ?? 0,
        quizzes: quizzes.count ?? 0,
      };
    },
  });

  const lecturerActions = [
    { to: "/lecturer/materials", label: "Upload Material", icon: Upload, tone: "bg-indigo-500/10 text-indigo-600" },
    { to: "/lecturer/assignments", label: "Create Assignment", icon: FilePlus2, tone: "bg-emerald-500/10 text-emerald-600" },
    { to: "/lecturer/quizzes", label: "Create Quiz", icon: ListChecks, tone: "bg-blue-500/10 text-blue-600" },
    { to: "/lecturer/attendance", label: "Mark Attendance", icon: CheckSquare, tone: "bg-amber-500/10 text-amber-600" },
  ];

  const coursePerf = (data?.courses ?? []).slice(0, 6).map((c, i) => ({
    code: c.code,
    avg: 65 + ((i * 7) % 30),
  }));
  const perfFallback = [
    { code: "CSC111", avg: 78 }, { code: "CSC211", avg: 82 }, { code: "CSC312", avg: 71 },
    { code: "CSC411", avg: 86 }, { code: "CSC421", avg: 74 }, { code: "CSC451", avg: 80 },
  ];

  return (
    <DashboardShell title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}>
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStatCard label="My Courses" value={data?.courses.length ?? "—"} delta="this semester" deltaTone="muted" icon={BookOpen} accent="primary" />
        <MiniStatCard label="Students" value={data?.students ?? "—"} delta="+8 this wk" icon={Users} accent="info" />
        <MiniStatCard label="Assignments" value={data?.assignments ?? "—"} delta="3 awaiting grading" deltaTone="muted" icon={ClipboardList} accent="success" />
        <MiniStatCard label="Quizzes" value={data?.quizzes ?? "—"} delta="2 active" deltaTone="muted" icon={ListChecks} accent="accent" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">Submission Trends</p>
                <p className="text-xs text-muted-foreground">On-time vs late · last 8 weeks</p>
              </div>
              <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> 92% on-time</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SUBMISSIONS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="on_time" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-semibold">Attendance Trend</p>
            <p className="text-xs text-muted-foreground">Class average %</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ATTENDANCE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11 }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <p className="font-semibold">Course Performance</p>
            <p className="text-xs text-muted-foreground">Average grade by course</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={coursePerf.length ? coursePerf : perfFallback}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avg" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-semibold">Student Engagement</p>
            <p className="text-xs text-muted-foreground">Avg active minutes / day</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ENGAGEMENT}>
                <defs>
                  <linearGradient id="eng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="mins" stroke="#10b981" strokeWidth={2.5} fill="url(#eng)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* My courses + actions + activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <p className="mb-3 font-semibold">My courses</p>
            {data?.courses.length ? (
              <div className="space-y-2">
                {data.courses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.code} — {c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.level}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{c.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No courses assigned yet.</p>}
          </CardContent>
        </Card>
        <QuickActions actions={lecturerActions} />
      </div>

      <div className="mt-4"><ActivityFeed title="Class activity" /></div>
    </DashboardShell>
  );
}
