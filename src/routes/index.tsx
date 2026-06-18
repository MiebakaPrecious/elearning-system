import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, ClipboardList, Users, BarChart3,
  GraduationCap, CheckCircle2, Video, Award, Calendar, MapPin,
  UserPlus, LogIn, Code2, Cpu, Database, Layers, ShieldCheck, Sparkles
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/hooks/use-count-up";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "eLearning System — Department of Computer Science, Bori" },
      { name: "description", content: "The official learning platform of the Department of Computer Science at Kenule Beeson Saro-Wiwa Polytechnic, Bori. Courses, assessments, attendance and analytics for ND and HND students." },
      { property: "og:title", content: "eLearning System" },
      { property: "og:description", content: "Smart learning platform for the Computer Science Department, KBSP Bori." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "eLearning System" },
      { name: "twitter:description", content: "Smart learning platform for the CS Department, KBSP Bori." },
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
    { icon: BookOpen, title: "Structured Courses", desc: "ND1 → HND2 curriculum, semester by semester.", tone: "from-indigo-500/15 to-indigo-500/5", iconTone: "text-indigo-500" },
    { icon: ClipboardList, title: "Assignments & CBT", desc: "Submit, grade, and run timed quizzes with auto-marking.", tone: "from-blue-500/15 to-blue-500/5", iconTone: "text-blue-500" },
    { icon: Users, title: "Attendance Tracking", desc: "QR-code attendance with semester analytics.", tone: "from-emerald-500/15 to-emerald-500/5", iconTone: "text-emerald-500" },
    { icon: Video, title: "Video Lessons", desc: "Stream lectures with watch-progress tracking.", tone: "from-rose-500/15 to-rose-500/5", iconTone: "text-rose-500" },
    { icon: BarChart3, title: "Performance Analytics", desc: "GPA trends, scores, attendance heatmaps.", tone: "from-amber-500/15 to-amber-500/5", iconTone: "text-amber-500" },
    { icon: Award, title: "Digital Certificates", desc: "Auto-generated certificates with QR verification.", tone: "from-fuchsia-500/15 to-fuchsia-500/5", iconTone: "text-fuchsia-500" },
    { icon: ShieldCheck, title: "Secure & Approved", desc: "Role-based access; admin approval per account.", tone: "from-cyan-500/15 to-cyan-500/5", iconTone: "text-cyan-500" },
    { icon: Sparkles, title: "Mobile + Dark Mode", desc: "Beautiful on phones, tablets and laptops.", tone: "from-violet-500/15 to-violet-500/5", iconTone: "text-violet-500" },
  ];

  const calendar = [
    { period: "Sept – Dec", title: "First Semester Lectures", body: "ND1, ND2, HND1, HND2 classes begin. Course registration window." },
    { period: "January", title: "First Semester Exams", body: "Continuous assessment + CBT-based exams across all levels." },
    { period: "Feb – May", title: "Second Semester Lectures", body: "Second-semester courses, lab sessions and practicals." },
    { period: "June – July", title: "Second Semester Exams", body: "End-of-session exams, project defenses and SIWES briefing." },
    { period: "August", title: "Break & Results", body: "Result publication, transition to the next academic level." },
  ];

  const steps = [
    { n: "01", icon: UserPlus, title: "Create an account", body: "Register with your matric/staff ID." },
    { n: "02", icon: ShieldCheck, title: "Get approved", body: "Admin verifies you against the departmental record." },
    { n: "03", icon: BookOpen, title: "Join your courses", body: "Auto-eligible courses appear in your dashboard." },
    { n: "04", icon: Award, title: "Learn & graduate", body: "Submit work, track progress, earn a certificate." },
  ];

  const tracks = [
    { icon: Code2, label: "Software Dev" },
    { icon: Database, label: "Databases" },
    { icon: Cpu, label: "Architecture" },
    { icon: Layers, label: "Web & Networks" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <HeroSlideshow />


      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Features</Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Everything CS students and lecturers need</h2>
          <p className="mt-3 text-muted-foreground">A polished, enterprise-grade LMS focused on the CS workflow — from first lecture to graduation.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="group relative overflow-hidden border-border/60 shadow-card hover-lift">
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${f.tone} opacity-0 transition-opacity group-hover:opacity-100`} aria-hidden />
              <CardContent className="relative p-5">
                <span className={`mb-4 grid h-11 w-11 place-items-center rounded-xl border border-border bg-card ${f.iconTone} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ACADEMIC CALENDAR — Timeline */}
      <section id="calendar" className="bg-muted/30 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">Academic Calendar</Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">The CS Department year at a glance</h2>
            <p className="mt-3 text-muted-foreground">A typical session for ND1 through HND2.</p>
          </div>
          <div className="relative mt-14">
            {/* Timeline rail */}
            <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-border to-transparent md:left-1/2 md:-translate-x-1/2 md:block" aria-hidden />
            <ul className="space-y-6 md:space-y-10">
              {calendar.map((c, i) => {
                const semester = i < 2 ? 1 : i < 4 ? 2 : 0;
                const semesterLabel = semester === 1 ? "First Semester" : semester === 2 ? "Second Semester" : "Break";
                const semesterTone = semester === 1 ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                  : semester === 2 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20";
                const isLeft = i % 2 === 0;
                return (
                  <li key={c.title} className="relative md:grid md:grid-cols-2 md:gap-10">
                    <div className={`md:${isLeft ? "col-start-1" : "col-start-2"}`}>
                      <Card className="ml-12 shadow-card hover-lift md:ml-0">
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${semesterTone}`}>{semesterLabel}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{c.period}</span>
                          </div>
                          <p className="mt-2 font-semibold">{c.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                        </CardContent>
                      </Card>
                    </div>
                    {/* Node */}
                    <span className="absolute left-4 top-5 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border-4 border-background gradient-brand text-[10px] font-bold text-primary-foreground md:left-1/2">
                      {i + 1}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* PLATFORM STATISTICS */}
      <section id="stats" className="mx-auto max-w-7xl px-4 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Platform Statistics</Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">The eLearning System in numbers</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: stats.data?.students ?? 0, l: "Registered students", sub: "Across ND1 – HND2", icon: Users, tone: "gradient-brand" },
            { v: stats.data?.lecturers ?? 0, l: "Active lecturers", sub: "Teaching & grading", icon: GraduationCap, tone: "gradient-emerald" },
            { v: stats.data?.courses ?? 0, l: "Approved courses", sub: "Available this session", icon: BookOpen, tone: "gradient-brand" },
            { v: 4, l: "Academic levels", sub: "ND1 · ND2 · HND1 · HND2", icon: Layers, tone: "gradient-emerald" },
          ].map((s) => (
            <Card key={s.l} className="shadow-card hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-bold tracking-tight">
                      <CountUp value={Number(s.v) || 0} />
                    </p>
                    <p className="mt-1 font-medium">{s.l}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.tone} text-primary-foreground shadow-elevated`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-card py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">How it works</Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">From registration to graduation</h2>
            <p className="mt-3 text-muted-foreground">Four simple steps to join the digital classroom.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <Card key={s.n} className="relative shadow-card hover-lift">
                <CardContent className="p-6">
                  <span className="absolute right-4 top-3 text-4xl font-bold text-muted-foreground/15">{s.n}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-lg gradient-brand text-primary-foreground shadow-elevated">
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
      <section id="location" className="mx-auto max-w-7xl px-4 py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-3">Find us</Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Visit the department</h2>
          <p className="mt-3 text-muted-foreground">Kenule Beeson Saro-Wiwa Polytechnic, Bori, Rivers State, Nigeria.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Card className="overflow-hidden shadow-card lg:col-span-2 p-0">
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
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Address</p>
                <p className="mt-1 flex items-start gap-2 font-medium">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <span>Kenule Beeson Saro-Wiwa Polytechnic,<br />Bori, Khana LGA,<br />Rivers State, Nigeria.</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Department</p>
                <p className="mt-1 text-sm">School of Applied Sciences<br /><span className="text-muted-foreground">Department of Computer Science</span></p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</p>
                <p className="mt-1 text-sm">cs@kenpoly.edu.ng<br />+234 800 000 0000</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="https://www.google.com/maps/dir/?api=1&destination=Kenule+Beeson+Saro-Wiwa+Polytechnic+Bori" target="_blank" rel="noreferrer">
                  <MapPin className="mr-2 h-4 w-4" /> Get directions
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* DUAL CTA */}
      <section className="bg-muted/40 py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
          <Card className="overflow-hidden border-0 shadow-elevated hover-lift">
            <div className="gradient-brand p-8 text-primary-foreground">
              <UserPlus className="h-8 w-8" />
              <h3 className="mt-4 text-2xl font-bold">New CS student?</h3>
              <p className="mt-2 text-white/85">Register with your matric number to start learning. Your account is reviewed by the department admin.</p>
              <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
                <Link to="/register">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>
          <Card className="overflow-hidden border-0 shadow-elevated hover-lift">
            <div className="bg-card p-8">
              <span className="grid h-12 w-12 place-items-center rounded-lg gradient-emerald text-primary-foreground shadow-elevated">
                <LogIn className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-2xl font-bold">Returning student or lecturer?</h3>
              <p className="mt-2 text-muted-foreground">Sign in with your matric number, staff ID or email and continue where you left off.</p>
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
