import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, ClipboardList, Users, BarChart3, ShieldCheck,
  Sparkles, GraduationCap, CheckCircle2, Video, MessageSquare, Award
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kenpoly Smart Learning Hub — Modern Polytechnic LMS" },
      { name: "description", content: "Cloud-based Learning Management System designed for polytechnic institutions. Courses, assessments, attendance and analytics in one place." },
      { property: "og:title", content: "Kenpoly Smart Learning Hub" },
      { property: "og:description", content: "Modern LMS for polytechnic institutions." },
    ],
  }),
  component: Home,
});

function Home() {
  const stats = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const [depts, courses] = await Promise.all([
        supabase.from("departments").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      return { departments: depts.count ?? 0, courses: courses.count ?? 0 };
    },
  });

  const features = [
    { icon: BookOpen, title: "Structured Courses", desc: "Department- and level-aware course catalog with admin approval workflows." },
    { icon: ClipboardList, title: "Assignments & CBT", desc: "Submit, grade and run timed quizzes with auto-marking." },
    { icon: Users, title: "Attendance Tracking", desc: "QR-code and verification-code attendance with semester reports." },
    { icon: Video, title: "Video Lessons", desc: "Stream lecture videos with watch progress tracking." },
    { icon: MessageSquare, title: "Discussions & Messaging", desc: "Course forums and direct chat between lecturers and students." },
    { icon: BarChart3, title: "Powerful Analytics", desc: "Enrollment, performance and engagement dashboards for every role." },
    { icon: Award, title: "Certificates", desc: "Auto-generated certificates with QR-based verification on completion." },
    { icon: ShieldCheck, title: "Secure by Design", desc: "Role-based access, encrypted auth and row-level data protection." },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 10%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> The all-in-one polytechnic LMS
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Smart learning for the modern polytechnic.
            </h1>
            <p className="mt-4 max-w-xl text-lg opacity-90">
              Manage courses, lecturers, students, assessments and analytics — all in one cloud platform built for ND and HND programs.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/register">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Link to="/courses">Browse courses</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm opacity-90">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Admin approval workflow</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> ND & HND ready</span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <Card className="relative shadow-elevated">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 border-b border-border pb-3 text-foreground">
                  <span className="grid h-8 w-8 place-items-center rounded-md gradient-brand text-primary-foreground"><GraduationCap className="h-4 w-4" /></span>
                  <p className="text-sm font-medium">Today's overview</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 text-foreground">
                  {[
                    { l: "Departments", v: stats.data?.departments ?? "—" },
                    { l: "Approved courses", v: stats.data?.courses ?? "—" },
                    { l: "Active session", v: "2025/26" },
                    { l: "Levels supported", v: "ND1–HND2" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">{s.l}</p>
                      <p className="text-xl font-semibold">{s.v}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything your academic team needs</h2>
          <p className="mt-3 text-muted-foreground">From enrollment to certification, Kenpoly LMS covers the full polytechnic academic workflow.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="shadow-card transition hover:shadow-elevated">
              <CardContent className="p-5">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary"><f.icon className="h-5 w-5" /></span>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to digitize your campus?</h2>
          <p className="max-w-2xl text-muted-foreground">Create your account, get approved by an admin, and start teaching or learning in minutes.</p>
          <div className="mt-4 flex gap-3">
            <Button asChild size="lg" className="gradient-brand"><Link to="/register">Create account</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
