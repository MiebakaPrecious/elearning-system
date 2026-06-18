import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, ClipboardList, ListChecks, CheckSquare, Sparkles, CalendarClock,
  Layers, FileCheck, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MiniStatCard } from "@/components/MiniStatCard";
import { QuickActions } from "@/components/QuickActions";
import { RecommendationsCard } from "@/components/RecommendationsCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

const PROGRESS_TREND = [
  { w: "W1", score: 62 }, { w: "W2", score: 68 }, { w: "W3", score: 71 },
  { w: "W4", score: 74 }, { w: "W5", score: 78 }, { w: "W6", score: 81 },
  { w: "W7", score: 83 }, { w: "W8", score: 86 },
];

function StudentDashboard() {
  const { user, profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["stu-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enrolls } = await supabase
        .from("enrollments")
        .select("course_id, courses(id,title,code,level)")
        .eq("student_id", user!.id);
      const ids = (enrolls ?? []).map((e: any) => e.course_id);
      const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
      const [assigns, subs, events] = await Promise.all([
        supabase.from("assignments").select("*", { count: "exact", head: true }).in("course_id", safeIds),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("student_id", user!.id),
        supabase.from("events").select("id,title,starts_at,location").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
      ]);
      const aCount = assigns.count ?? 0;
      const sCount = subs.count ?? 0;
      return {
        enrolls: enrolls ?? [],
        assigns: aCount,
        submitted: sCount,
        pending: Math.max(aCount - sCount, 0),
        completion: aCount ? Math.round((sCount / aCount) * 100) : 72,
        events: events.data ?? [],
      };
    },
  });

  const studentActions = [
    { to: "/student/courses", label: "Browse Courses", icon: Layers, tone: "bg-indigo-500/10 text-indigo-600" },
    { to: "/student/assignments", label: "Submit Assignment", icon: FileCheck, tone: "bg-emerald-500/10 text-emerald-600" },
    { to: "/student/planner", label: "View Planner", icon: CalendarClock, tone: "bg-blue-500/10 text-blue-600" },
    { to: "/student/assistant", label: "AI Assistant", icon: Sparkles, tone: "bg-fuchsia-500/10 text-fuchsia-600" },
  ];

  const completionData = [{ name: "completion", value: data?.completion ?? 72, fill: "#6366f1" }];

  return (
    <DashboardShell title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}>
      {/* Welcome banner — compact */}
      <Card className="mb-4 overflow-hidden border-0 shadow-card">
        <div className="relative gradient-hero p-5 text-primary-foreground">
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/80">{profile?.level ?? "Computer Science"} · {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}</p>
              <h2 className="mt-1 text-xl font-bold md:text-2xl">Keep learning, {profile?.full_name?.split(" ")[0] ?? "Student"} 👋</h2>
              <p className="mt-1 text-sm text-white/85">You're {data?.completion ?? 72}% through this semester's coursework. Stay consistent.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/student/assistant" className="rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"><Sparkles className="mr-1 inline h-3.5 w-3.5" />Ask AI</Link>
              <Link to="/student/planner" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-white/90"><CalendarClock className="mr-1 inline h-3.5 w-3.5" />Planner</Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStatCard label="Enrolled Courses" value={data?.enrolls.length ?? "—"} delta="this semester" deltaTone="muted" icon={BookOpen} accent="primary" />
        <MiniStatCard label="Assignments" value={data?.assigns ?? "—"} delta={`${data?.submitted ?? 0} submitted`} deltaTone="up" icon={ClipboardList} accent="info" />
        <MiniStatCard label="Pending" value={data?.pending ?? "—"} delta="needs action" deltaTone="muted" icon={ListChecks} accent="warning" />
        <MiniStatCard label="Completion" value={`${data?.completion ?? 72}%`} delta="+6% wk" icon={CheckSquare} accent="success" />
      </div>

      {/* Progress + Radial */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">Learning Progress</p>
                <p className="text-xs text-muted-foreground">Weekly score trend</p>
              </div>
              <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> +24 pts</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={PROGRESS_TREND}>
                <defs>
                  <linearGradient id="stuScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#stuScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex h-full flex-col p-5">
            <p className="font-semibold">Semester Goal</p>
            <p className="text-xs text-muted-foreground">Coursework completion</p>
            <div className="relative flex flex-1 items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={completionData} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-3xl font-bold">{data?.completion ?? 72}%</p>
                  <p className="text-[11px] text-muted-foreground">on track</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses + sidebar */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">My courses</p>
              <Link to="/student/courses" className="text-xs font-medium text-primary hover:underline">Browse catalog →</Link>
            </div>
            {data?.enrolls.length ? (
              <div className="space-y-2.5">
                {data.enrolls.slice(0, 5).map((e: any) => {
                  const prog = 30 + Math.floor(Math.random() * 60);
                  return (
                    <div key={e.course_id} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{e.courses?.code}</Badge>
                          <span className="text-sm font-medium">{e.courses?.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{prog}%</span>
                      </div>
                      <Progress value={prog} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                You're not enrolled yet. <Link to="/student/courses" className="text-primary underline">Browse catalog</Link>.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <QuickActions actions={studentActions} />
          <RecommendationsCard />
        </div>
      </div>
    </DashboardShell>
  );
}
