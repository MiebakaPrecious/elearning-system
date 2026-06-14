import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, ClipboardList, Users, BarChart3,
  GraduationCap, CheckCircle2, Video, Award, Calendar, MapPin,
  UserPlus, LogIn, Code2, Cpu, Database, Layers, ShieldCheck, Sparkles
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KBSP Computer Science Hub — Department of Computer Science, Bori" },
      { name: "description", content: "The official learning platform of the Department of Computer Science at Kenule Beeson Saro-Wiwa Polytechnic, Bori. Courses, assessments, attendance and analytics for ND and HND students." },
      { property: "og:title", content: "KBSP Computer Science Hub" },
      { property: "og:description", content: "Smart learning platform for the Computer Science Department, KBSP Bori." },
    ],
  }),
  component: Home,
});

function Home() {
  const stats = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const [courses, students, lecturers] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "lecturer"),
      ]);
      return {
        courses: courses.count ?? 0,
        students: students.count ?? 0,
        lecturers: lecturers.count ?? 0,
      };
    },
  });

  const features = [
    { icon: BookOpen, title: "Structured Courses", desc: "ND1 → HND2 curriculum with semester-by-semester course plans." },
    { icon: ClipboardList, title: "Assignments & CBT", desc: "Submit, grade and run timed quizzes with auto-marking." },
    { icon: Users, title: "Attendance Tracking", desc: "QR-code and verification-code attendance with semester reports." },
    { icon: Video, title: "Video Lessons", desc: "Stream lecture videos with watch-progress tracking." },
    { icon: BarChart3, title: "Performance Analytics", desc: "Per-course GPA trends, assignment scores, attendance heatmaps." },
    { icon: Award, title: "Digital Certificates", desc: "Auto-generated certificates with QR verification on completion." },
    { icon: ShieldCheck, title: "Secure & Approved", desc: "Role-based access with admin approval for every new account." },
    { icon: Sparkles, title: "Mobile-Ready", desc: "Works perfectly on phones, tablets and laptops — dark mode included." },
  ];

  const calendar = [
    { period: "Sept – Dec", title: "First Semester Lectures", body: "ND1, ND2, HND1, HND2 classes begin. Course registration window." },
    { period: "January", title: "First Semester Exams", body: "Continuous assessment + CBT-based exams across all levels." },
    { period: "Feb – May", title: "Second Semester Lectures", body: "Second-semester courses, lab sessions and practicals." },
    { period: "June – July", title: "Second Semester Exams", body: "End-of-session exams, project defenses and SIWES briefing." },
    { period: "August", title: "Break & Results", body: "Result publication, transition to the next academic level." },
  ];

  const steps = [
    { n: "01", icon: UserPlus, title: "Create an account", body: "Register as a CS student or lecturer using your matric/staff ID." },
    { n: "02", icon: ShieldCheck, title: "Get approved", body: "An admin verifies your profile against the departmental record." },
    { n: "03", icon: BookOpen, title: "Join your courses", body: "Auto-eligible courses for your level appear in your dashboard." },
    { n: "04", icon: Award, title: "Learn & graduate", body: "Submit work, track progress, and earn your digital certificate." },
  ];

  const tracks = [
    { icon: Code2, label: "Software Dev" },
    { icon: Database, label: "Databases" },
    { icon: Cpu, label: "Computer Architecture" },
    { icon: Layers, label: "Web & Networks" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 10%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Department of Computer Science · KBSP Bori
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Smart learning for the Computer Science department.
            </h1>
            <p className="mt-4 max-w-xl text-lg opacity-90">
              The official digital classroom for ND and HND Computer Science students of Kenule Beeson Saro-Wiwa Polytechnic. Courses, assignments, CBT exams and attendance — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/register">New student? Register <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Link to="/auth">Returning? Sign in</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm opacity-90">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Admin-approved access</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> ND1 – HND2 curriculum</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Mobile + dark mode</span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <Card className="relative shadow-elevated">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 border-b border-border pb-3 text-foreground">
                  <span className="grid h-8 w-8 place-items-center rounded-md gradient-brand text-primary-foreground"><GraduationCap className="h-4 w-4" /></span>
                  <p className="text-sm font-medium">CS Department · Today</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 text-foreground">
                  {[
                    { l: "Approved courses", v: stats.data?.courses ?? "—" },
                    { l: "Active students", v: stats.data?.students ?? "—" },
                    { l: "Lecturers", v: stats.data?.lecturers ?? "—" },
                    { l: "Levels", v: "ND1 – HND2" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">{s.l}</p>
                      <p className="text-xl font-semibold">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {tracks.map((t) => (
                    <div key={t.label} className="rounded-md border border-border p-2 text-center text-foreground">
                      <t.icon className="mx-auto h-4 w-4 text-primary" />
                      <p className="mt-1 text-[10px]">{t.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything CS students and lecturers need</h2>
          <p className="mt-3 text-muted-foreground">A polished, enterprise-grade LMS focused on the Computer Science workflow — from first lecture to graduation.</p>
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

      {/* ACADEMIC CALENDAR */}
      <section id="calendar" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">Academic Calendar</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">The CS Department year at a glance</h2>
            <p className="mt-3 text-muted-foreground">Plan ahead — here's how a typical session flows for ND1 through HND2.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {calendar.map((c, i) => (
              <Card key={c.title} className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-md gradient-brand text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary">{c.period}</p>
                  <p className="mt-1 font-semibold">{c.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM STATISTICS */}
      <section id="stats" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Platform Statistics</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">The CS Hub in numbers</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: stats.data?.students ?? "—", l: "Registered students", sub: "Across ND1 – HND2", icon: Users, tone: "gradient-brand" },
            { v: stats.data?.lecturers ?? "—", l: "Active lecturers", sub: "Teaching & grading", icon: GraduationCap, tone: "gradient-emerald" },
            { v: stats.data?.courses ?? "—", l: "Approved courses", sub: "Available this session", icon: BookOpen, tone: "gradient-brand" },
            { v: "4", l: "Academic levels", sub: "ND1 · ND2 · HND1 · HND2", icon: Layers, tone: "gradient-emerald" },
          ].map((s) => (
            <Card key={s.l} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-bold">{s.v}</p>
                    <p className="mt-1 font-medium">{s.l}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.tone} text-primary-foreground`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-card py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">How it works</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">From registration to graduation</h2>
            <p className="mt-3 text-muted-foreground">Four simple steps to join the digital classroom.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <Card key={s.n} className="relative shadow-card transition hover:shadow-elevated">
                <CardContent className="p-6">
                  <span className="absolute right-4 top-4 text-3xl font-bold text-muted-foreground/20">{s.n}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-lg gradient-brand text-primary-foreground">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SCHOOL LOCATION */}
      <section id="location" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Find us</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">School location</h2>
          <p className="mt-3 text-muted-foreground">Kenule Beeson Saro-Wiwa Polytechnic, Bori, Rivers State, Nigeria.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Card className="shadow-card lg:col-span-2 overflow-hidden">
            <div className="aspect-[16/10] w-full">
              <iframe
                title="KBSP Bori Map"
                src="https://www.google.com/maps?q=Kenule+Beeson+Saro-Wiwa+Polytechnic+Bori&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Card>
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Address</p>
                <p className="mt-1 flex items-start gap-2 font-medium">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  Kenule Beeson Saro-Wiwa Polytechnic,<br />Bori, Khana LGA,<br />Rivers State, Nigeria.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Department</p>
                <p className="mt-1">School of Applied Sciences<br /><span className="text-muted-foreground">Department of Computer Science</span></p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</p>
                <p className="mt-1 text-sm">cs@kenpoly.edu.ng<br />+234 800 000 0000</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="https://www.google.com/maps/dir/?api=1&destination=Kenule+Beeson+Saro-Wiwa+Polytechnic+Bori" target="_blank" rel="noreferrer">Get directions</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* DUAL CTA — NEW + RETURNING */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          <Card className="overflow-hidden border-0 shadow-elevated">
            <div className="gradient-brand p-8 text-primary-foreground">
              <UserPlus className="h-8 w-8" />
              <h3 className="mt-4 text-2xl font-bold">New CS student?</h3>
              <p className="mt-2 opacity-90">Register with your matric number to start learning. Your account is reviewed and approved by the department admin.</p>
              <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
                <Link to="/register">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
          <Card className="overflow-hidden border-0 shadow-elevated">
            <div className="bg-card p-8">
              <span className="grid h-12 w-12 place-items-center rounded-lg gradient-emerald text-primary-foreground">
                <LogIn className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-2xl font-bold">Returning student or lecturer?</h3>
              <p className="mt-2 text-muted-foreground">Sign in with your matric number, staff ID, or email and continue where you left off.</p>
              <Button asChild size="lg" className="mt-6 gradient-brand">
                <Link to="/auth">Sign in to your portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
