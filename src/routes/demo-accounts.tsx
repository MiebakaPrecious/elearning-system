import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, ShieldAlert, GraduationCap, Users, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/demo-accounts")({
  head: () => ({
    meta: [
      { title: "Demo Accounts — eLearning System" },
      { name: "description", content: "Sample Student, Lecturer and Admin credentials to explore the eLearning System." },
      { property: "og:title", content: "Demo Accounts — eLearning System" },
      { property: "og:description", content: "Try Student, Lecturer and Admin dashboards with sample credentials." },
    ],
  }),
  component: DemoAccountsPage,
});

const PASSWORD = "Demo1234!";

const ACCOUNTS = [
  {
    role: "Administrator",
    icon: ShieldAlert,
    tone: "from-indigo-500 to-blue-500",
    email: "admin@kenpoly.demo",
    perks: ["Approve users & courses", "Seed demo data", "System analytics", "Manage lecturers & students"],
  },
  {
    role: "Lecturer",
    icon: GraduationCap,
    tone: "from-emerald-500 to-teal-500",
    email: "lecturer1@kenpoly.demo",
    perks: ["Upload materials & videos", "Create CBT quizzes", "Grade assignments", "Track attendance"],
  },
  {
    role: "Student (ND1)",
    icon: Users,
    tone: "from-amber-500 to-orange-500",
    email: "student.nd1.1@kenpoly.demo",
    perks: ["Enroll in courses", "Take CBT quizzes", "AI Learning Assistant", "Smart study planner"],
  },
] as const;

function DemoAccountsPage() {
  const [copied, setCopied] = useState<string>("");
  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="gradient-brand py-16 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white">Demonstration only</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Demo accounts</h1>
          <p className="mt-3 max-w-2xl text-white/90">
            Sign in with any of the sample credentials below to explore the Student, Lecturer, or Admin experience. These accounts are seeded for demonstration purposes and are periodically reset.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {ACCOUNTS.map((a) => (
            <Card key={a.role} className="shadow-card hover-lift overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${a.tone}`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${a.tone} text-white shadow-elevated`}>
                    <a.icon className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="text-[10px]">DEMO</Badge>
                </div>
                <p className="mt-4 text-lg font-semibold">{a.role}</p>

                <div className="mt-4 space-y-3">
                  <Field label="Email" value={a.email} onCopy={() => copy(a.email, `${a.role} email`)} copied={copied === `${a.role} email`} />
                  <Field label="Password" value={PASSWORD} onCopy={() => copy(PASSWORD, `${a.role} password`)} copied={copied === `${a.role} password`} />
                </div>

                <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
                  {a.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary" /> {p}
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-6 w-full gradient-brand">
                  <Link to="/auth">Sign in <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-2 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">These are demo accounts</p>
              <p className="text-sm text-muted-foreground">Do not store real data. Admins can regenerate credentials from the seed dashboard at any time.</p>
            </div>
            <Button asChild variant="outline"><Link to="/help">Read the guides</Link></Button>
          </CardContent>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}

function Field({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <code className="truncate text-sm font-medium">{value}</code>
        <button
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
