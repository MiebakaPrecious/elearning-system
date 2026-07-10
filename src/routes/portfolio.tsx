import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Layers, Server, Cpu, Sparkles, ShieldCheck, BarChart3,
  BookOpen, GraduationCap, Users, Github, ExternalLink, ArrowRight, Zap,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Case Study — eLearning System" },
      { name: "description", content: "Project goals, architecture, technology stack, key features, AI capabilities and metrics for the eLearning System." },
      { property: "og:title", content: "eLearning System — Case Study" },
      { property: "og:description", content: "A production-ready, AI-powered LMS built with TanStack Start, Supabase and Lovable AI." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="gradient-brand py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white">Case study</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">eLearning System</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            A production-ready, AI-powered Learning Management System for a Computer Science department — designed, built and shipped end-to-end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/demo-accounts">Try the demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <a href="https://github.com" target="_blank" rel="noreferrer"><Github className="mr-2 h-4 w-4" /> Source on GitHub</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="mx-auto -mt-10 w-full max-w-6xl px-4">
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "50+", l: "React components", i: Layers },
            { v: "30+", l: "Routes & pages", i: BookOpen },
            { v: "20+", l: "Database tables", i: Server },
            { v: "4", l: "User roles", i: ShieldCheck },
          ].map((m) => (
            <div key={m.l} className="flex items-center gap-3 p-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground"><m.i className="h-5 w-5" /></span>
              <div>
                <p className="text-2xl font-bold">{m.v}</p>
                <p className="text-xs text-muted-foreground">{m.l}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Badge variant="secondary" className="mb-3">Project goals</Badge>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why this project exists</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { t: "Replace paper workflows", b: "Move course registration, attendance, assignments and exams into a single digital platform." },
            { t: "Give students real feedback", b: "Auto-marked CBT quizzes, GPA analytics and an AI tutor that understands the curriculum." },
            { t: "Empower lecturers", b: "One place to publish materials, run quizzes, track attendance and grade submissions." },
          ].map((g) => (
            <Card key={g.t} className="shadow-card hover-lift">
              <CardContent className="p-6">
                <p className="font-semibold">{g.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{g.b}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Badge variant="secondary" className="mb-3">Architecture</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Modern edge-first stack</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Server-side rendered React on Cloudflare Workers, backed by a Postgres database with row-level security and an AI Gateway for intelligent features.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ArchCard icon={Layers} title="Frontend" items={[
              "TanStack Start v1 (React 19)",
              "TanStack Router (file-based, type-safe)",
              "TanStack Query for data",
              "Tailwind CSS v4 + shadcn/ui",
              "Recharts for analytics",
            ]} />
            <ArchCard icon={Server} title="Backend" items={[
              "Supabase Postgres + Auth",
              "Row-Level Security everywhere",
              "createServerFn (typed RPC)",
              "Server routes for webhooks/API",
              "Migration-based schema",
            ]} />
            <ArchCard icon={Cpu} title="AI &amp; Infra" items={[
              "Lovable AI Gateway",
              "Streaming chat completions",
              "Curriculum-aware prompts",
              "Cloudflare Workers runtime",
              "Auto-generated route tree",
            ]} />
          </div>

          <Card className="mt-6 shadow-card">
            <CardContent className="p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Request flow</p>
              <pre className="overflow-x-auto rounded-lg bg-background p-4 text-xs leading-relaxed text-muted-foreground">
{`Browser
  │  useSuspenseQuery / useServerFn
  ▼
TanStack Start (Cloudflare Worker)
  │  createServerFn + requireSupabaseAuth
  ▼
Supabase Postgres (RLS)
  │
  └──► Lovable AI Gateway (streaming) ──► Student assistant / planner`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Badge variant="secondary" className="mb-3">Key features</Badge>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">What's inside</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, t: "Role-based dashboards", b: "Distinct Admin, Lecturer and Student experiences with tailored navigation and analytics." },
            { icon: BookOpen, t: "Full CS curriculum", b: "ND1 → HND2 courses, materials, videos, announcements and discussions." },
            { icon: GraduationCap, t: "CBT quizzes", b: "Timed, auto-marked assessments with multiple question types and instant scoring." },
            { icon: BarChart3, t: "Analytics", b: "Enrolment trends, attendance heatmaps, submission stats and engagement metrics." },
            { icon: Sparkles, t: "AI Assistant", b: "Course-aware chat tutor with streaming responses and personalised recommendations." },
            { icon: ShieldCheck, t: "Secure by design", b: "RLS policies, security-definer role checks, and server-verified permissions." },
          ].map((f) => (
            <Card key={f.t} className="shadow-card hover-lift">
              <CardContent className="p-5">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground"><f.icon className="h-5 w-5" /></span>
                <p className="font-semibold">{f.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.b}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI capabilities */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Badge variant="secondary" className="mb-3">AI capabilities</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Where intelligence lives</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Course-aware tutor", b: "Chats grounded in the student's current curriculum and open assignments." },
              { t: "Smart study planner", b: "Generates a weekly plan optimised for deadlines and attendance history." },
              { t: "Recommendations", b: "Suggests materials and quizzes based on performance gaps." },
              { t: "Streaming responses", b: "Low-latency SSE from the AI Gateway for a ChatGPT-like feel." },
            ].map((f) => (
              <Card key={f.t} className="shadow-card hover-lift">
                <CardContent className="p-5">
                  <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg gradient-emerald text-primary-foreground"><Zap className="h-5 w-5" /></span>
                  <p className="font-semibold">{f.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.b}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots placeholders */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Badge variant="secondary" className="mb-3">Screenshots</Badge>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">A look inside</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            { label: "Landing page", route: "/" },
            { label: "Student dashboard", route: "/dashboard" },
            { label: "AI Assistant", route: "/dashboard" },
            { label: "Admin analytics", route: "/dashboard" },
          ].map((s) => (
            <Card key={s.label} className="overflow-hidden shadow-card hover-lift">
              <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-primary/20 via-primary/5 to-background text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs">Live preview</p>
                </div>
              </div>
              <CardContent className="flex items-center justify-between p-4">
                <p className="text-sm font-medium">{s.label}</p>
                <Button asChild variant="ghost" size="sm">
                  <Link to={s.route}>Open <ExternalLink className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to explore?</h2>
          <p className="mt-3 text-muted-foreground">Grab a demo account and take the full platform for a spin — no setup required.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gradient-brand"><Link to="/demo-accounts">See demo credentials</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/help">Read the docs</Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function ArchCard({ icon: Icon, title, items }: { icon: typeof Layers; title: string; items: string[] }) {
  return (
    <Card className="shadow-card hover-lift">
      <CardContent className="p-6">
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground"><Icon className="h-5 w-5" /></span>
        <p className="text-lg font-semibold">{title}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {items.map((i) => <li key={i}>• {i}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}
