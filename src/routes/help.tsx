import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, GraduationCap, ShieldAlert, Users, Rocket, HelpCircle, ChevronDown } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Documentation — eLearning System" },
      { name: "description", content: "Getting started, role guides for Students, Lecturers and Admins, and answers to frequently asked questions." },
      { property: "og:title", content: "Help & Documentation — eLearning System" },
      { property: "og:description", content: "Full documentation for students, lecturers and admins." },
    ],
  }),
  component: HelpPage,
});

const SECTIONS = [
  {
    id: "getting-started",
    icon: Rocket,
    title: "Getting Started",
    tone: "from-indigo-500 to-blue-500",
    items: [
      { h: "1. Create an account", b: "Click Register, choose your role (student or lecturer) and submit your matric/staff ID. The first ever account becomes the department admin automatically." },
      { h: "2. Wait for approval", b: "The admin verifies your details against departmental records. You'll receive access as soon as your account is approved." },
      { h: "3. Sign in", b: "Use your email/matric number and password to sign in. You'll land on the dashboard that matches your role." },
      { h: "4. Complete your profile", b: "Upload an avatar and fill in your academic details so lecturers can identify you and the AI assistant can personalise recommendations." },
    ],
  },
  {
    id: "student",
    icon: Users,
    title: "Student Guide",
    tone: "from-amber-500 to-orange-500",
    items: [
      { h: "Enroll in courses", b: "Open My Courses → Browse → click Enrol on any approved course for your level." },
      { h: "Take CBT quizzes", b: "Go to Quizzes, select an open quiz and click Start. The timer begins immediately — answers auto-save." },
      { h: "Submit assignments", b: "In Assignments, upload your file before the deadline. You can re-upload until the due date." },
      { h: "AI Learning Assistant", b: "Ask course-specific questions from the Assistant page — it uses your current curriculum as context." },
      { h: "Smart study planner", b: "Generate a personalised weekly plan based on your assignments, exams and attendance history." },
    ],
  },
  {
    id: "lecturer",
    icon: GraduationCap,
    title: "Lecturer Guide",
    tone: "from-emerald-500 to-teal-500",
    items: [
      { h: "Upload materials & videos", b: "Open Materials / Videos → choose a course → upload the file. Students in that course see it instantly." },
      { h: "Create a CBT quiz", b: "In Quizzes, click New quiz, add questions, set duration, then publish. Auto-marking runs on submission." },
      { h: "Grade assignments", b: "Open Assignments → any pending submission → set a score and feedback. Students are notified." },
      { h: "Track attendance", b: "Generate a QR code per session; students scan to mark themselves present. Trends appear on your dashboard." },
      { h: "Announcements", b: "Post messages that only your enrolled students see — great for schedule changes." },
    ],
  },
  {
    id: "admin",
    icon: ShieldAlert,
    title: "Admin Guide",
    tone: "from-fuchsia-500 to-rose-500",
    items: [
      { h: "Approve users", b: "Users → Pending. Verify identity and click Approve or Reject." },
      { h: "Approve courses", b: "Courses → Pending. Lecturers can propose new courses; approve to publish." },
      { h: "Assign lecturers", b: "Courses → any course → Assign lecturer. Round-robin auto-assignment is also available on the Seed dashboard." },
      { h: "Seed demo data", b: "Admin → Seed → Populate academic data. Idempotent — safe to re-run." },
      { h: "Analytics", b: "Admin dashboard shows enrolment trends, active users, submissions and system health." },
    ],
  },
];

const FAQ = [
  { q: "I registered but can't sign in — what's wrong?", a: "Your account is likely awaiting admin approval. Contact the department office once, then try again after a few hours." },
  { q: "Can I use the demo accounts to test the platform?", a: "Yes — visit the Demo Accounts page for sample Student, Lecturer and Admin credentials." },
  { q: "How do I reset my password?", a: "On the sign-in page click 'Forgot password' and check your email for the reset link." },
  { q: "Does the eLearning System work offline?", a: "Core reading is cached in-browser, but submissions, quizzes and AI features require an internet connection." },
  { q: "Which browsers are supported?", a: "The latest two versions of Chrome, Edge, Safari and Firefox are supported. Mobile browsers on Android and iOS work fully." },
  { q: "How is my data protected?", a: "All data is encrypted in transit; row-level security policies ensure users can only access their own records. Roles are enforced server-side." },
  { q: "Can lecturers add new courses on their own?", a: "Lecturers can propose courses; an admin must approve them before students see them." },
  { q: "Is there a mobile app?", a: "The web app is fully responsive and installable as a PWA — add it to your home screen for an app-like experience." },
];

function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="gradient-brand py-16 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white">Documentation</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Help &amp; Documentation</h1>
          <p className="mt-3 max-w-2xl text-white/90">Everything you need to get productive on the eLearning System — from your first sign-in to advanced admin workflows.</p>
        </div>
      </section>

      {/* Table of contents */}
      <section className="mx-auto w-full max-w-5xl px-4 pt-10">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {[...SECTIONS, { id: "faq", icon: HelpCircle, title: "FAQ", tone: "from-slate-500 to-slate-700" }].map((s) => (
            <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card transition hover:border-primary/50 hover:shadow-elevated">
              <span className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${s.tone} text-white`}>
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium group-hover:text-primary">{s.title}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-4 py-12">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.tone} text-white shadow-elevated`}>
                <s.icon className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {s.items.map((i) => (
                <Card key={i.h} className="shadow-card">
                  <CardContent className="p-5">
                    <p className="font-semibold">{i.h}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{i.b}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-elevated">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="mt-5 space-y-2">
            {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>
      </section>

      <PublicFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="shadow-card">
      <button className="flex w-full items-center justify-between gap-4 p-5 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="flex items-start gap-2 font-medium">
          <BookOpen className="mt-0.5 h-4 w-4 text-primary shrink-0" /> {q}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="border-t border-border p-5 pt-4 text-sm text-muted-foreground">{a}</p>}
    </Card>
  );
}
